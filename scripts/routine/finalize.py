#!/usr/bin/env python3
"""routine/finalize.py — evaluations.json + candidates.json → 모든 output 파일 + 검증 + manifest

호출: python scripts/routine/finalize.py

전제:
  tmp/state/candidates.json   (collect.py 가 생성)
  tmp/state/evaluations.json  (agent 가 작성)
  tmp/state/raw_summary.json  (collect.py 가 생성)

evaluations.json 형식:
{
  "filter_criteria_version": "v1",
  "active_topics": ["llm_models", ...],
  "articles": [
    {
      "url": "...",
      "importance_score": 7,
      "importance_reasoning": "...",
      "topic_scores": {"llm_models": 8, ...},
      "user_topics": ["llm_models", ...],
      "auto_tags": ["#tag1", "#tag2"],
      "summary_ko": "2~3문장",
      "key_points_ko": ["불릿1", "불릿2", ...],
      "why_this_matters_ko": "1~2문장",
      "one_line_summary_ko": "digest용 한 줄 요약"
    },
    ...
  ],
  "emerging_topics": [
    {"name": "snake_case", "description": "...", "keywords": ["..."], "article_urls": ["..."], "count": 4}
  ]
}

이 스크립트가 처리하는 것:
  - importance/topic threshold 적용
  - 토픽별 max_articles_per_topic 랭킹
  - 기사 markdown (frontmatter + body) 작성
  - 회차 digest_HHMM.md
  - 일자 index.md (기존 회차 보존하며 머지)
  - 주간 weekly/{ISO}.md (머지)
  - seen_urls.txt append + prune
  - logs/run_log.jsonl append
  - logs/last_run.json 갱신
  - scripts/validate.py --news 호출
  - scripts/visualizer/build_manifest.py 호출
  - topics/suggested_topics.md 갱신 (emerging_topics 있을 때)

이 스크립트는 LLM 도구를 호출하지 않는다. 오직 결정론적 변환만 수행.
"""
from __future__ import annotations
import datetime as _dt
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from routine import common as C  # noqa: E402


def topic_label(cfg: dict, name: str) -> str:
    for t in cfg.get("topics", []):
        if t.get("name") == name:
            return t.get("label", name)
    return name


def write_article_md(article: dict, eval_: dict, run_id: str, scraped_at: str, out_dir: Path) -> Path:
    """단일 기사 markdown 작성. 반환: 작성된 경로."""
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = C.slugify(article.get("title", ""), 20)
    date_str = _dt.datetime.fromisoformat(scraped_at.replace("Z", "+00:00")).astimezone(C.KST).strftime("%Y%m%d")
    filename = f"{date_str}-{slug}.md"
    path = out_dir / filename

    fm_lines = [
        "---",
        f'title: "{article.get("title", "").replace(chr(34), chr(39))}"',
        f'url: "{article.get("url", "")}"',
        f'source: "{article.get("source", "")}"',
        f'lang: "{article.get("lang", "en")}"',
        f'published_at: "{article.get("published_at", "")}"',
        f'scraped_at: "{scraped_at}"',
        "user_topics:",
    ]
    for t in eval_.get("user_topics", []):
        fm_lines.append(f"  - {t}")
    fm_lines.append("auto_tags:")
    for tag in eval_.get("auto_tags", []):
        clean_tag = tag.lstrip("#")
        fm_lines.append(f'  - "#{clean_tag}"')
    fm_lines.append(f'importance_score: {eval_.get("importance_score", 0)}')
    fm_lines.append(f'importance_reasoning: "{eval_.get("importance_reasoning", "").replace(chr(34), chr(39))}"')
    fm_lines.append("topic_scores:")
    for tk, tv in eval_.get("topic_scores", {}).items():
        fm_lines.append(f"  {tk}: {tv}")
    fm_lines.append(f'filter_criteria_version: "{eval_.get("filter_criteria_version", "v1")}"')
    fm_lines.append(f'run_id: "{run_id}"')
    fm_lines.append("---")
    fm_lines.append("")

    body_lines = [
        f"# {article.get('title', '')}",
        "",
        f"**Source**: {article.get('source', '')} | **Published**: {article.get('published_at', '')} | **Topics**: {', '.join(eval_.get('user_topics', []))}",
        "",
        "## Summary",
        eval_.get("summary_ko", ""),
        "",
        "## Key Points",
    ]
    for kp in eval_.get("key_points_ko", []):
        body_lines.append(f"- {kp}")
    body_lines.extend([
        "",
        "## Why This Matters",
        eval_.get("why_this_matters_ko", ""),
        "",
        f"[원문 읽기]({article.get('url', '')})",
        "",
    ])

    path.write_text("\n".join(fm_lines + body_lines), encoding="utf-8")
    return path


