#!/usr/bin/env python3
"""routine/collect.py — RSS fetch + dedup + age cut → tmp/state/candidates.json

호출: python scripts/routine/collect.py [--include-external tmp/state/external.json]

출력:
  tmp/state/raw_summary.json — 수집 통계 (sources_checked, feed_failures 등)
  tmp/state/candidates.json — 평가 대상 기사 리스트 (deduped, age-cut)
  tmp/state/external_plan.json — WebFetch/WebSearch 계획 (실패 피드 + 한국어 쿼리)

이 스크립트는 LLM 도구를 호출하지 않는다 (urllib만 사용). WebFetch/WebSearch 결과를
보강하려면 agent가 외부 도구를 호출 후 external.json을 작성하고 --include-external 로
재실행 또는 다음 단계(finalize.py)에 전달.
"""
from __future__ import annotations
import argparse
import datetime as _dt
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from xml.etree import ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from routine import common as C  # noqa: E402


def _make_ssl_context():
    """certifi 가 설치돼 있으면 그 CA 번들 사용.

    일부 피드(rss.arxiv.org)가 시스템 기본 CA 체인으로는
    CERTIFICATE_VERIFY_FAILED 로 실패하는 문제 대응. certifi 부재 시 None
    (urllib 기본 컨텍스트) — PyYAML 과 동일한 선택적 의존성 패턴.
    """
    try:
        import certifi
        import ssl
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return None


_SSL_CTX = _make_ssl_context()


