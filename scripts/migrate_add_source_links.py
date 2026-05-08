#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
일회성 마이그레이션: 기존 digest/weekly 마크다운의 article 링크 옆에
[🔗원문](URL) 링크를 추가한다.

article 파일의 frontmatter에서 url: 값을 추출해 매핑한다.
이미 [🔗원문] 가 붙은 줄은 건너뛴다.

사용:
  python scripts/migrate_add_source_links.py [--dry-run]
"""
import re
import sys
import io
import argparse
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
NEWS_DIR = ROOT / "news"

# article 파일 frontmatter에서 url 추출 (라인 시작 + url: + 따옴표 안 값)
URL_RE = re.compile(r'^url:\s*"([^"]+)"', re.MULTILINE)

def article_url_map():
    """모든 news/<날짜>/articles/*.md 의 (파일이름 → 원문 URL) 매핑."""
    mapping = {}
    for date_dir in NEWS_DIR.iterdir():
        if not date_dir.is_dir() or date_dir.name == "weekly":
            continue
        articles = date_dir / "articles"
        if not articles.is_dir():
            continue
        for md in articles.glob("*.md"):
            text = md.read_text(encoding="utf-8")
            m = URL_RE.search(text)
            if m:
                mapping[md.name] = m.group(1)
    return mapping

# digest 라인 패턴: ...](articles/<파일명>.md) ... — 끝에 이미 원문 링크 없는 경우
# weekly 라인 패턴: ...](../<날짜>/articles/<파일명>.md) ...
LINK_RE = re.compile(
    r'(\]\((?:\.\./\d{4}-\d{2}-\d{2}/)?articles/([\w\-\.]+\.md)\))'  # group1=링크, group2=파일명
)

def already_has_source(line: str) -> bool:
    return "🔗원문" in line or "[원문]" in line and "://" in line

def transform_text(text: str, urls: dict) -> tuple[str, int]:
    out_lines = []
    added = 0
    for line in text.splitlines():
        if already_has_source(line):
            out_lines.append(line)
            continue
        m = LINK_RE.search(line)
        if not m:
            out_lines.append(line)
            continue
        fname = m.group(2)
        url = urls.get(fname)
        if not url:
            out_lines.append(line)
            continue
        # 줄 끝에 — [🔗원문](URL) 추가
        # 뒤에 이미 다른 — 텍스트가 있더라도 끝에 한 번만 붙임
        new_line = line.rstrip() + f" — [🔗원문]({url})"
        out_lines.append(new_line)
        added += 1
    return "\n".join(out_lines) + ("\n" if text.endswith("\n") else ""), added

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    urls = article_url_map()
    print(f"수집된 article URL 매핑: {len(urls)}개")

    targets = []
    # 회차별 digest
    for date_dir in NEWS_DIR.iterdir():
        if not date_dir.is_dir() or date_dir.name == "weekly":
            continue
        for d in date_dir.glob("digest_*.md"):
            targets.append(d)
    # 주간 롤업
    weekly = NEWS_DIR / "weekly"
    if weekly.is_dir():
        for w in weekly.glob("*.md"):
            targets.append(w)

    total_added = 0
    for path in sorted(targets):
        text = path.read_text(encoding="utf-8")
        new_text, added = transform_text(text, urls)
        if added == 0:
            print(f"  ─  {path.relative_to(ROOT)} (변경 없음)")
            continue
        total_added += added
        if args.dry_run:
            print(f"  [dry-run] {path.relative_to(ROOT)} — {added}개 줄 변경 예정")
        else:
            path.write_text(new_text, encoding="utf-8")
            print(f"  ✅ {path.relative_to(ROOT)} — {added}개 원문 링크 추가")

    print(f"\n총 {total_added}개 원문 링크 추가됨" + (" (dry-run, 실제 변경 없음)" if args.dry_run else ""))

if __name__ == "__main__":
    main()