def select_articles(candidates: list[dict], evaluations: list[dict], cfg: dict) -> list[tuple[dict, dict]]:
    """importance + topic threshold + max_articles_per_topic 적용 후 (article, eval) 페어 반환."""
    f = cfg["filtering"]
    imp_th = int(f.get("importance_threshold", 6))
    top_th = int(f.get("topic_threshold", 6))
    max_per = int(f.get("max_articles_per_topic", 5))

    by_url = {a["url"]: a for a in candidates}
    pairs: list[tuple[dict, dict]] = []
    for ev in evaluations:
        article = by_url.get(ev.get("url"))
        if article is None:
            continue
        if int(ev.get("importance_score", 0)) < imp_th:
            continue
        passing_topics = [t for t, s in ev.get("topic_scores", {}).items() if int(s) >= top_th]
        if not passing_topics:
            continue
        # passing_topics를 user_topics로 정규화 (없으면 채움)
        if not ev.get("user_topics"):
            ev["user_topics"] = passing_topics
        pairs.append((article, ev))

    # 토픽별 max_per 적용 — 토픽별로 importance_score desc, 동률은 published_at desc
    topic_buckets: dict[str, list[tuple[dict, dict]]] = {}
    for a, e in pairs:
        for t in e["user_topics"]:
            topic_buckets.setdefault(t, []).append((a, e))
    for t in topic_buckets:
        topic_buckets[t].sort(key=lambda p: (int(p[1].get("importance_score", 0)),
                                              p[0].get("published_at", "")), reverse=True)
        topic_buckets[t] = topic_buckets[t][:max_per]

    selected_urls: set[str] = set()
    selected: list[tuple[dict, dict]] = []
    for t in topic_buckets:
        for a, e in topic_buckets[t]:
            if a["url"] in selected_urls:
                continue
            selected_urls.add(a["url"])
            selected.append((a, e))
    # importance_score desc 로 정렬
    selected.sort(key=lambda p: int(p[1].get("importance_score", 0)), reverse=True)
    return selected


