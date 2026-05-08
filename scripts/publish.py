#!/usr/bin/env python3
"""scripts/publish.py — visualizer + news/ 를 gh-pages 브랜치로 staging + push.

호출: python scripts/publish.py
전제: git repo + origin remote + gh-pages 브랜치 존재 + gh CLI HTTPS 토큰 캐시됨.

6단계:
  1. ensure_worktree   — .publish/ 에 gh-pages worktree 멱등 생성
  2. clean_staging     — .git 제외 모든 파일 삭제
  3. copy_assets       — visualizer 화이트리스트 복사 (admin.js 제외)
  4. transform_assets  — data.js / app.js 의 publish 변환 (정확히 1회 발생 검증)
  5. copy_news         — news/ 전체 동기화
  6. commit_and_push   — 변경 없으면 skip, 있으면 commit + push gh-pages

Exit codes (Design §6.1):
  0   정상
  10  git push 실패 (자격증명 / 네트워크)
  11  transform 패턴 미발견 또는 다중 발견
  12  worktree 생성 실패
  13  news/manifest.json 부재
"""
from __future__ import annotations
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

EX_GIT_PUSH = 10
EX_TRANSFORM = 11
EX_WORKTREE = 12
EX_NEWS_MISSING = 13

BRANCH = "gh-pages"
ASSETS_WHITELIST = ("app.js", "data.js", "parser.js", "styles.css")

DATA_JS_FROM = 'const NEWS_BASE = "../../news";'
DATA_JS_TO   = 'const NEWS_BASE = "news";'

APP_JS_FROM = 'import { renderAdmin, leaveAdmin } from "./admin.js";'
APP_JS_TO   = 'const renderAdmin = () => {}; const leaveAdmin = () => {};'


class TransformError(RuntimeError):
    pass


def _run(cmd, cwd=None, check=True, capture=False):
    return subprocess.run(
        cmd, cwd=str(cwd) if cwd else None,
        check=check, capture_output=capture, text=True,
    )


def ensure_worktree(repo_root: Path, worktree: Path) -> None:
    if worktree.exists() and (worktree / ".git").exists():
        return
    if worktree.exists():
        # .git 없는 잔존 디렉토리 — 안전을 위해 정리 후 재생성
        shutil.rmtree(worktree)
    _run(["git", "worktree", "add", str(worktree), BRANCH], cwd=repo_root)


def clean_staging(worktree: Path) -> None:
    for item in worktree.iterdir():
        if item.name == ".git":
            continue
        if item.is_dir() and not item.is_symlink():
            shutil.rmtree(item)
        else:
            item.unlink()


def copy_assets(repo_root: Path, worktree: Path) -> None:
    src_vis = repo_root / "scripts" / "visualizer"
    shutil.copy2(src_vis / "index.html", worktree / "index.html")
    dst_assets = worktree / "assets"
    dst_assets.mkdir(parents=True, exist_ok=True)
    for fname in ASSETS_WHITELIST:
        shutil.copy2(src_vis / "assets" / fname, dst_assets / fname)
    # admin.js, server.py, *.ps1, build_manifest.py, README.md, PLAN/DESIGN/REVIEW.md 의도적 미복사


def _replace_exact_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    occurrences = text.count(old)
    if occurrences != 1:
        raise TransformError(
            f"{path.name}: pattern occurrences = {occurrences} (expected 1). "
            f"pattern={old!r}"
        )
    path.write_text(text.replace(old, new), encoding="utf-8")


def transform_assets(worktree: Path) -> None:
    _replace_exact_once(worktree / "assets" / "data.js", DATA_JS_FROM, DATA_JS_TO)
    _replace_exact_once(worktree / "assets" / "app.js", APP_JS_FROM, APP_JS_TO)


def copy_news(repo_root: Path, worktree: Path) -> None:
    src = repo_root / "news"
    dst = worktree / "news"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def commit_and_push(worktree: Path) -> None:
    _run(["git", "add", "-A"], cwd=worktree)
    status = _run(
        ["git", "status", "--porcelain"], cwd=worktree, capture=True,
    )
    if not status.stdout.strip():
        print("publish.py: no changes, skip commit/push")
        return

    msg = f"data: digest {datetime.now().strftime('%Y-%m-%d %H%M')}"
    _run(["git", "commit", "-m", msg], cwd=worktree)

    push = _run(
        ["git", "push", "origin", BRANCH],
        cwd=worktree, check=False, capture=True,
    )
    if push.returncode != 0:
        sys.stderr.write(push.stderr)
        sys.exit(EX_GIT_PUSH)
    print(f"publish.py: pushed: {msg}")


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    worktree = repo_root / ".publish"

    if not (repo_root / "news" / "manifest.json").exists():
        sys.stderr.write("publish.py: news/manifest.json missing\n")
        sys.exit(EX_NEWS_MISSING)

    try:
        ensure_worktree(repo_root, worktree)
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"publish.py: worktree error: {e}\n")
        sys.exit(EX_WORKTREE)

    clean_staging(worktree)
    copy_assets(repo_root, worktree)

    try:
        transform_assets(worktree)
    except TransformError as e:
        sys.stderr.write(f"publish.py: transform error: {e}\n")
        sys.exit(EX_TRANSFORM)

    copy_news(repo_root, worktree)
    commit_and_push(worktree)


if __name__ == "__main__":
    main()
