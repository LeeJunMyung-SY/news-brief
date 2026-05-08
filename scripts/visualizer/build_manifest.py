#!/usr/bin/env python3
"""Scan news/ and emit news/manifest.json.

Idempotent: rerun whenever a new digest lands. Pure stdlib so it works on any
Python 3 install. PyYAML is used opportunistically when available, otherwise
a tiny frontmatter parser handles the simple shapes the writer emits.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml  # type: ignore
    HAVE_YAML = True
except Exception:  # noqa: BLE001
    HAVE_YAML = False


REPO_ROOT = Path(__file__).resolve().parents[2]
NEWS_DIR = REPO_ROOT / "news"
MANIFEST_PATH = NEWS_DIR / "manifest.json"

DATE_DIR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
WEEK_FILE_RE = re.compile(r"^(\d{4})-W(\d{2})\.md$")
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def split_frontmatter(text: str) -> tuple[dict, str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}, text
    raw = match.group(1)
    body = text[match.end():]
    if HAVE_YAML:
        try:
            data = yaml.safe_load(raw) or {}
            return data, body
        except Exception:  # noqa: BLE001
            pass
    return _mini_yaml(raw), body


def _mini_yaml(raw: str) -> dict:
    """Tiny frontmatter parser sufficient for the digest writer's shapes.

    Handles scalars (quoted/unquoted), nested mappings (1 level), and bullet
    lists of either scalars or `- key: value` mapping items.
    """
    data: dict = {}
    lines = raw.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.lstrip().startswith("#"):
            i += 1
            continue
        stripped = line.rstrip()
        if ":" not in stripped:
            i += 1
            continue
        indent = len(line) - len(line.lstrip(" "))
        key, _, rest = stripped.lstrip().partition(":")
        rest = rest.strip()
        if rest:
            data[key] = _coerce(rest)
            i += 1
            continue
        # collect children
        child_indent = indent + 2
        items: list = []
        mapping: dict = {}
        i += 1
        is_list = False
        while i < len(lines):
            child = lines[i]
            if not child.strip():
                i += 1
                continue
            cur_indent = len(child) - len(child.lstrip(" "))
            if cur_indent < child_indent and not child.lstrip().startswith("- "):
                break
            content = child.lstrip()
            if content.startswith("- "):
                is_list = True
                item = content[2:].strip()
                if ":" in item and not (item.startswith('"') or item.startswith("'")):
                    sub_key, _, sub_rest = item.partition(":")
                    sub_rest = sub_rest.strip()
                    obj: dict = {}
                    if sub_rest:
                        obj[sub_key.strip()] = _coerce(sub_rest)
                    i += 1
                    while i < len(lines):
                        nxt = lines[i]
                        if not nxt.strip():
                            i += 1
                            continue
                        nxt_indent = len(nxt) - len(nxt.lstrip(" "))
                        if nxt_indent <= cur_indent:
                            break
                        nxt_content = nxt.lstrip()
                        if nxt_content.startswith("- "):
                            break
                        if ":" in nxt_content:
                            k2, _, v2 = nxt_content.partition(":")
                            obj[k2.strip()] = _coerce(v2.strip())
                        i += 1
                    items.append(obj)
                else:
                    items.append(_coerce(item))
                    i += 1
            else:
                if ":" in content:
                    k2, _, v2 = content.partition(":")
                    mapping[k2.strip()] = _coerce(v2.strip())
                i += 1
        if is_list:
            data[key] = items
        elif mapping:
            data[key] = mapping
        else:
            data[key] = None
    return data


def _coerce(value: str):
    if value == "" or value.lower() == "null":
        return None
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value


def collect_daily() -> list[dict]:
    daily: list[dict] = []
    for entry in sorted(NEWS_DIR.iterdir()):
        if not entry.is_dir() or not DATE_DIR_RE.match(entry.name):
            continue
        index_path = entry / "index.md"
        if not index_path.exists():
            continue
        try:
            text = index_path.read_text(encoding="utf-8")
        except OSError as exc:
            print(f"[warn] cannot read {index_path}: {exc}", file=sys.stderr)
            continue
        meta, _ = split_frontmatter(text)
        runs_raw = meta.get("runs_today") or []
        runs: list[dict] = []
        for run in runs_raw:
            if not isinstance(run, dict):
                continue
            run_file = run.get("file")
            if not run_file:
                continue
            digest_path = entry / run_file
            if not digest_path.exists():
                continue
            run_entry = {
                "time": run.get("time"),
                "file": run_file,
                "selected": run.get("selected"),
                "new": run.get("new"),
            }
            if run.get("note"):
                run_entry["note"] = run.get("note")
            runs.append(run_entry)
        daily.append({"date": entry.name, "runs": runs})
    daily.sort(key=lambda d: d["date"], reverse=True)
    return daily


def collect_weekly() -> list[dict]:
    weekly_dir = NEWS_DIR / "weekly"
    if not weekly_dir.exists():
        return []
    out: list[dict] = []
    for path in sorted(weekly_dir.glob("*.md")):
        match = WEEK_FILE_RE.match(path.name)
        if not match:
            continue
        try:
            meta, _ = split_frontmatter(path.read_text(encoding="utf-8"))
        except OSError:
            meta = {}
        out.append({
            "week": path.stem,
            "file": path.name,
            "week_start": meta.get("week_start"),
            "week_end": meta.get("week_end"),
            "total_selected_this_week": meta.get("total_selected_this_week"),
        })
    out.sort(key=lambda w: w["week"], reverse=True)
    return out


def main() -> int:
    if not NEWS_DIR.exists():
        print(f"[error] news directory not found: {NEWS_DIR}", file=sys.stderr)
        return 1
    daily = collect_daily()
    weekly = collect_weekly()
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "latest_date": daily[0]["date"] if daily else None,
        "daily": daily,
        "weekly": weekly,
    }
    MANIFEST_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"wrote {MANIFEST_PATH.relative_to(REPO_ROOT)} "
        f"(daily={len(daily)}, weekly={len(weekly)})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