def build_digest(selected: list[tuple[dict, dict]], cfg: dict, run_id: str,
                 raw_summary: dict, run_window_from: str, run_window_to: str,
                 emerging_topics: list[dict], date_str: str, time_str: str) -> str:
    """digest_HHMM.md 본문 생성."""
    by_topic: dict[str, list[tuple[dict, dict]]] = {}
    for a, e in selected:
        for t in e.get("user_topics", []):
            by_topic.setdefault(t, []).append((a, e))

    active_topics = sorted(by_topic.keys())
    en_count = sum(1 for a, _ in selected if a.get("lang") == "en")
    ko_count = sum(1 for a, _ in selected if a.get("lang") == "ko")

    fm = ["---"]
    fm.append(f'date: "{date_str}"')
    fm.append(f'run_id: "{run_id}"')
    fm.append(f'run_started_at: "{raw_summary.get("run_started_at", "")}"')
    fm.append("run_window:")
    fm.append(f'  from: "{run_window_from}"')
    fm.append(f'  to: "{run_window_to}"')
    fm.append(f'total_scraped: {raw_summary.get("total_scraped", 0)}')
    fm.append(f'total_new: {raw_summary.get("total_new", 0)}')
    fm.append(f'articles_dropped_by_age: {raw_summary.get("articles_dropped_by_age", 0)}')
    fm.append(f'total_selected: {len(selected)}')
    fm.append("active_topics:")
    for t in active_topics:
        fm.append(f"  - {t}")
    # new_auto_tags_this_run: 모든 선별 기사 태그 모음에서 unique
    all_tags: list[str] = []
    for _, e in selected:
        all_tags.extend(e.get("auto_tags", []))
    uniq_tags = sorted({t.lstrip("#") for t in all_tags})
    if uniq_tags:
        fm.append("new_auto_tags_this_run:")
        for t in uniq_tags[:30]:
            fm.append(f'  - "#{t}"')
    fm.append("sources_breakdown:")
    fm.append(f"  en: {en_count}")
    fm.append(f"  ko: {ko_count}")
    if raw_summary.get("feed_failures"):
        fm.append("feed_failures:")
        for ff in raw_summary["feed_failures"]:
            fm.append(f'  - source: "{ff.get("source", "")}"')
            fm.append(f'    reason: "{ff.get("reason", "")}"')
    fm.append("---")
    fm.append("")

    body = [f"# AI 뉴스 다이제스트 — {date_str} {time_str[:2]}:{time_str[2:]} 회차", "",
            f"*{len(selected)}개 선별 / {raw_summary.get('total_scraped', 0)} 수집 / {raw_summary.get('total_new', 0)} 신규*",
            "", "---", ""]

    for t in active_topics:
        label = topic_label(cfg, t)
        items = by_topic[t]
        body.append(f"## {label} ({len(items)})")
        body.append("")
        for i, (a, e) in enumerate(items, 1):
            slug = C.slugify(a.get("title", ""), 20)
            md_filename = f"{date_str.replace('-', '')}-{slug}.md"
            tags_inline = " ".join(f"`{tg}`" for tg in e.get("auto_tags", []))
            body.append(f"### {i}. [{a['title']}](articles/{md_filename}) {tags_inline} — [🔗원문]({a['url']})")
            body.append(f"> {e.get('one_line_summary_ko', e.get('summary_ko', '')[:120])}")
            body.append("")
        body.append("")

    if emerging_topics:
        body.append("## 신규 토픽 제안")
        body.append("")
        for et in emerging_topics:
            urls = et.get("article_urls", [])
            link_parts = []
            for u in urls:
                # candidates에 있는 기사면 articles/<slug>.md, 아니면 그냥 [u](u)
                # 디지스트 안에선 이번 회차 selected만 articles/ 경로로 매핑됨
                title_for = ""
                for sa, _ in selected:
                    if sa["url"] == u:
                        title_for = sa["title"]
                        break
                if title_for:
                    slug = C.slugify(title_for, 20)
                    link_parts.append(f"[{title_for}](articles/{date_str.replace('-', '')}-{slug}.md)")
                else:
                    link_parts.append(f"[{u}]({u})")
            body.append(f"- `{et.get('name', '')}`: {et.get('description', '')} — 등장 기사: {', '.join(link_parts)}")
        body.append("")

    return "\n".join(fm + body)