def fetch_rss(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "AI-News-Brief/1.0"})
    with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_rss(xml_content: str, source_name: str, lang: str) -> list[dict]:
    articles: list[dict] = []
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        print(f"  ⚠️  parse error {source_name}: {e}", file=sys.stderr)
        return articles
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        url = (item.findtext("link") or "").strip()
        summary = (item.findtext("description") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        if title and url:
            articles.append({
                "title": title, "url": url, "summary": summary[:500],
                "published_at": pub, "source": source_name, "lang": lang,
            })

    for entry in root.findall("atom:entry", ns):
        title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
        link_elem = entry.find("atom:link", ns)
        url = link_elem.get("href", "") if link_elem is not None else ""
        summary = (entry.findtext("atom:summary", default="", namespaces=ns) or "").strip()
        pub = (entry.findtext("atom:published", default="", namespaces=ns) or "").strip()
        if title and url:
            articles.append({
                "title": title, "url": url, "summary": summary[:500],
                "published_at": pub, "source": source_name, "lang": lang,
            })

    return articles


def _compile_keyword_patterns(keywords_raw: str) -> list[re.Pattern]:
    """피드별 keywords (콤마 구분 문자열) → 정규식 리스트.

    ASCII 키워드는 단어 경계(\\b) 매칭 — 'AI'가 'KAIST'/'said'에 오매칭되는 것 방지.
    한글 등 비ASCII 키워드는 단순 부분 문자열 매칭.
    """
    pats: list[re.Pattern] = []
    for kw in str(keywords_raw or "").split(","):
        kw = kw.strip()
        if not kw:
            continue
        if all(ord(c) < 128 for c in kw):
            pats.append(re.compile(r"\b" + re.escape(kw) + r"\b", re.IGNORECASE))
        else:
            pats.append(re.compile(re.escape(kw), re.IGNORECASE))
    return pats


def filter_by_keywords(articles: list[dict], keywords_raw: str) -> list[dict]:
    """title+summary에 키워드가 하나라도 포함된 기사만 유지. keywords 미설정 시 전체 통과."""
    pats = _compile_keyword_patterns(keywords_raw)
    if not pats:
        return articles
    kept: list[dict] = []
    for a in articles:
        haystack = f"{a.get('title', '')} {a.get('summary', '')}"
        if any(p.search(haystack) for p in pats):
            kept.append(a)
    return kept


def main() -> int:
    parser = argparse.ArgumentParser(description="routine collect — RSS + dedup + age cut")
    parser.add_argument("--include-external", help="external.json 경로 (WebFetch/WebSearch 결과)")
    args = parser.parse_args()

    print("🔎 routine/collect.py 시작")

    # 회차 시작 — 이전 회차의 잔재 state 파일 정리.
    # 이렇게 하면 모델이 "evaluations.json 이미 있나?" 확인할 이유가 없어진다.
    # --include-external 호출(2단계 collect)에서는 정리하지 않음.
    if not args.include_external:
        for stale in ("evaluations.json", "external.json"):
            p = C.state_path(stale)
            if p.exists():
                p.unlink()
                print(f"   🧹 cleaned stale: tmp/state/{stale}")
        # batch 분할 evaluation 잔재 청소 (CLAUDE_CODE_MAX_OUTPUT_TOKENS 대응)
        state_dir = C.state_path("evaluations.json").parent
        for bp in state_dir.glob("evaluations_batch_*.json"):
            bp.unlink()
            print(f"   🧹 cleaned stale: tmp/state/{bp.name}")

    cfg = C.load_config()
    feeds = cfg["sources"]["rss_feeds"]
    print(f"   RSS 피드: {len(feeds)}개")

    raw: list[dict] = []
    feed_failures: list[dict] = []
    for feed in feeds:
        try:
            xml_content = fetch_rss(feed["url"])
            items = parse_rss(xml_content, feed["name"], feed.get("lang", "en"))
            if feed.get("keywords"):
                before = len(items)
                items = filter_by_keywords(items, feed["keywords"])
                raw.extend(items)
                print(f"   ✅  {feed['name']:20s} {len(items):3d} items (키워드 필터: {before} → {len(items)})")
            else:
                raw.extend(items)
                print(f"   ✅  {feed['name']:20s} {len(items):3d} items")
        except urllib.error.URLError as e:
            print(f"   ❌  {feed['name']:20s} fetch failed: {e.reason}")
            feed_failures.append({"source": feed["name"], "url": feed["url"],
                                  "lang": feed.get("lang", "en"), "reason": str(e.reason)})
        except Exception as e:
            print(f"   ❌  {feed['name']:20s} error: {e}")
            feed_failures.append({"source": feed["name"], "url": feed["url"],
                                  "lang": feed.get("lang", "en"), "reason": str(e)})

    # 외부 보강 결과 머지 (있을 때)
    external_added = 0
    if args.include_external:
        try:
            ext = C.read_json(Path(args.include_external))
            for entry in ext.get("articles", []):
                if not entry.get("title") or not entry.get("url"):
                    continue
                # 도메인 가드: G2 — rss 호스트 또는 web_fetch_fallback_domains
                allowed_hosts = {C.host_of(f["url"]) for f in feeds}
                allowed_hosts.update(cfg["sources"].get("web_fetch_fallback_domains", []))
                h = C.host_of(entry["url"])
                if h not in allowed_hosts and not any(d for d in allowed_hosts if h.endswith(d)):
                    print(f"   🚫  G2 차단: {h} ({entry.get('title', '')[:40]})")
                    continue
                raw.append({
                    "title": entry["title"], "url": entry["url"],
                    "summary": entry.get("summary", "")[:500],
                    "published_at": entry.get("published_at", ""),
                    "source": entry.get("source", "external"),
                    "lang": entry.get("lang", "ko"),
                })
                external_added += 1
            print(f"   ➕  external 보강: {external_added}개")
        except FileNotFoundError:
            print(f"   ⚠️  external.json 없음: {args.include_external}")
        except Exception as e:
            print(f"   ⚠️  external.json 처리 실패: {e}")

    # 중복 제거
    seen = C.load_seen_urls()
    new_articles: list[dict] = []
    new_seen: list[tuple[str, str]] = []
    for a in raw:
        h = C.url_hash(a["url"])
        if h in seen:
            continue
        a["_hash"] = h
        new_articles.append(a)
        new_seen.append((h, a["url"]))
    print(f"   📦 raw {len(raw)} → new {len(new_articles)} (dedup으로 {len(raw)-len(new_articles)} 제외)")

    # 기간 컷
    cfg_f = cfg["filtering"]
    now = C.utc_now()
    if cfg_f.get("incremental_from_last_run", True):
        last_run_at = C.read_last_run_at(default_hours=cfg_f.get("max_age_hours", 48))
        cutoff = last_run_at
    else:
        cutoff = now - _dt.timedelta(hours=cfg_f.get("max_age_hours", 48))
    hard_floor = now - _dt.timedelta(days=cfg_f.get("incremental_max_gap_days", 30))
    if cutoff < hard_floor:
        cutoff = hard_floor
    print(f"   ⏱  cutoff = {cutoff.isoformat()}")

    candidates: list[dict] = []
    dropped_by_age = 0
    fallback_first_seen = cfg_f.get("fallback_to_first_seen", False)
    for a in new_articles:
        dt = C.parse_pubdate(a.get("published_at", ""))
        if dt is None:
            if fallback_first_seen:
                candidates.append(a)
            else:
                dropped_by_age += 1
            continue
        if dt > cutoff:
            candidates.append(a)
        else:
            dropped_by_age += 1
    print(f"   ✂️  age cut: {len(new_articles)} → {len(candidates)} (탈락 {dropped_by_age})")

    # 핵심이슈 컨텍스트 — agent 가 일자/주간 핵심이슈를 통합 재작성할 때 입력.
    # news/issues/ 의 기존 JSON 을 읽어 전달만 한다 (순수 파일 IO — 판단은 agent 몫).
    now_kst = C.kst_now()
    today_str = now_kst.strftime("%Y-%m-%d")
    iso_year, iso_week, _ = now_kst.isocalendar()
    iso_week_str = f"{iso_year}-W{iso_week:02d}"
    issues_daily_dir = C.NEWS_DIR / "issues" / "daily"

    def _read_json_or_none(p: Path):
        try:
            return C.read_json(p)
        except Exception:
            return None

    week_start = now_kst.date() - _dt.timedelta(days=now_kst.weekday())
    week_dailies = []
    for i in range(7):
        d = week_start + _dt.timedelta(days=i)
        if d > now_kst.date():
            break
        dj = _read_json_or_none(issues_daily_dir / f"{d.isoformat()}.json")
        if dj:
            week_dailies.append(dj)

    # 토픽별 기존 '통합 동향' 본문 — agent 가 갱신 재작성할 때 입력으로 사용.
    topic_overviews: dict[str, str] = {}
    topics_dir = C.NEWS_DIR / "topics"
    if topics_dir.is_dir():
        for tf in topics_dir.glob("*.md"):
            try:
                text = tf.read_text(encoding="utf-8")
            except OSError:
                continue
            body = text.split("---", 2)[2] if text.startswith("---") and len(text.split("---", 2)) >= 3 else text
            # 첫 H1(제목) 라인 제거 후 본문만
            lines = [ln for ln in body.splitlines() if not ln.startswith("# ")]
            topic_overviews[tf.stem] = "\n".join(lines).strip()

    issues_context = {
        "date": today_str,
        "iso_week": iso_week_str,
        "today": _read_json_or_none(issues_daily_dir / f"{today_str}.json"),
        "week": _read_json_or_none(C.NEWS_DIR / "issues" / "weekly" / f"{iso_week_str}.json"),
        "week_dailies": week_dailies,
        "topic_overviews": topic_overviews,
    }
    C.write_json(C.state_path("issues_context.json"), issues_context)
    print(f"   🧭 issues_context: today={'있음' if issues_context['today'] else '없음'}, "
          f"week_dailies={len(week_dailies)}건, week={'있음' if issues_context['week'] else '없음'}, "
          f"topic_overviews={len(topic_overviews)}개")

    # 외부 보강 계획 (실패 피드 + WebSearch 큐)
    external_plan = {
        "feed_failures": feed_failures,
        "websearch_queries": cfg["sources"].get("web_search", {}).get("queries", [])
                              if cfg["sources"].get("web_search", {}).get("enabled") else [],
        "websearch_max_results": cfg["sources"].get("web_search", {}).get("max_results_per_query", 5),
        "web_fetch_fallback_domains": cfg["sources"].get("web_fetch_fallback_domains", []),
    }

    raw_summary = {
        "run_started_at": now.isoformat(),
        "sources_checked": len(feeds),
        "feed_failures": feed_failures,
        "total_scraped": len(raw),
        "total_new": len(new_articles),
        "articles_dropped_by_age": dropped_by_age,
        "external_added": external_added,
        "cutoff": cutoff.isoformat(),
    }

    C.write_json(C.state_path("raw_summary.json"), raw_summary)
    C.write_json(C.state_path("candidates.json"), {
        "run_started_at": now.isoformat(),
        "candidates": candidates,
        "new_seen": new_seen,
    })
    C.write_json(C.state_path("external_plan.json"), external_plan)

    # 평가 단계가 인스펙션 명령을 emit할 이유를 제거하기 위해 source/lang 분포를 사전 출력
    src_counts: dict[str, int] = {}
    lang_counts: dict[str, int] = {"en": 0, "ko": 0}
    for c in candidates:
        src_counts[c.get("source", "?")] = src_counts.get(c.get("source", "?"), 0) + 1
        lang_counts[c.get("lang", "en")] = lang_counts.get(c.get("lang", "en"), 0) + 1

    print(f"\n📊 candidates 분포 (인스펙션 불필요 — 아래 정보로 충분):")
    print(f"   total: {len(candidates)} | en: {lang_counts.get('en', 0)} | ko: {lang_counts.get('ko', 0)}")
    print(f"   source별:")
    for s, n in sorted(src_counts.items(), key=lambda kv: -kv[1]):
        print(f"     - {s}: {n}")

    print(f"\n✅  collect 완료: candidates {len(candidates)}개")
    print(f"   tmp/state/candidates.json, raw_summary.json, external_plan.json 작성됨")
    if feed_failures:
        print(f"   ⚠️  feed_failures {len(feed_failures)}건 — agent가 WebFetch fallback 권장")
    return 0


if __name__ == "__main__":
    sys.exit(main())
