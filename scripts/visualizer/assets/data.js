// Data layer: manifest + digest + article fetching with sessionStorage caching.

import { parseFrontmatter, parseDigestBody } from "./parser.js";

const NEWS_BASE = "../../news";
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