def update_index_md(date_str: str, time_str: str, digest_filename: str, selected_count: int, new_count: int) -> None:
    """일자 index.md 머지."""
    index_path = C.NEWS_DIR / date_str / "index.md"
    runs_today: list[dict] = []
    if index_path.exists():
        text = index_path.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                fm_text = parts[1]
                # runs_today 단순 파싱
                in_runs = False
                cur: dict = {}
                for line in fm_text.splitlines():
                    s = line.rstrip()
                    if s.startswith("runs_today:"):
                        in_runs = True
                        continue
                    if in_runs:
                        if s.startswith("  - "):
                            if cur:
                                runs_today.append(cur)
                                cur = {}
                            kv = s[4:].split(":", 1)
                            if len(kv) == 2:
                                cur[kv[0].strip()] = kv[1].strip().strip("'\"")
                        elif s.startswith("    "):
                            kv = s.strip().split(":", 1)
                            if len(kv) == 2:
                                cur[kv[0].strip()] = kv[1].strip().strip("'\"")
                        elif not s.startswith(" "):
                            in_runs = False
                if cur:
                    runs_today.append(cur)

    # 동일 time 항목 갱신, 없으면 추가
    time_label = f"{time_str[:2]}:{time_str[2:]}"
    runs_today = [r for r in runs_today if r.get("time") != time_label]
    runs_today.append({
        "time": time_label,
        "file": digest_filename,
        "selected": str(selected_count),
        "new": str(new_count),
    })
    runs_today.sort(key=lambda r: r.get("time", ""))

    fm = ["---", f'date: "{date_str}"', "runs_today:"]
    for r in runs_today:
        fm.append(f'  - time: "{r["time"]}"')
        fm.append(f'    file: "{r["file"]}"')
        fm.append(f'    selected: {r["selected"]}')
        fm.append(f'    new: {r["new"]}')
    fm.extend(["---", ""])

    body = [f"# {date_str} 다이제스트 인덱스", ""]
    for r in runs_today:
        body.append(f"- [{r['time']} 회차]({r['file']}) — {r['selected']}개 선별 / {r['new']}개 신규")
    body.append("")

    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text("\n".join(fm + body), encoding="utf-8")


def update_weekly_md(date_kst: _dt.datetime, run_id: str, selected: list[tuple[dict, dict]],
                    digest_filename: str, time_str: str) -> str:
    """주간 롤업 머지. ISO 주차 파일명 반환."""
    iso_year, iso_week, _ = date_kst.isocalendar()
    iso_week_str = f"{iso_year}-W{iso_week:02d}"
    weekly_path = C.WEEKLY_DIR / f"{iso_week_str}.md"
    weekly_path.parent.mkdir(parents=True, exist_ok=True)

    # 기존 파일이 있으면 보존, 없으면 새로 생성
    week_start = date_kst.date() - _dt.timedelta(days=date_kst.weekday())
    week_end = week_start + _dt.timedelta(days=6)
    date_str = date_kst.strftime("%Y-%m-%d")

    existing_runs: list[str] = []
    existing_topic_counts: dict[str, int] = {}
    existing_runs_today_block: list[str] = []
    if weekly_path.exists():
        text = weekly_path.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                for line in parts[1].splitlines():
                    s = line.strip()
                    if s.startswith("- run_"):
                        existing_runs.append(s.lstrip("- "))
                    if ":" in s and not s.startswith("-"):
                        k, v = s.split(":", 1)
                        if k.strip() in {"llm_models", "ai_agents", "ai_policy", "ai_industry", "physical_ai_robotics"}:
                            try:
                                existing_topic_counts[k.strip()] = int(v.strip())
                            except ValueError:
                                pass
                # body 내 회차 인덱스 보존
                body_text = parts[2]
                in_run_idx = False
                for line in body_text.splitlines():
                    if line.startswith("## 회차 인덱스"):
                        in_run_idx = True
                        continue
                    if in_run_idx:
                        if line.startswith("## "):
                            in_run_idx = False
                            continue
                        existing_runs_today_block.append(line)

    runs_included = list(dict.fromkeys(existing_runs + [run_id]))

    # 토픽 카운트 갱신
    topic_counts = dict(existing_topic_counts)
    for _, e in selected:
        for t in e.get("user_topics", []):
            topic_counts[t] = topic_counts.get(t, 0) + 1
    total_this_week = sum(topic_counts.values())

    fm = ["---",
          f'iso_week: "{iso_week_str}"',
          f'week_start: "{week_start.isoformat()}"',
          f'week_end: "{week_end.isoformat()}"',
          "runs_included:"]
    for r in runs_included:
        fm.append(f"  - {r}")
    fm.append(f"total_selected_this_week: {total_this_week}")
    if topic_counts:
        fm.append("topic_counts:")
        for k in sorted(topic_counts):
            fm.append(f"  {k}: {topic_counts[k]}")
    fm.extend(["---", ""])

    body = [f"# 주간 AI 뉴스 — {iso_week_str} ({week_start.strftime('%m-%d')} ~ {week_end.strftime('%m-%d')})", "",
            "## 회차 인덱스", ""]
    body.extend(existing_runs_today_block or [])
    # 이번 회차 항목 추가 (날짜별 그룹은 단순화해 회차 라인만 추가)
    new_run_line = f"- **{date_str}** ({time_str[:2]}:{time_str[2:]} 회차) — {len(selected)}개 선별 ([digest](../{date_str}/{digest_filename}))"
    if new_run_line not in body:
        body.append(new_run_line)
    body.append("")

    weekly_path.write_text("\n".join(fm + body), encoding="utf-8")
    return iso_week_str


