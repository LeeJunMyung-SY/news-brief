#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI News Brief — 자율 검증 스크립트
PostToolUse Hook 및 개발 단계에서 구조/파일 유효성을 자동 확인합니다.

사용법:
  python scripts/validate.py                  # 전체 구조 검증
  python scripts/validate.py --file PATH      # 특정 파일 검증 (Hook에서 호출)
  python scripts/validate.py --rss            # RSS 피드 접근 테스트
  python scripts/validate.py --article PATH   # 기사 마크다운 frontmatter 검증
"""

import sys
import io
import os
import argparse

# Windows cp949 환경에서 UTF-8 출력 강제
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding and sys.stderr.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import urllib.request
import urllib.error
import hashlib
from pathlib import Path

# ── 프로젝트 루트 결정 ──────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

# ── 필수 파일/디렉토리 목록 ─────────────────────────────────────────────────
REQUIRED_DIRS = [
    "config",
    "news",
    "topics",
    "logs",
    "feedback",
    "scripts",
]

REQUIRED_FILES = [
    "config/config.yaml",
    "config/filter_criteria.md",
    "config/agent_prompt.md",
    "topics/topic_history.yaml",
    "topics/suggested_topics.md",
    "feedback/approved.jsonl",
    "feedback/rejected.jsonl",
    "feedback/review_queue.md",
    "seen_urls.txt",
    "logs/run_log.jsonl",
    "logs/last_run.json",
]

# 기사 마크다운의 필수 frontmatter 필드
REQUIRED_ARTICLE_FIELDS = [
    "title",
    "url",
    "source",
    "published_at",
    "scraped_at",
    "user_topics",
    "auto_tags",
    "importance_score",
    "topic_scores",
    "filter_criteria_version",
    "run_id",
]

# 회차별 digest_HHMM.md 필수 필드 (단일 회차 기준)
REQUIRED_DIGEST_FIELDS = [
    "date",
    "run_id",
    "total_scraped",
    "total_selected",
]

# 일자 index.md 필수 필드
REQUIRED_INDEX_FIELDS = [
    "date",
    "runs_today",
]

# 주간 롤업 필수 필드
REQUIRED_WEEKLY_FIELDS = [
    "iso_week",
    "week_start",
    "week_end",
    "total_selected_this_week",
]

# last_run.json 필수 필드
REQUIRED_LAST_RUN_FIELDS = ["last_run_at"]


def ok(msg):
    print(f"  ✅  {msg}")


def warn(msg):
    print(f"  ⚠️  {msg}")


def fail(msg):
    print(f"  ❌  {msg}")


def section(title):
    print(f"\n{'─'*50}")
    print(f"  {title}")
    print(f"{'─'*50}")


# ── 검증 함수들 ─────────────────────────────────────────────────────────────

def check_structure():
    """필수 디렉토리 및 파일 존재 여부 확인"""
    section("구조 검증 — 디렉토리 및 필수 파일")
    errors = 0

    for d in REQUIRED_DIRS:
        path = PROJECT_ROOT / d
        if path.is_dir():
            ok(f"디렉토리 존재: {d}/")
        else:
            fail(f"디렉토리 없음: {d}/")
            errors += 1

    for f in REQUIRED_FILES:
        path = PROJECT_ROOT / f
        if path.exists():
            ok(f"파일 존재: {f}")
        else:
            fail(f"파일 없음: {f}")
            errors += 1

    return errors


def check_config():
    """config.yaml 스키마 유효성 검사"""
    section("config.yaml 검증")
    errors = 0
    config_path = PROJECT_ROOT / "config" / "config.yaml"

    if not config_path.exists():
        fail("config.yaml 없음 — 건너뜀")
        return 1

    try:
        import yaml
        with open(config_path, encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
    except ImportError:
        # yaml 없이 기본 텍스트 검사
        content = config_path.read_text(encoding="utf-8")
        required_keys = ["topics", "filtering", "sources", "storage"]
        for key in required_keys:
            if key + ":" in content:
                ok(f"키 확인: {key}")
            else:
                fail(f"키 없음: {key}")
                errors += 1
        return errors
    except Exception as e:
        fail(f"YAML 파싱 오류: {e}")
        return 1

    # 필수 섹션 확인
    required_sections = {
        "topics": list,
        "filtering": dict,
        "sources": dict,
        "storage": dict,
    }
    for key, expected_type in required_sections.items():
        if key not in cfg:
            fail(f"섹션 없음: {key}")
            errors += 1
        elif not isinstance(cfg[key], expected_type):
            fail(f"잘못된 타입: {key} (기대: {expected_type.__name__})")
            errors += 1
        else:
            ok(f"섹션 유효: {key}")

    # 토픽 필드 확인
    if "topics" in cfg and isinstance(cfg["topics"], list):
        for i, topic in enumerate(cfg["topics"]):
            for field in ["name", "label", "description"]:
                if field not in topic:
                    fail(f"토픽[{i}] 필드 없음: {field}")
                    errors += 1
        ok(f"토픽 수: {len(cfg['topics'])}개")

    # RSS 피드 존재 확인
    feeds = cfg.get("sources", {}).get("rss_feeds", [])
    if feeds:
        ok(f"RSS 소스 수: {len(feeds)}개")
    else:
        warn("RSS 피드 설정 없음")

    return errors


def check_filter_criteria():
    """filter_criteria.md 기본 구조 확인"""
    section("filter_criteria.md 검증")
    errors = 0
    path = PROJECT_ROOT / "config" / "filter_criteria.md"

    if not path.exists():
        fail("filter_criteria.md 없음")
        return 1

    content = path.read_text(encoding="utf-8")

    required_sections = [
        "version:",
        "중요도 판단 기준",
        "토픽 관련성 판단",
        "자동 태그 부여",
    ]
    for section_name in required_sections:
        if section_name in content:
            ok(f"섹션 확인: {section_name[:30]}")
        else:
            fail(f"섹션 없음: {section_name[:30]}")
            errors += 1

    return errors


def check_rss_feeds():
    """RSS 피드 URL 실제 접근 테스트"""
    section("RSS 피드 접근 테스트")
    errors = 0

    config_path = PROJECT_ROOT / "config" / "config.yaml"
    if not config_path.exists():
        fail("config.yaml 없음 — RSS 테스트 건너뜀")
        return 1

    # 간단한 텍스트 파싱으로 URL 추출
    content = config_path.read_text(encoding="utf-8")
    urls = []
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("url:"):
            url = line.split("url:", 1)[1].strip().strip('"').strip("'")
            if url.startswith("http"):
                urls.append(url)

    if not urls:
        warn("테스트할 RSS URL 없음")
        return 0

    print(f"  {len(urls)}개 피드 중 첫 2개만 테스트합니다...")
    test_urls = urls[:2]

    for url in test_urls:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "AI-News-Brief/1.0 (validation test)"},
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.getcode()
                content_type = resp.headers.get("Content-Type", "")
                if status == 200:
                    ok(f"접근 성공 ({status}): {url[:60]}")
                else:
                    warn(f"응답 코드 {status}: {url[:60]}")
        except urllib.error.URLError as e:
            fail(f"접근 실패: {url[:60]}\n       → {e.reason}")
            errors += 1
        except Exception as e:
            fail(f"오류: {url[:60]}\n       → {e}")
            errors += 1

    return errors


def check_writable():
    """seen_urls.txt 및 logs/ 쓰기 권한 확인"""
    section("쓰기 권한 확인")
    errors = 0

    targets = [
        PROJECT_ROOT / "seen_urls.txt",
        PROJECT_ROOT / "logs" / "run_log.jsonl",
        PROJECT_ROOT / "feedback" / "approved.jsonl",
        PROJECT_ROOT / "feedback" / "rejected.jsonl",
    ]

    for path in targets:
        if not path.exists():
            fail(f"파일 없음: {path.relative_to(PROJECT_ROOT)}")
            errors += 1
            continue
        try:
            # 실제 쓰기 테스트 (내용 보존)
            original = path.read_bytes()
            with open(path, "ab") as f:
                pass  # append 모드 열기만 해도 충분
            ok(f"쓰기 가능: {path.relative_to(PROJECT_ROOT)}")
        except PermissionError:
            fail(f"쓰기 권한 없음: {path.relative_to(PROJECT_ROOT)}")
            errors += 1

    return errors


def check_article_file(file_path: str):
    """생성된 마크다운 파일(article/digest_HHMM/index/weekly)의 frontmatter 검사.

    Hook 등 빈번 호출 환경에서 빠른 종료를 위해, 검증 대상이 아닌 경로는
    파일 내용을 읽지 않고 즉시 OK 반환합니다.
    """
    path = Path(file_path)
    name = path.name

    # 빠른 분류 (file IO 전)
    is_article = "articles" in str(path).replace("\\", "/") and name != "index.md"
    is_run_digest = name.startswith("digest_") and name.endswith(".md")
    is_index = name == "index.md"
    is_weekly = "weekly" in str(path).replace("\\", "/") and name.endswith(".md") and not is_index

    if not (is_article or is_run_digest or is_index or is_weekly):
        # 검증 대상 아님 — Hook에서 호출됐어도 즉시 종료 (출력 없음)
        return 0

    section(f"파일 검증: {file_path}")
    errors = 0

    if not path.exists():
        fail(f"파일 없음: {file_path}")
        return 1

    if path.suffix != ".md":
        ok(f"마크다운 아님, 건너뜀: {path.name}")
        return 0

    content = path.read_text(encoding="utf-8")

    if is_article:
        fields_to_check = REQUIRED_ARTICLE_FIELDS
    elif is_run_digest:
        fields_to_check = REQUIRED_DIGEST_FIELDS
    elif is_index:
        fields_to_check = REQUIRED_INDEX_FIELDS
    elif is_weekly:
        fields_to_check = REQUIRED_WEEKLY_FIELDS
    else:
        return 0

    # frontmatter 파싱 (--- 블록)
    if not content.startswith("---"):
        fail("YAML frontmatter 없음 (--- 로 시작해야 함)")
        return 1

    parts = content.split("---", 2)
    if len(parts) < 3:
        fail("frontmatter 닫는 --- 없음")
        return 1

    frontmatter_text = parts[1]

    for field in fields_to_check:
        if f"{field}:" in frontmatter_text:
            ok(f"필드 확인: {field}")
        else:
            fail(f"필드 없음: {field}")
            errors += 1

    if errors == 0:
        ok(f"파일 유효: {path.name}")

    return errors


def check_news_output():
    """news/ 폴더 내 최신 날짜의 회차별 digest 및 index 검증"""
    section("news/ 출력 구조 검증")
    news_dir = PROJECT_ROOT / "news"

    date_folders = sorted(
        [d for d in news_dir.iterdir()
         if d.is_dir() and d.name != "weekly"],
        reverse=True,
    )

    if not date_folders:
        warn("news/ 폴더가 비어 있습니다 (아직 실행 전)")
        return 0

    errors = 0
    latest = date_folders[0]
    ok(f"최신 날짜 폴더: {latest.name}")

    # 회차별 digest 확인
    run_digests = sorted(latest.glob("digest_*.md"))
    legacy_digest = latest / "digest.md"

    if run_digests:
        ok(f"회차별 digest 수: {len(run_digests)} ({', '.join(d.name for d in run_digests)})")
        for d in run_digests:
            errors += check_article_file(str(d))
    elif legacy_digest.exists():
        warn("구 digest.md 사용 중 — 회차별 digest_HHMM.md로 마이그레이션 권장")
    else:
        fail("digest 파일 없음")
        errors += 1

    # 일자 index.md 확인
    index_file = latest / "index.md"
    if index_file.exists():
        ok("index.md 존재")
        errors += check_article_file(str(index_file))
    elif run_digests:
        warn("index.md 없음 (회차별 digest 사용 시 권장)")

    # articles/ 폴더 확인
    articles_dir = latest / "articles"
    if articles_dir.is_dir():
        articles = list(articles_dir.glob("*.md"))
        ok(f"articles/ 폴더 존재, 기사 수: {len(articles)}")
        for article in articles[:3]:
            errors += check_article_file(str(article))
    else:
        warn("articles/ 폴더 없음 (첫 실행 전)")

    return errors


def check_weekly_rollup():
    """news/weekly/ 디렉토리 내 최신 주차 파일 검증"""
    section("주간 롤업 검증")
    weekly_dir = PROJECT_ROOT / "news" / "weekly"
    if not weekly_dir.is_dir():
        warn("news/weekly/ 폴더 없음 (아직 생성 전)")
        return 0

    weekly_files = sorted(weekly_dir.glob("*.md"), reverse=True)
    if not weekly_files:
        warn("주간 롤업 파일 없음 (아직 첫 회차 전)")
        return 0

    ok(f"최신 주차 파일: {weekly_files[0].name}")
    return check_article_file(str(weekly_files[0]))


def check_last_run():
    """logs/last_run.json 형식 검증"""
    section("last_run.json 검증")
    path = PROJECT_ROOT / "logs" / "last_run.json"
    if not path.exists():
        fail("logs/last_run.json 없음")
        return 1

    import json as _json
    try:
        data = _json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        fail(f"JSON 파싱 오류: {e}")
        return 1

    errors = 0
    for field in REQUIRED_LAST_RUN_FIELDS:
        if field in data:
            ok(f"필드 확인: {field} = {data[field]}")
        else:
            fail(f"필드 없음: {field}")
            errors += 1
    return errors


# ── 메인 ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AI News Brief 자율 검증 스크립트")
    parser.add_argument("--file", help="특정 파일 검증 (PostToolUse Hook에서 호출)")
    parser.add_argument("--rss", action="store_true", help="RSS 피드 접근 테스트만 실행")
    parser.add_argument("--article", help="기사 마크다운 frontmatter 검증")
    parser.add_argument("--news", action="store_true", help="news/ 출력 구조 검증")
    parser.add_argument("--weekly", action="store_true", help="주간 롤업 검증")
    parser.add_argument("--last-run", action="store_true", help="logs/last_run.json 검증")
    args = parser.parse_args()

    print("\n🔍 AI News Brief — 자율 검증 시작")
    print(f"   프로젝트 루트: {PROJECT_ROOT}")

    total_errors = 0

    if args.file:
        # PostToolUse Hook: 특정 파일 검증
        total_errors += check_article_file(args.file)

    elif args.rss:
        # RSS 접근 테스트만
        total_errors += check_rss_feeds()

    elif args.article:
        # 특정 기사 파일 검증
        total_errors += check_article_file(args.article)

    elif args.news:
        # news/ 출력 구조 검증 + 주간 롤업
        total_errors += check_news_output()
        total_errors += check_weekly_rollup()

    elif args.weekly:
        total_errors += check_weekly_rollup()

    elif args.last_run:
        total_errors += check_last_run()

    else:
        # 전체 검증
        total_errors += check_structure()
        total_errors += check_config()
        total_errors += check_filter_criteria()
        total_errors += check_writable()
        total_errors += check_rss_feeds()
        total_errors += check_news_output()
        total_errors += check_weekly_rollup()
        total_errors += check_last_run()

    # 최종 결과
    print(f"\n{'═'*50}")
    if total_errors == 0:
        print("  ✅  모든 검증 통과")
    else:
        print(f"  ❌  {total_errors}개 오류 발견 — 위 내용을 확인하세요")
    print(f"{'═'*50}\n")

    return 0 if total_errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
