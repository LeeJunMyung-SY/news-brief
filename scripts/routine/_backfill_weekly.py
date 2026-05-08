#!/usr/bin/env python3
"""주간 weekly md 본문을 finalize.py 의 헬퍼로 재생성하는 1회용 백필 스크립트.

호출: python scripts/routine/_backfill_weekly.py [2026-W19 ...]
인자 미지정 시 news/weekly/*.md 전체 처리.

- frontmatter 의 runs_included 보존
- 본문 ## 회차 인덱스 보존
- 본문 ## 주간 핵심 테마 (사용자/LLM 작성 영역) 보존
- ## 이번 주 주요 이슈 (importance 8+) 섹션을 article frontmatter 에서 재생성
"""
from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from routine import common as C  # noqa: E402
from routine.finalize import (  # noqa: E402
    _parse_article_frontmatter,
    _week_dates_from_runs,
    _gather_week_articles_8plus,
    _build_topic_sections,
)


def backfill(iso_week_str: str) -> bool:
    weekly_path = C.WEEKLY_DIR / f"{iso_week_str}.md"
    if not weekly_path.exists():
        print(f"  not found: {weekly_path}")
        return False
    text = weekly_path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        print(f"  no frontmatter: {weekly_path.name}")
        return False
    parts = text.split("---", 2)
    if len(parts) < 3:
        print(f"  malformed frontmatter: {weekly_path.name}")
        return False

    runs_included: list[str] = []
    week_start = ""
    week_end = ""
    for line in parts[1].splitlines():
        s = line.strip()
        if s.startswith("- run_"):
            runs_included.append(s.lstrip("- "))
        elif s.startswith("week_start:"):
            week_start = s.split(":", 1)[1].strip().strip('"')
        elif s.startswith("week_end:"):
            week_end = s.split(":", 1)[1].strip().strip('"')

    body_text = parts[2]

    # 회차 인덱스 보존
    runs_block: list[str] = []
    in_run_idx = False
    for line in body_text.splitlines():
        if line.startswith("## 회차 인덱스"):
            in_run_idx = True
            continue
        if in_run_idx:
            if line.startswith("## "):
                in_run_idx = False
            elif line.strip():
                runs_block.append(line)

    # 주간 핵심 테마 보존
    preserved_theme_lines: list[str] = []
    idx = body_text.find("## 주간 핵심 테마")
    if idx >= 0:
        preserved_theme_lines = body_text[idx:].splitlines()

    # 헤더 라인 보존
    header = f"# 주간 AI 뉴스 — {iso_week_str}"
    for line in body_text.splitlines():
        if line.startswith("# "):
            header = line
            break

    # 토픽 카운트 재계산
    topic_counts: dict[str, int] = {}
    for d in _week_dates_from_runs(runs_included):
        adir = C.NEWS_DIR / d / "articles"
        if adir.exists():
            for af in adir.glob("*.md"):
                try:
                    fm = _parse_article_frontmatter(af.read_text(encoding="utf-8"))
                except Exception:
                    continue
                for t in fm.get("user_topics", []) or []:
                    topic_counts[t] = topic_counts.get(t, 0) + 1
    total_this_week = sum(topic_counts.values())

    cfg = C.load_config()
    articles_8plus = _gather_week_articles_8plus(runs_included)
    topic_section_lines = _build_topic_sections(articles_8plus, cfg)

    fm_lines = ["---",
                f'iso_week: "{iso_week_str}"',
                f'week_start: "{week_start}"',
                f'week_end: "{week_end}"',
                "runs_included:"]
    for r in runs_included:
        fm_lines.append(f"  - {r}")
    fm_lines.append(f"total_selected_this_week: {total_this_week}")
    if topic_counts:
        fm_lines.append("topic_counts:")
        for k in sorted(topic_counts):
            fm_lines.append(f"  {k}: {topic_counts[k]}")
    fm_lines.extend(["---", ""])

    body = [header, "", "## 회차 인덱스", "", *runs_block, ""]
    if topic_section_lines:
        body.extend(topic_section_lines)
    if preserved_theme_lines:
        body.extend(preserved_theme_lines)

    weekly_path.write_text("\n".join(fm_lines + body), encoding="utf-8")
    print(f"  rebuilt: {weekly_path.name} ({len(articles_8plus)} 8+ articles)")
    return True


def main() -> None:
    if len(sys.argv) > 1:
        targets = sys.argv[1:]
    else:
        targets = sorted(p.stem for p in C.WEEKLY_DIR.glob("*.md"))
    for iso in targets:
        print(f"backfill {iso}:")
        backfill(iso)


if __name__ == "__main__":
    main()
