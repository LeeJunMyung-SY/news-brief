"""routine 공용 헬퍼.

determinism 확보를 위해 routine 내 모든 스크립트가 이 모듈만 사용한다.
shell 명령은 emit하지 않고 Python pathlib + urllib.request 만 사용.
"""
from __future__ import annotations
import datetime as _dt
import hashlib
import io
import json
import re
import sys
from pathlib import Path
from typing import Any

# Windows cp949 환경에서 UTF-8 출력 강제 (validate.py와 동일 패턴)
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() not in ("utf-8", "utf8"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


PROJECT_ROOT = Path(__file__).resolve().parents[2]
STATE_DIR = PROJECT_ROOT / "tmp" / "state"
LOGS_DIR = PROJECT_ROOT / "logs"
NEWS_DIR = PROJECT_ROOT / "news"
WEEKLY_DIR = NEWS_DIR / "weekly"
SEEN_URLS_PATH = PROJECT_ROOT / "seen_urls.txt"
LAST_RUN_PATH = LOGS_DIR / "last_run.json"
RUN_LOG_PATH = LOGS_DIR / "run_log.jsonl"
CONFIG_PATH = PROJECT_ROOT / "config" / "config.yaml"

KST = _dt.timezone(_dt.timedelta(hours=9))


def utc_now() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


def kst_now() -> _dt.datetime:
    return utc_now().astimezone(KST)


def url_hash(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def slugify(text: str, length: int = 20) -> str:
    s = re.sub(r"[^a-z0-9가-힣\-]+", "-", text.lower()).strip("-")
    s = re.sub(r"-+", "-", s)
    return s[:length] or "untitled"


def ensure_state() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)


def state_path(name: str) -> Path:
    ensure_state()
    return STATE_DIR / name


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_config() -> dict:
    """yaml 의존성 없이 단순 파싱 — config.yaml은 평이한 구조."""
    try:
        import yaml  # noqa: F401
        return yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8"))
    except ImportError:
        pass

    text = CONFIG_PATH.read_text(encoding="utf-8")
    cfg: dict = {
        "topics": [],
        "filtering": {
            "importance_threshold": 6,
            "topic_threshold": 6,
            "max_articles_per_topic": 5,
            "max_age_hours": 48,
            "incremental_from_last_run": True,
            "incremental_max_gap_days": 30,
            "fallback_to_first_seen": False,
        },
        "sources": {"rss_feeds": [], "web_fetch_fallback_domains": [], "web_fetch_fallback": True},
        "storage": {
            "base_path": "news",
            "weekly_path": "news/weekly",
            "seen_urls_retention_days": 60,
        },
        "auto_tagging": {
            "enabled": True,
            "suggest_new_topics": True,
            "suggestion_min_count": 3,
        },
    }
    # 매우 단순한 라인 기반 파서 — rss_feeds 와 web_fetch_fallback_domains, filtering 키만 추출.
    feeds: list[dict] = []
    cur_feed: dict | None = None
    in_feeds = False
    in_fallback = False
    in_filtering = False
    in_topics = False
    cur_topic: dict | None = None
    fallback_domains: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        stripped = line.strip()
        indent = len(line) - len(line.lstrip())

        if line.startswith("topics:"):
            in_topics, in_feeds, in_fallback, in_filtering = True, False, False, False
            continue
        if line.startswith("filtering:"):
            in_filtering, in_topics, in_feeds, in_fallback = True, False, False, False
            continue
        if "rss_feeds:" in line and indent == 2:
            in_feeds, in_fallback = True, False
            continue
        if "web_fetch_fallback_domains:" in line:
            in_feeds, in_fallback = False, True
            continue
        if line.startswith("storage:") or line.startswith("logging:") or line.startswith("schedule_state:") or line.startswith("schedule:") or line.startswith("auto_tagging:"):
            in_feeds = in_fallback = in_filtering = in_topics = False
            continue

        if in_topics and stripped.startswith("- name:"):
            if cur_topic:
                cfg["topics"].append(cur_topic)
            cur_topic = {"name": stripped.split("name:", 1)[1].strip()}
            continue
        if in_topics and cur_topic is not None and ":" in stripped and not stripped.startswith("-"):
            k, v = stripped.split(":", 1)
            cur_topic[k.strip()] = v.strip().strip("'\"")
            continue

        if in_feeds and stripped.startswith("- name:"):
            if cur_feed:
                feeds.append(cur_feed)
            cur_feed = {"name": stripped.split("name:", 1)[1].strip()}
            continue
        if in_feeds and cur_feed is not None:
            if stripped.startswith("url:"):
                cur_feed["url"] = stripped.split("url:", 1)[1].strip()
            elif stripped.startswith("lang:"):
                cur_feed["lang"] = stripped.split("lang:", 1)[1].strip()
            continue

        if in_fallback and stripped.startswith("- "):
            fallback_domains.append(stripped[2:].strip())
            continue

        if in_filtering and ":" in stripped:
            k, v = stripped.split(":", 1)
            v = v.strip().strip("'\"")
            if v in ("true", "false"):
                cfg["filtering"][k.strip()] = v == "true"
            else:
                try:
                    cfg["filtering"][k.strip()] = int(v)
                except ValueError:
                    cfg["filtering"][k.strip()] = v
            continue

    if cur_feed:
        feeds.append(cur_feed)
    if cur_topic:
        cfg["topics"].append(cur_topic)
    cfg["sources"]["rss_feeds"] = feeds
    cfg["sources"]["web_fetch_fallback_domains"] = fallback_domains
    return cfg


def load_seen_urls() -> dict[str, str]:
    """returns {hash: first_seen_date}"""
    if not SEEN_URLS_PATH.exists():
        return {}
    out: dict[str, str] = {}
    for line in SEEN_URLS_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        parts = line.split()
        if len(parts) >= 3:
            out[parts[0]] = parts[2]
    return out


def write_seen_urls(seen: dict[str, str]) -> None:
    """seen: {hash: 'date<TAB>url' or 'date'}.

    파일 형식: '<hash> <url> <date>'.
    이 함수는 보존을 위해 hash와 date만 받고 url은 별도로 보관/머지한다.
    """
    raise NotImplementedError("use append_seen_urls + prune_seen_urls instead")


def append_seen_urls(new_entries: list[tuple[str, str]], today: str) -> None:
    """new_entries: list of (hash, url). today: ISO date YYYY-MM-DD."""
    SEEN_URLS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not SEEN_URLS_PATH.exists():
        SEEN_URLS_PATH.write_text(
            "# 처리된 URL 목록 (중복 방지용)\n# 에이전트가 자동으로 관리합니다 — 직접 편집하지 마세요\n# 형식: SHA256해시 URL 날짜\n\n",
            encoding="utf-8",
        )
    with SEEN_URLS_PATH.open("a", encoding="utf-8") as f:
        for h, u in new_entries:
            f.write(f"{h} {u} {today}\n")


def prune_seen_urls(retention_days: int) -> int:
    """오래된 항목 제거. 제거된 라인 수 반환."""
    if not SEEN_URLS_PATH.exists():
        return 0
    cutoff = (utc_now() - _dt.timedelta(days=retention_days)).date()
    removed = 0
    keep: list[str] = []
    for line in SEEN_URLS_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            keep.append(line)
            continue
        parts = line.split()
        if len(parts) >= 3:
            try:
                d = _dt.date.fromisoformat(parts[2])
                if d >= cutoff:
                    keep.append(line)
                else:
                    removed += 1
                    continue
            except Exception:
                keep.append(line)
        else:
            keep.append(line)
    SEEN_URLS_PATH.write_text("\n".join(keep) + "\n", encoding="utf-8")
    return removed


def parse_pubdate(s: str) -> _dt.datetime | None:
    """RFC822 또는 ISO8601 → datetime(UTC). 실패 시 None."""
    if not s:
        return None
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=_dt.timezone.utc)
        return dt
    except Exception:
        pass
    try:
        dt = _dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=_dt.timezone.utc)
        return dt
    except Exception:
        return None


def write_run_log(entry: dict) -> None:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    with RUN_LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def update_last_run(run_id: str) -> None:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    LAST_RUN_PATH.write_text(
        json.dumps({"last_run_at": utc_now().isoformat(), "last_run_id": run_id}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def read_last_run_at(default_hours: int) -> _dt.datetime:
    """logs/last_run.json 읽기. 실패 시 now - default_hours."""
    try:
        d = read_json(LAST_RUN_PATH)
        dt = _dt.datetime.fromisoformat(d["last_run_at"])
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=_dt.timezone.utc)
        return dt
    except Exception:
        return utc_now() - _dt.timedelta(hours=default_hours)


def host_of(url: str) -> str:
    from urllib.parse import urlparse
    try:
        return urlparse(url).hostname or ""
    except Exception:
        return ""


def make_run_id(now: _dt.datetime | None = None) -> str:
    now = now or kst_now()
    return f"run_{now.strftime('%Y%m%d')}_{now.strftime('%H%M%S')}"
