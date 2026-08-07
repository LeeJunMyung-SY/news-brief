// Data layer: manifest + digest + article fetching with sessionStorage caching.

import { parseFrontmatter, parseDigestBody } from "./parser.js";

const NEWS_BASE = "news";
const CACHE_PREFIX = "anb:";

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheSet(key, value) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota or private mode — silent */
  }
}

async function fetchText(path) {
  const cached = cacheGet(path);
  if (cached && typeof cached.text === "string") return cached.text;
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${path}`);
    err.status = res.status;
    err.path = path;
    throw err;
  }
  const text = await res.text();
  cacheSet(path, { text });
  return text;
}

export async function loadManifest() {
  // Never cache the manifest: sessionStorage survives in-tab refresh, which
  // would hide newly-added daily folders until the user closes the tab.
  // The file is tiny (single fetch per page load), so this has negligible cost.
  const path = `${NEWS_BASE}/manifest.json?t=${Date.now()}`;
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`manifest.json ${res.status}`);
    err.status = res.status;
    err.path = path;
    throw err;
  }
  return res.json();
}

export async function loadDigest(date, file) {
  const path = `${NEWS_BASE}/${date}/${file}`;
  const text = await fetchText(path);
  const { frontmatter, body } = parseFrontmatter(text);
  const { sections, trailingMd } = parseDigestBody(body);
  return { date, file, frontmatter, sections, trailingMd, body };
}

export async function loadArticle(date, articleFile) {
  const path = `${NEWS_BASE}/${date}/articles/${articleFile}`;
  const text = await fetchText(path);
  const { frontmatter, body } = parseFrontmatter(text);
  return { date, articleFile, frontmatter, body };
}

// Same as loadArticle but for use during card hydration: returns only frontmatter
// (still caches the full text so subsequent open is instant). Errors are swallowed
// to keep the card render path non-fatal.
export async function peekArticleFrontmatter(date, articleFile) {
  try {
    const path = `${NEWS_BASE}/${date}/articles/${articleFile}`;
    const text = await fetchText(path);
    const { frontmatter } = parseFrontmatter(text);
    return frontmatter || null;
  } catch {
    return null;
  }
}

export async function loadTopicIndex() {
  // manifest 와 동일하게 캐시 회피 — 회차마다 재생성되는 파일.
  const path = `${NEWS_BASE}/topic_index.json?t=${Date.now()}`;
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`topic_index.json ${res.status}`);
    err.status = res.status;
    err.path = path;
    throw err;
  }
  return res.json();
}

export async function loadTopicBrief(key) {
  // 토픽별 동향 요약 md. 아직 생성되지 않은 토픽은 null (페이지는 기사 목록만 표시).
  const path = `${NEWS_BASE}/topics/${encodeURIComponent(key)}.md?t=${Date.now()}`;
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const { frontmatter, body } = parseFrontmatter(text);
    return { frontmatter, body };
  } catch {
    return null;
  }
}

export async function loadDailyIssues(date) {
  // 일자 핵심이슈 JSON — 회차마다 갱신되므로 no-store. 없으면 null (박스 미표시).
  const path = `${NEWS_BASE}/issues/daily/${date}.json?t=${Date.now()}`;
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadWeeklyIssues(week) {
  // 주간 핵심이슈 JSON — 없으면 null.
  const path = `${NEWS_BASE}/issues/weekly/${week}.json?t=${Date.now()}`;
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadWeekly(file) {
  // weekly md 는 routine 매 사이클마다 갱신 (토픽 섹션 재생성) → manifest 와
  // 동일하게 캐시 회피. sessionStorage 캐시에 갇혀 stale 본문이 영구 사용되는 문제 방지.
  const path = `${NEWS_BASE}/weekly/${file}?t=${Date.now()}`;
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`weekly ${res.status} for ${path}`);
    err.status = res.status;
    err.path = path;
    throw err;
  }
  const text = await res.text();
  const { frontmatter, body } = parseFrontmatter(text);
  return { file, frontmatter, body };
}
