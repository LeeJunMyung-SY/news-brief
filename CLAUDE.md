# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A daily AI-news digest pipeline. A scheduled Claude Code agent fetches RSS/web sources, scores and summarizes articles in Korean, and emits markdown digests under `news/`. A static single-page viewer (`scripts/visualizer/`) renders them, and `scripts/publish.py` pushes the viewer + data to the `gh-pages` branch for the public site (<https://leejunmyung-sy.github.io/news-brief/>).

No build system, no test framework, no package manifest. Python 3 (stdlib-first; **PyYAML is optional** — every script has a stdlib fallback parser) plus vanilla JS served over a static server.

## The determinism boundary (most important architectural rule)

The pipeline deliberately splits **mechanical work** (Python, fully deterministic) from **judgment work** (the LLM agent). This split is the whole design:

- **`scripts/routine/collect.py` and `finalize.py` never call LLM tools** — only `urllib`/`pathlib`. Keep it that way. They are the deterministic bookends.
- **The agent only does the evaluation step in the middle**: read candidates, score importance/topics, write Korean summaries. Its full operating contract is `config/agent_prompt.md` — read that file before touching anything about how the scheduled run behaves.

The handoff between the two halves is JSON files in `tmp/state/` (gitignored):

```
collect.py  → tmp/state/candidates.json, raw_summary.json, external_plan.json
agent       → tmp/state/evaluations.json   (or evaluations_batch_NNN.json for >30 candidates)
finalize.py → news/**, logs/**, seen_urls.txt, then calls validate + build_manifest + publish
```

`finalize.py` orchestrates the tail end by `subprocess`-calling `validate.py --news`, `build_manifest.py`, and `publish.py` in sequence. A publish failure is logged (`publish_error` in `run_log.jsonl`) but does **not** fail the routine — `last_run.json` only advances on a clean finalize, so a failed run re-attempts the same time window next cycle.

## Common commands

Run everything from the **project root** (`News Brief/`). Paths in the scripts are root-relative.

```bash
# Full pipeline, the two deterministic halves (the agent fills the gap between them):
python scripts/routine/collect.py
#   ...agent writes tmp/state/evaluations*.json...
python scripts/routine/finalize.py        # also runs validate + manifest + publish

# If RSS feeds failed and the agent gathered external articles:
python scripts/routine/collect.py --include-external tmp/state/external.json

# Validation (also wired as a PostToolUse hook target via --file):
python scripts/validate.py                 # full structure + config + RSS reachability
python scripts/validate.py --news          # validate latest news/ output + weekly rollup
python scripts/validate.py --rss           # RSS reachability only
python scripts/validate.py --file PATH      # single-file frontmatter check (hook entrypoint)

# Viewer (must serve from root so ../../news resolves):
python -m http.server 8000                 # → http://localhost:8000/scripts/visualizer/
python scripts/visualizer/server.py --port 8765   # local-only dev server (gitignored)

# Manual republish (idempotent):
python scripts/visualizer/build_manifest.py
python scripts/publish.py
```

There is no single test suite; `validate.py` is the closest thing to one and is what `finalize.py` runs to gate output.

## Data model & key invariants

- **`config/config.yaml`** is the source of truth for topics, RSS feeds, filtering thresholds, and the schedule. Topics are matched by `name` (snake_case key); the viewer's filter chips come from `manifest.topics`, which `build_manifest.py` derives from this file — so adding a topic here propagates to the UI automatically. Note `load_config()` in `common.py` has a hand-rolled line parser used when PyYAML is absent; if you add structurally novel YAML, verify that fallback still parses it.
- **`seen_urls.txt`** is the dedup ledger (`sha256[:16]  url  date`), append-only via `common.py`, pruned by `seen_urls_retention_days`. Do not hand-edit.
- **Time**: collection windows are UTC and incremental from `logs/last_run.json` (`incremental_from_last_run`), clamped by `incremental_max_gap_days`. Output paths/filenames are **KST** (`common.KST`). Don't mix the two.
- **Filtering** happens in two places: the agent assigns scores; `finalize.select_articles()` applies `importance_threshold`, `topic_threshold`, and `max_articles_per_topic`. The agent is told to include *all* candidates and let finalize do selection.
- **Output layout**: `news/YYYY-MM-DD/articles/*.md` (one per article), `digest_HHMM.md` (per run), `index.md` (per day, merges runs), `news/weekly/YYYY-Www.md` (ISO-week rollup). Weekly files have a regenerated "주요 이슈" section (importance ≥ 8, rebuilt deterministically every run) and a preserved "주간 핵심 테마" section (human/LLM-authored — do not clobber it).
- **Intra-day dedup**: `finalize.py` drops articles whose title Jaccard-overlaps an already-written same-day article (`_INTRA_DAY_DEDUP_THRESHOLD = 0.5`), so re-running a day doesn't duplicate the same event from different outlets.

## Public / private split (handle with care)

This repo is the **private** working copy; the public site is a filtered projection on `gh-pages`. Two independent mechanisms enforce the split — keep both in sync when adding files:

1. **`.gitignore`** keeps operational assets out of `main` entirely: `config/`, `topics/`, `feedback/`, `logs/`, `tmp/`, `seen_urls.txt`, `docs/`, `server.py`, `*.ps1`, `admin.js`, internal `PLAN/DESIGN/REVIEW.md`.
2. **`publish.py` whitelist** (`ASSETS_WHITELIST`) copies only `index.html` + `app.js/data.js/parser.js/styles.css` to the worktree. `admin.js`, `build_manifest.py`, `routine/`, `validate.py` are intentionally excluded.

`publish.py` does three **exact-once** string transforms on the staged copies (asserts the pattern appears exactly once, else exits 11): rewrites `NEWS_BASE` to `"news"`, stubs out the admin import in `app.js`, and hides the admin gear button in `index.html`. If you edit those lines in the visualizer source, the publish transform will break — update the `*_FROM` constants in `publish.py` to match. Publish runs against a `gh-pages` git **worktree** at `.publish/`.

Leak check after publishing:
```bash
git ls-tree -r gh-pages --name-only | grep -E '(feedback/|admin\.js|server\.py|\.ps1$|topics/|config/|docs/|routine/|validate\.py)'
# expected: empty output
```

## Visualizer

Static SPA, no bundler: `index.html` + ES modules in `assets/`. `app.js` (routing/render/state), `data.js` (fetch + sessionStorage cache, keyed `anb:`), `parser.js` (frontmatter + digest-body parser), `admin.js` (local-only, stripped from public build). Hash routes: `#/YYYY-MM-DD[/HHMM]`, `#/weekly/YYYY-Www`, `#/article/...`, `#/admin`. Because manifest is cached in `sessionStorage`, a hard refresh is needed to see new digests locally.

## Conventions

- Scripts force UTF-8 stdout/stderr on Windows cp949 (`common.py` top, `validate.py` top) — preserve that guard in new scripts.
- Korean is the working language for summaries, comments, and digest content; article **titles** stay in their original language.
- `config/agent_prompt.md` hard-restricts which tools/commands the scheduled agent may emit (no ad-hoc shell, no file-existence probes) to avoid permission prompts breaking unattended runs. If you change the agent's behavior, that file is the contract to update.