def update_suggested_topics(emerging: list[dict], run_id: str, date_str: str) -> None:
    if not emerging:
        return
    path = C.PROJECT_ROOT / "topics" / "suggested_topics.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text("# 신규 토픽 제안 (자동 감지)\n\n", encoding="utf-8")
    today = date_str
    appended = []
    for et in emerging:
        appended.append(f"- 주제명: {et.get('name', '')}")
        appended.append(f"  정의: {et.get('description', '')}")
        kw = ", ".join(et.get("keywords", []))
        appended.append(f"  키워드: {kw}")
        urls = et.get("article_urls", [])
        if urls:
            appended.append("  관련 기사:")
            for u in urls:
                appended.append(f'    - "{u}"')
        appended.append(f'  근거: "{run_id} 배치에서 {et.get("count", len(urls))}+ 기사 등장"')
        appended.append(f"  최초 감지: {today}")
        appended.append(f"  마지막 감지: {today}")
        appended.append(f"  누적 감지: {et.get('count', 1)}")
        appended.append("")
    with path.open("a", encoding="utf-8") as f:
        f.write("\n".join(appended) + "\n")


def main() -> int:
    print("📦 routine/finalize.py 시작")
    cfg = C.load_config()

    candidates_data = C.read_json(C.state_path("candidates.json"))
    candidates: list[dict] = candidates_data["candidates"]
    new_seen: list[list[str]] = candidates_data.get("new_seen", [])

    raw_summary = C.read_json(C.state_path("raw_summary.json"))

    eval_path = C.state_path("evaluations.json")
    if not eval_path.exists():
        print("❌ tmp/state/evaluations.json 없음 — agent가 평가 단계를 수행했는지 확인")
        return 1
    evaluations_data = C.read_json(eval_path)
    evaluations: list[dict] = evaluations_data.get("articles", [])
    emerging: list[dict] = evaluations_data.get("emerging_topics", [])

    selected = select_articles(candidates, evaluations, cfg)
    print(f"   선별: {len(evaluations)} 평가 → {len(selected)} 선택 (importance≥{cfg['filtering']['importance_threshold']}, topic≥{cfg['filtering']['topic_threshold']})")

    now_kst = C.kst_now()
    date_str = now_kst.strftime("%Y-%m-%d")
    time_str = now_kst.strftime("%H%M")
    run_id = C.make_run_id(now_kst)

    # 회차 윈도우
    last_run_at = C.read_last_run_at(default_hours=cfg["filtering"].get("max_age_hours", 48))
    run_window_to = C.utc_now().isoformat()
    run_window_from = last_run_at.isoformat()
    scraped_at = run_window_to

    # 기사 markdown 작성
    out_dir = C.NEWS_DIR / date_str / "articles"
    written = 0
    for a, e in selected:
        write_article_md(a, e, run_id, scraped_at, out_dir)
        written += 1
    print(f"   기사 markdown: {written}개 작성 → {out_dir}")

    # digest_HHMM.md
    digest_filename = f"digest_{time_str}.md"
    digest_path = C.NEWS_DIR / date_str / digest_filename
    digest_text = build_digest(selected, cfg, run_id, raw_summary,
                                run_window_from, run_window_to, emerging,
                                date_str, time_str)
    digest_path.write_text(digest_text, encoding="utf-8")
    print(f"   digest: {digest_path}")

    # index.md
    update_index_md(date_str, time_str, digest_filename, len(selected),
                    raw_summary.get("total_new", 0))
    print(f"   index.md 갱신")

    # weekly
    iso_week_str = update_weekly_md(now_kst, run_id, selected, digest_filename, time_str)
    print(f"   weekly: news/weekly/{iso_week_str}.md 갱신")

    # seen_urls 갱신
    pairs = [(h, u) for h, u in new_seen]
    if pairs:
        C.append_seen_urls(pairs, date_str)
    removed = C.prune_seen_urls(int(cfg["storage"].get("seen_urls_retention_days", 60)))
    print(f"   seen_urls: +{len(pairs)} / -{removed} (retention)")

    # suggested_topics
    update_suggested_topics(emerging, run_id, date_str)
    if emerging:
        print(f"   suggested_topics 갱신: {len(emerging)} 신규 토픽")

    # validate.py 호출
    validate_errors = 0
    try:
        result = subprocess.run(
            [sys.executable, str(C.PROJECT_ROOT / "scripts" / "validate.py"), "--news"],
            capture_output=True, text=True, timeout=60, encoding="utf-8", errors="replace",
        )
        if result.returncode != 0:
            validate_errors = 1
            print(f"   ⚠️  validate.py 종료코드 {result.returncode}")
    except Exception as e:
        print(f"   ⚠️  validate.py 호출 실패: {e}")
        validate_errors = 1

    # build_manifest.py
    manifest_error = None
    try:
        result = subprocess.run(
            [sys.executable, str(C.PROJECT_ROOT / "scripts" / "visualizer" / "build_manifest.py")],
            capture_output=True, text=True, timeout=60, encoding="utf-8", errors="replace",
        )
        if result.returncode != 0:
            manifest_error = f"exit {result.returncode}: {result.stderr[:200]}"
    except Exception as e:
        manifest_error = str(e)
    if manifest_error:
        print(f"   ⚠️  manifest 갱신 실패: {manifest_error}")
    else:
        print("   manifest 갱신 OK")

    # run_log
    log_entry = {
        "run_id": run_id,
        "timestamp": run_window_to,
        "sources_checked": raw_summary.get("sources_checked", 0),
        "feed_failures": raw_summary.get("feed_failures", []),
        "lookback_window_hours": round((C.utc_now() - last_run_at).total_seconds() / 3600, 2),
        "total_scraped": raw_summary.get("total_scraped", 0),
        "total_new": raw_summary.get("total_new", 0),
        "articles_dropped_by_age": raw_summary.get("articles_dropped_by_age", 0),
        "passed_importance": sum(1 for ev in evaluations if int(ev.get("importance_score", 0)) >= cfg["filtering"]["importance_threshold"]),
        "passed_topic": len(selected),
        "total_selected": len(selected),
        "sources_breakdown": {
            "en": sum(1 for a, _ in selected if a.get("lang") == "en"),
            "ko": sum(1 for a, _ in selected if a.get("lang") == "ko"),
        },
        "filter_criteria_version": evaluations_data.get("filter_criteria_version", "v1"),
        "output_files": {
            "digest": f"news/{date_str}/{digest_filename}",
            "index": f"news/{date_str}/index.md",
            "weekly": f"news/weekly/{iso_week_str}.md",
            "manifest": "news/manifest.json",
        },
    }
    if validate_errors:
        log_entry["validation_errors"] = validate_errors
    if manifest_error:
        log_entry["manifest_error"] = manifest_error
    C.write_run_log(log_entry)

    # last_run.json
    C.update_last_run(run_id)

    print(f"\n✅  finalize 완료: run_id={run_id} selected={len(selected)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
