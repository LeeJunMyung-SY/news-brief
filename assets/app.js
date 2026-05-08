import { loadManifest, loadDigest, loadArticle, loadWeekly, peekArticleFrontmatter } from "./data.js";
import { renderMarkdown, escapeHtml } from "./parser.js";
const renderAdmin = () => {}; const leaveAdmin = () => {};

// ─────────── Constants ───────────
const TOPIC_ORDER = ["llm_models", "ai_agents", "ai_policy", "ai_industry"];
const TOPIC_LABELS = {
  llm_models: "LLM Models",
  ai_agents: "AI Agents",
  ai_policy: "AI Policy",
  ai_industry: "AI Industry",
};
const TOPIC_LONG_LABELS = {
  llm_models: "Large Language Models and Foundation Models",
  ai_agents: "AI Agents and Autonomous Systems",
  ai_policy: "AI Policy, Regulation and Safety",
  ai_industry: "AI Industry and Business",
};
const SECTION_LABEL_TO_TOPIC = Object.fromEntries(
  Object.entries(TOPIC_LONG_LABELS).map(([k, v]) => [v.toLowerCase(), k])
);
// Best-effort fuzzy: strip parens count to match.
function topicForLabel(label) {
  if (!label) return null;
  const norm = label.replace(/\s*\(\d+\)\s*$/, "").trim().toLowerCase();
  if (SECTION_LABEL_TO_TOPIC[norm]) return SECTION_LABEL_TO_TOPIC[norm];
  // Heuristics for short labels that may appear.
  if (norm.includes("language model")) return "llm_models";
  if (norm.includes("agent")) return "ai_agents";
  if (norm.includes("policy") || norm.includes("regulation") || norm.includes("safety")) return "ai_policy";
  if (norm.includes("industry") || norm.includes("business")) return "ai_industry";
  return null;
}

const THEME_PREF_KEY = "anb:theme-pref";
// DESIGN §5.8: 3-state cycle auto → dark → light → auto (dark-first to match dark-default).
const THEME_CYCLE = ["auto", "dark", "light"];

// ─────────── State ───────────
const state = {
  manifest: null,
  view: "daily",            // 'daily' | 'weekly'
  date: null,
  digests: [],              // all runs of the day, merged for display
  weekly: null,
  weeklySections: null,     // [{ label, articles: [{ title, articleFile, sourceUrl, summary, tags, dateBadge, topicKey, importance }] }]
  selectedTopics: new Set(),
  activeTags: new Set(),
  tagQuery: "",
  modal: { open: false, lastFocused: null },
};

// ─────────── DOM helpers ───────────
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const bind = (name, root = document) => root.querySelector(`[data-bind="${name}"]`);

function setText(el, text) { if (el) el.textContent = text; }

// ─────────── Theme ───────────
function applyTheme() {
  const pref = localStorage.getItem(THEME_PREF_KEY) || "auto";
  document.documentElement.setAttribute("data-theme-pref", pref);
  const resolved = pref === "auto"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : pref;
  document.documentElement.setAttribute("data-theme", resolved);
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute("content", resolved);
}

function cycleTheme() {
  const cur = localStorage.getItem(THEME_PREF_KEY) || "auto";
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(cur) + 1) % THEME_CYCLE.length];
  localStorage.setItem(THEME_PREF_KEY, next);
  applyTheme();
}

// ─────────── Routing ───────────
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = new URLSearchParams(qs || "");
  return { parts, params };
}

function buildHash({ parts, params }) {
  const path = "#/" + parts.join("/");
  const qs = params && [...params.keys()].length ? "?" + params.toString() : "";
  return path + qs;
}

function setHash(parts, { topic, tag, replace = false } = {}) {
  const params = new URLSearchParams();
  if (topic && topic.size) params.set("topic", [...topic].join(","));
  if (tag && tag.size) params.set("tag", [...tag].join(","));
  const hash = buildHash({ parts, params });
  if (replace) history.replaceState(null, "", hash);
  else if (location.hash !== hash) location.hash = hash;
}

function syncFiltersToHash() {
  const { parts } = parseHash();
  setHash(parts, { topic: state.selectedTopics, tag: state.activeTags, replace: true });
}

function readFiltersFromHash() {
  const { params } = parseHash();
  state.selectedTopics = new Set((params.get("topic") || "").split(",").filter(Boolean));
  state.activeTags = new Set((params.get("tag") || "").split(",").filter(Boolean));
}

// ─────────── Manifest helpers ───────────
function availableDates() {
  return state.manifest?.daily?.map((d) => d.date) || [];
}
function dateEntry(date) {
  return state.manifest?.daily?.find((d) => d.date === date) || null;
}
function adjacentDate(date, dir) {
  const dates = availableDates(); // newest-first
  const idx = dates.indexOf(date);
  if (idx === -1) return null;
  // dir +1 = older (next in array), -1 = newer (prev in array). Match `[`/`]` semantics.
  const target = idx + (dir > 0 ? 1 : -1);
  return dates[target] || null;
}

// ─────────── Initial setup ───────────
async function bootstrap() {
  applyTheme();
  attachGlobalListeners();
  showSkeleton();
  try {
    state.manifest = await loadManifest();
  } catch (err) {
    console.error(err);
    showFatalError(err);
    return;
  }
  // Hash → state
  await routeFromHash();
  window.addEventListener("hashchange", routeFromHash);
}

async function routeFromHash() {
  if (!state.manifest) return;
  const { parts } = parseHash();
  readFiltersFromHash();

  const head = parts[0];
  if (head === "admin") {
    state.view = "admin";
    state.date = null;
    try {
      await renderAdmin(parts);
    } catch (err) {
      console.error(err);
      showFatalError(err);
    }
    renderHeader();
    renderViewToggle();
    return;
  }
  // Leaving admin: clear admin-mode body class.
  if (document.body.classList.contains("admin-mode")) leaveAdmin();
  if (head === "weekly") {
    const weekId = parts[1] || (state.manifest.weekly?.[0]?.week);
    state.view = "weekly";
    state.date = null;
    if (!weekId) return showEmpty("주간 디지스트가 없습니다.");
    await openWeekly(weekId);
  } else if (head === "article") {
    // #/article/<date>/<articleFile-no-md>
    const date = parts[1];
    const slug = parts[2];
    if (date) {
      // Render the day's digest in the background then open the article.
      state.view = "daily";
      state.date = date;
      await loadAndRenderDaily();
      await openArticleModal(date, `${slug}.md`);
    }
  } else {
    state.view = "daily";
    let date = head;
    if (!date || date === "today" || !dateEntry(date)) {
      date = state.manifest.latest_date || availableDates()[0];
    }
    state.date = date;
    // parts[1] (회차 세그먼트, 예: "0800")는 하위 호환을 위해 받아들이되 무시 — 항상 통합 뷰.
    await loadAndRenderDaily();
  }
  renderHeader();
  renderSidebar();
  renderViewToggle();
}

// ─────────── Render: header + view toggle ───────────
function renderHeader() {
  if (state.view === "admin") {
    setText(bind("current-date"), "관리");
    const sub = bind("current-run");
    if (sub) sub.textContent = "";
    return;
  }
  const dateLabel = state.view === "weekly"
    ? state.weekly?.frontmatter?.iso_week || "주간"
    : (state.date || "—");
  setText(bind("current-date"), dateLabel);
  const sub = bind("current-run");
  if (!sub) return;
  if (state.view === "daily" && state.digests.length) {
    const times = state.digests.map((d) => d.runTime).filter(Boolean);
    sub.textContent = times.length ? `${times.join(", ")} 회차 통합` : "";
  } else if (state.view === "weekly") {
    const fm = state.weekly?.frontmatter || {};
    sub.textContent = fm.week_start && fm.week_end ? `${fm.week_start} ~ ${fm.week_end}` : "";
  } else {
    sub.textContent = "";
  }
}

function renderViewToggle() {
  $$('.seg').forEach((btn) => {
    // In admin mode neither tab is selected.
    const active = state.view !== "admin" && btn.dataset.view === state.view;
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
}

// ─────────── Render: sidebar ───────────
function renderSidebar() {
  // Render once into the desktop sidebar; mirror into drawer body.
  renderSidebarInto(document);
  const drawerBody = bind("drawer-body");
  if (drawerBody) {
    drawerBody.innerHTML = `
      <section class="filter-block">
        <h3 class="filter-title">토픽</h3>
        <div data-bind="topic-list" class="topic-list" role="group"></div>
      </section>
      <section class="filter-block">
        <h3 class="filter-title">태그</h3>
        <input type="search" class="text-input" data-bind="tag-input" placeholder="태그 검색…" />
        <div class="active-tags" data-bind="active-tags"></div>
      </section>
      <button class="link-btn" data-action="clear-filters">전체 해제</button>
    `;
    renderSidebarInto(drawerBody);
  }
}

function renderSidebarInto(root) {
  const topicList = bind("topic-list", root);
  const activeTags = bind("active-tags", root);
  const tagInput = bind("tag-input", root);
  const tagSuggestions = bind("tag-suggestions", root);
  const clearBtn = root.querySelector('[data-action="clear-filters"]');

  if (topicList) {
    topicList.innerHTML = "";
    const counts = countArticlesByTopic();
    TOPIC_ORDER.forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "topic-option";
      btn.style.setProperty("--topic-fg", `var(--topic-${key}-fg)`);
      const isActive = state.selectedTopics.has(key);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      btn.innerHTML = `
        <span class="dot" aria-hidden="true"></span>
        <span>${TOPIC_LABELS[key]}</span>
        <span class="count">${counts[key] || 0}</span>
      `;
      btn.addEventListener("click", () => toggleTopic(key));
      topicList.appendChild(btn);
    });
  }

  if (activeTags) {
    activeTags.innerHTML = "";
    [...state.activeTags].forEach((tag) => {
      activeTags.appendChild(buildTagChip(tag, true));
    });
  }

  if (tagSuggestions) {
    tagSuggestions.innerHTML = "";
    const suggestions = topPopularTags(8).filter((t) => !state.activeTags.has(t));
    suggestions.forEach((t) => tagSuggestions.appendChild(buildTagChip(t, false)));
  }

  if (tagInput) {
    tagInput.value = state.tagQuery;
    tagInput.oninput = (e) => {
      state.tagQuery = e.target.value;
      renderMain();
    };
    tagInput.onkeydown = (e) => {
      if (e.key === "Enter" && state.tagQuery.trim()) {
        addTag(state.tagQuery.trim());
        state.tagQuery = "";
        e.target.value = "";
      }
    };
  }

  const hasFilters = state.selectedTopics.size > 0 || state.activeTags.size > 0;
  if (clearBtn) clearBtn.hidden = !hasFilters;
}

function buildTagChip(rawTag, removable) {
  const tag = rawTag.replace(/^#+/, "");
  const el = document.createElement("button");
  el.type = "button";
  el.className = "tag";
  el.setAttribute("aria-pressed", state.activeTags.has(tag) ? "true" : "false");
  el.innerHTML = `<span class="hash">#</span><span>${escapeHtml(tag)}</span>${removable ? `<svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` : ""}`;
  el.addEventListener("click", () => {
    if (state.activeTags.has(tag)) removeTag(tag);
    else addTag(tag);
  });
  return el;
}

function toggleTopic(key) {
  if (state.selectedTopics.has(key)) state.selectedTopics.delete(key);
  else state.selectedTopics.add(key);
  syncFiltersToHash();
  renderSidebar();
  renderMain();
}

function addTag(tag) {
  state.activeTags.add(tag.replace(/^#+/, ""));
  syncFiltersToHash();
  renderSidebar();
  renderMain();
}
function removeTag(tag) {
  state.activeTags.delete(tag.replace(/^#+/, ""));
  syncFiltersToHash();
  renderSidebar();
  renderMain();
}
function clearFilters() {
  state.selectedTopics.clear();
  state.activeTags.clear();
  state.tagQuery = "";
  syncFiltersToHash();
  renderSidebar();
  renderMain();
}

function countArticlesByTopic() {
  const counts = { llm_models: 0, ai_agents: 0, ai_policy: 0, ai_industry: 0 };
  if (state.view === "weekly") {
    if (!state.weeklySections) return counts;
    state.weeklySections.forEach((sec) => {
      sec.articles.forEach((a) => {
        if (a.topicKey && counts[a.topicKey] !== undefined) counts[a.topicKey] += 1;
      });
    });
    return counts;
  }
  const merged = mergedSections();
  merged.forEach((sec) => {
    const k = topicForLabel(sec.label);
    if (k && counts[k] !== undefined) counts[k] += sec.articles.length;
  });
  return counts;
}

function topPopularTags(limit) {
  const map = new Map();
  const collect = (tags) => {
    (tags || []).forEach((t) => {
      const k = t.replace(/^#+/, "");
      if (!k) return;
      map.set(k, (map.get(k) || 0) + 1);
    });
  };
  if (state.view === "weekly") {
    state.weeklySections?.forEach((sec) => sec.articles.forEach((a) => collect(a.tags)));
  } else {
    mergedSections().forEach((sec) => sec.articles.forEach((a) => collect(a.tags)));
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([k]) => k);
}

// ─────────── Daily render ───────────
async function loadAndRenderDaily() {
  const entry = dateEntry(state.date);
  if (!entry || !entry.runs?.length) {
    showEmpty("이 날짜에는 디지스트가 없습니다.");
    return;
  }
  showSkeleton();
  try {
    // 회차 인라인: 모든 회차를 병렬 로드해서 메모리에 통합 보관.
    const digests = await Promise.all(
      entry.runs.map(async (run) => {
        const d = await loadDigest(state.date, run.file);
        d.runTime = run.time || "";
        return d;
      })
    );
    state.digests = digests;
  } catch (err) {
    console.error(err);
    showFatalError(err);
    return;
  }
  renderMain();
  renderHeader();
}

// 모든 회차의 sections를 카테고리별로 병합 + dedupe(같은 articleFile은 처음 본 것 유지).
// 같은 카테고리 안에서는 회차 시간(빠른 순)으로 들어오는데, importance 점수는 사후 정렬한다.
// importance 데이터는 frontmatter에서 lazy-fetch이므로 정렬 시점에는 부재 → topic_scores 기반의
// 안정적 정렬이 어려우므로 회차 시간 순(빠른 회차가 위)로 두고, importance hydrate 후 카드는
// dataset.importance에 점수가 들어가는 시점에 재정렬(아래 reorderByImportance).
function mergedSections() {
  const labelMap = new Map(); // label -> { label, articles: [] }
  const seen = new Set();
  state.digests.forEach((d) => {
    d.sections.forEach((sec) => {
      // 같은 카테고리는 다른 회차여도 한 섹션으로 합친다.
      // 라벨에 (N) 카운트가 회차마다 다르므로 stripCount 결과를 키로 사용.
      const labelKey = stripCount(sec.label);
      let merged = labelMap.get(labelKey);
      if (!merged) {
        merged = { label: labelKey, articles: [] };
        labelMap.set(labelKey, merged);
      }
      sec.articles.forEach((a) => {
        const key = a.articleFile || `${labelKey}:${a.title}`;
        if (seen.has(key)) return;
        seen.add(key);
        merged.articles.push({ ...a, runTime: d.runTime });
      });
    });
  });
  // 카테고리 순서: TOPIC_ORDER에 맞게 정렬.
  const ordered = [];
  TOPIC_ORDER.forEach((tk) => {
    [...labelMap.values()].forEach((sec) => {
      if (topicForLabel(sec.label) === tk) ordered.push(sec);
    });
  });
  // 매핑 안 된 라벨도 끝에 추가.
  [...labelMap.values()].forEach((sec) => {
    if (!ordered.includes(sec)) ordered.push(sec);
  });
  return ordered;
}

function renderMain() {
  if (state.view === "weekly") return renderWeekly();
  const root = bind("content");
  if (!state.digests.length) return;

  const merged = mergedSections();
  const filteredSections = filterSections(merged);
  const totalShown = filteredSections.reduce((n, s) => n + s.articles.length, 0);

  // 통합 통계: 각 회차 frontmatter의 합산.
  const sumKey = (k) => state.digests.reduce((n, d) => n + (d.frontmatter[k] || 0), 0);
  const totalSelected = sumKey("total_selected");
  const totalNew = sumKey("total_new");
  const totalScraped = sumKey("total_scraped");
  const runTimes = state.digests.map((d) => d.runTime).filter(Boolean);

  root.innerHTML = "";

  // Meta card — 한 줄 압축
  const meta = document.createElement("section");
  meta.className = "meta-card";
  meta.innerHTML = `
    <div class="head">
      <div class="title">${escapeHtml(state.date)}</div>
      <div class="note">${escapeHtml(runTimes.join(", "))} 회차 통합</div>
    </div>
    <div class="stats-line">
      <span><strong>${totalSelected}</strong> selected</span>
      <span class="sep">·</span>
      <span><strong>${totalNew.toLocaleString()}</strong> new</span>
      <span class="sep">·</span>
      <span><strong>${totalScraped.toLocaleString()}</strong> scraped</span>
    </div>
  `;
  root.appendChild(meta);

  if (totalShown === 0) {
    root.appendChild(emptyEl("필터 조건에 맞는 기사가 없습니다.", true));
  } else {
    filteredSections.forEach((sec) => {
      if (!sec.articles.length) return;
      const topicKey = topicForLabel(sec.label);
      const sectionEl = document.createElement("section");
      sectionEl.className = "topic-section";
      sectionEl.style.setProperty("--topic-fg", `var(--topic-${topicKey || "default"}-fg)`);
      const head = document.createElement("div");
      head.className = "section-head";
      head.innerHTML = `<h2>${escapeHtml(stripCount(sec.label))}</h2><span class="count">${sec.articles.length}</span>`;
      sectionEl.appendChild(head);
      const list = document.createElement("div");
      list.className = "card-list";
      sec.articles.forEach((a) => list.appendChild(buildArticleCard(a, topicKey, { badge: a.runTime })));
      sectionEl.appendChild(list);
      root.appendChild(sectionEl);
    });
  }

  // 회차별 trailing 마크다운(테마 등) — 회차 시간 prefix 붙여 모두 표시.
  state.digests.forEach((d) => {
    if (!d.trailingMd) return;
    const themeEl = document.createElement("section");
    themeEl.className = "theme-bullet prose-ko";
    const prefix = d.runTime ? `*${d.runTime} 회차*\n\n` : "";
    themeEl.innerHTML = renderMarkdown(prefix + d.trailingMd);
    enhanceTopicSuggestions(themeEl);
    root.appendChild(themeEl);
  });

  bindArticleLinks(root);
  hydrateImportance(root);
}

// In the digest's "## 신규 토픽 제안" section, attach a one-click register button to
// each `- `name`: ...` bullet that has a topic name. Clicking does GET→PUT /api/config
// and updates the button label in place.
function enhanceTopicSuggestions(scope) {
  const headings = scope.querySelectorAll("h2, h3");
  headings.forEach((h) => {
    if (!/신규\s*토픽\s*제안/.test(h.textContent || "")) return;
    let next = h.nextElementSibling;
    while (next && !["UL", "OL"].includes(next.tagName)) next = next.nextElementSibling;
    if (!next) return;
    next.querySelectorAll("li").forEach((li) => {
      const parts = extractSuggestionParts(li);
      if (!parts) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-sm suggest-add-btn";
      btn.textContent = parts.definition ? "+ 토픽으로 등록" : "+ 등록 (정의 수동 입력)";
      btn.title = parts.definition
        ? "토픽 정의: " + parts.definition
        : "정의가 추출되지 않았습니다 — 등록 후 관리 페이지에서 description을 직접 입력하세요";
      btn.addEventListener("click", () => registerTopicInline(btn, parts.name, parts.definition));
      li.appendChild(document.createTextNode(" "));
      li.appendChild(btn);
    });
  });
}

// Pull (name, definition) out of a digest "신규 토픽 제안" bullet rendered as:
//   <li><code>name</code>: <definition> (등장 기사: K1, K2, ...)</li>
// Older digests put evidence prose (e.g. "이번 회차에서 ... 관련 기사 6+ 등장") in the
// definition slot — those are discarded because they describe frequency, not topic scope.
const EVIDENCE_MARKER_RE = /이번\s*(?:회차|배치)|관련\s*기사|배치에서|\d+\+\s*기사|\d+개\s*등장|토픽\s*신설/;

function extractSuggestionParts(li) {
  const code = li.querySelector("code");
  if (!code) return null;
  const name = (code.textContent || "").trim();
  if (!name || /\s/.test(name)) return null;
  let after = "";
  for (let n = code.nextSibling; n; n = n.nextSibling) after += n.textContent || "";
  after = after.replace(/^[\s:：]+/, "");
  const parenStart = after.indexOf("(");
  let definition = parenStart >= 0 ? after.slice(0, parenStart) : after;
  definition = definition.trim().replace(/[.。]$/, "").trim();
  if (EVIDENCE_MARKER_RE.test(definition)) definition = "";
  return { name, definition };
}

async function registerTopicInline(btn, name, definition) {
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = "등록 중…";
  try {
    const cfgRes = await fetch("/api/config");
    if (!cfgRes.ok) throw new Error(`GET /api/config ${cfgRes.status}`);
    const cfg = await cfgRes.json();
    if (!Array.isArray(cfg.topics)) cfg.topics = [];
    if (cfg.topics.some((t) => t.name === name)) {
      btn.textContent = "이미 등록됨";
      return;
    }
    cfg.topics.push({
      name,
      label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: definition || "",
    });
    const putRes = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.error || `PUT ${putRes.status}`);
    }
    btn.textContent = "✓ 등록됨";
  } catch (err) {
    btn.textContent = "실패";
    btn.title = String(err.message || err);
    btn.disabled = false;
    console.error("topic register failed", err);
  }
}

async function hydrateImportance(root) {
  const slots = $$("[data-importance-slot]", root).filter((s) => s.dataset.importanceSlot);
  // Limit concurrency: 6 parallel fetches keeps server polite without stalling UI.
  const queue = [...slots];
  const inflight = new Set();
  const dirtySections = new Set();
  const date = state.date;
  if (!date) return;
  async function pump() {
    while (queue.length && inflight.size < 6) {
      const slot = queue.shift();
      const file = slot.dataset.importanceSlot;
      const p = peekArticleFrontmatter(date, file)
        .then((fm) => {
          if (!fm || fm.importance_score == null) return;
          const v = importanceVisual(fm.importance_score);
          slot.classList.add("importance", v.cls);
          slot.innerHTML = `<span class="dots" aria-hidden="true">${v.dots}</span><span class="num">${escapeHtml(String(fm.importance_score))}</span>`;
          slot.setAttribute("aria-label", `중요도 ${fm.importance_score} / 10`);
          // Tag the card with its score so we can re-sort the section by importance.
          const card = slot.closest(".card");
          if (card) {
            card.dataset.importance = String(fm.importance_score);
            const list = card.parentElement;
            if (list && list.classList.contains("card-list")) dirtySections.add(list);
          }
        })
        .catch(() => {})
        .finally(() => { inflight.delete(p); pump(); if (!queue.length && !inflight.size) reorderSections(); });
      inflight.add(p);
    }
  }
  function reorderSections() {
    // 같은 카테고리 안에서 importance 내림차순. 점수 부재(-Infinity)는 뒤로.
    dirtySections.forEach((list) => {
      const cards = Array.from(list.children);
      cards.sort((a, b) => {
        const sa = a.dataset.importance != null ? Number(a.dataset.importance) : -Infinity;
        const sb = b.dataset.importance != null ? Number(b.dataset.importance) : -Infinity;
        return sb - sa;
      });
      cards.forEach((c) => list.appendChild(c));
    });
    dirtySections.clear();
  }
  pump();
}

function stripCount(label) {
  return label.replace(/\s*\(\d+\)\s*$/, "");
}

function filterSections(sections) {
  const tagSet = new Set([...state.activeTags].map((t) => t.toLowerCase()));
  const tagSubstr = state.tagQuery.trim().toLowerCase().replace(/^#+/, "");
  return sections.map((sec) => {
    const topicKey = topicForLabel(sec.label);
    if (state.selectedTopics.size && (!topicKey || !state.selectedTopics.has(topicKey))) {
      return { ...sec, articles: [] };
    }
    const articles = sec.articles.filter((a) => {
      const tags = a.tags.map((t) => t.replace(/^#+/, "").toLowerCase());
      if (tagSet.size && ![...tagSet].every((t) => tags.includes(t))) return false;
      if (tagSubstr && !tags.some((t) => t.includes(tagSubstr))) return false;
      return true;
    });
    return { ...sec, articles };
  });
}

function buildArticleCard(article, topicKey, { badge = "", articleDate = null } = {}) {
  const card = document.createElement("article");
  card.className = "card has-topic";
  card.style.setProperty("--topic-fg", `var(--topic-${topicKey || "default"}-fg)`);
  card.dataset.articleFile = article.articleFile || "";
  if (articleDate) card.dataset.articleDate = articleDate;

  const head = document.createElement("div");
  head.className = "card-head";
  const title = document.createElement("h3");
  title.className = "card-title";
  const linkAttrs = articleDate ? ` data-article-date="${escapeHtml(articleDate)}"` : "";
  title.innerHTML = `<a href="#" data-article-link="${escapeHtml(article.articleFile || "")}"${linkAttrs}>${escapeHtml(article.title)}</a>`;
  head.appendChild(title);

  if (badge) {
    const badgeEl = document.createElement("span");
    badgeEl.className = "card-badge";
    badgeEl.textContent = badge;
    head.appendChild(badgeEl);
  }

  // Importance slot — lazily populated by hydrateImportance().
  // Carries no text until we know the score (DESIGN §5.5: "null이면 시각화 미노출").
  const impSlot = document.createElement("span");
  impSlot.className = "card-importance";
  impSlot.dataset.importanceSlot = article.articleFile || "";
  head.appendChild(impSlot);

  card.appendChild(head);

  if (article.summary) {
    const sum = document.createElement("p");
    sum.className = "card-summary";
    sum.textContent = article.summary;
    card.appendChild(sum);
  }

  const foot = document.createElement("div");
  foot.className = "card-foot";
  const tagRow = document.createElement("div");
  tagRow.className = "tag-row";
  article.tags.forEach((t) => {
    const tagEl = buildTagChip(t, false);
    tagRow.appendChild(tagEl);
  });
  foot.appendChild(tagRow);

  if (article.sourceUrl) {
    const link = document.createElement("a");
    link.className = "external-link";
    link.href = article.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "원문 새 탭에서 열기");
    link.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
    foot.appendChild(link);
  }
  card.appendChild(foot);
  return card;
}

function bindArticleLinks(root) {
  $$("[data-article-link]", root).forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const file = el.dataset.articleLink;
      if (!file) return;
      const date = el.dataset.articleDate || state.date || resolveDateForArticle();
      if (!date) return;
      const slug = file.replace(/\.md$/, "");
      const parts = ["article", date, slug];
      setHash(parts, { topic: state.selectedTopics, tag: state.activeTags });
    });
  });
}

function resolveDateForArticle() {
  // weekly view links into specific dates via relative paths handled by parser.
  return state.date;
}

// ─────────── Weekly render ───────────
async function openWeekly(weekId) {
  const entry = state.manifest.weekly.find((w) => w.week === weekId);
  if (!entry) return showEmpty("주간 디지스트가 없습니다.");
  showSkeleton();
  try {
    state.weekly = await loadWeekly(entry.file);
    state.weeklySections = parseWeeklyBodyToSections(state.weekly.body);
  } catch (err) {
    showFatalError(err);
    return;
  }
  renderWeekly();
}

// 주간 마크다운을 카드 리스트로 변환.
// 구조: H2 또는 H3가 섹션 헤더, 이어지는 "- **타이틀** ([상세](../YYYY-MM-DD/articles/X.md)) — `score N` `#tag1 #tag2` — [🔗원문](URL)" 형태의
// 불릿 라인 + 그 다음 들여쓰기된 "> 요약"을 카드로 파싱.
// H3 안에 카드가 나오면 H3을 섹션으로, 그 외 H2(예: "이번 주 주요 이슈 (importance 8+)")는
// 직속 카드를 가질 수도, 하위 H3들로 그룹핑될 수도 있으므로 둘 다 처리한다.
const WEEKLY_BULLET_RE = /^\s*-\s+(?:\*\*([^*]+)\*\*|([^([]+))\s*\(\[(?:상세|details)\]\((\.\.\/(\d{4}-\d{2}-\d{2})\/articles\/([^)]+))\)\)(.*)$/i;
const WEEKLY_BULLET_NOBOLD_RE = /^\s*-\s+\[([^\]]+)\]\((\.\.\/(\d{4}-\d{2}-\d{2})\/articles\/([^)]+))\)(.*)$/;
const WEEKLY_QUOTE_RE = /^\s*>\s?(.*)$/;

function parseWeeklyBodyToSections(body) {
  const lines = body.split(/\r?\n/);
  const sections = []; // { label, level, articles: [] }
  let current = null;
  let currentArticle = null;

  function flushArticle() {
    if (current && currentArticle) {
      current.articles.push(currentArticle);
      currentArticle = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h2) {
      flushArticle();
      // 회차 인덱스/주간 핵심 테마 등은 카드 섹션이 아니라 일반 prose이므로 건너뛴다.
      const label = h2[1].trim();
      if (/회차\s*인덱스/.test(label) || /주간\s*핵심\s*테마/.test(label) || /^회차\s*추가/.test(label)) {
        current = null;
        continue;
      }
      current = { label, level: 2, articles: [] };
      sections.push(current);
      continue;
    }
    if (h3) {
      flushArticle();
      const label = h3[1].trim();
      // H3가 카드 섹션 라벨(LLM, Agents 등) — 카드를 담는 섹션으로 사용.
      // 단 직전 H2가 "회차 추가 …" 류라면 그쪽 그룹의 카드로 들어가도록 새 섹션을 만듬.
      current = { label, level: 3, articles: [] };
      sections.push(current);
      continue;
    }

    // 카드 헤더 라인 — bold + 상세 링크 형식.
    let m = line.match(WEEKLY_BULLET_RE);
    let title, articleHref, articleDate, articleFile, rest;
    if (m) {
      title = (m[1] || m[2] || "").trim();
      articleHref = m[3];
      articleDate = m[4];
      articleFile = m[5];
      rest = m[6] || "";
    } else {
      // 비-bold 형식: "- [title](../YYYY-MM-DD/articles/X.md) — `score N` `#tag` — [🔗원문](URL)"
      m = line.match(WEEKLY_BULLET_NOBOLD_RE);
      if (m) {
        title = m[1].trim();
        articleHref = m[2];
        articleDate = m[3];
        articleFile = m[4];
        rest = m[5] || "";
      }
    }
    if (m && current) {
      flushArticle();
      // rest에서 score, 태그, 원문 URL 추출.
      const scoreM = rest.match(/`score\s+(\d+)`/i);
      const importance = scoreM ? Number(scoreM[1]) : null;
      // 모든 백틱 토큰 수집 → score 제거 후 # 시작 토큰만 태그로.
      const tickTokens = [...rest.matchAll(/`([^`]+)`/g)].map((mm) => mm[1].trim());
      const tags = [];
      tickTokens.forEach((tok) => {
        if (/^score\s+\d+$/i.test(tok)) return;
        // 한 토큰 안에 여러 #tag가 공백으로 들어있는 경우도 처리.
        tok.split(/\s+/).forEach((t) => {
          const cleaned = t.replace(/^#+/, "");
          if (cleaned) tags.push(cleaned);
        });
      });
      const urlM = rest.match(/\[(?:🔗)?원문\]\(([^)]+)\)/) || rest.match(/\[link\]\(([^)]+)\)/i);
      const sourceUrl = urlM ? urlM[1] : null;

      // 토픽 키 추정: 섹션 라벨이 우선이고, 라벨이 모호하면 H2 라벨을 본다.
      const topicKey =
        topicForLabel(current.label) ||
        topicForLabelLoose(current.label);

      // 날짜 배지: MM-DD 형식.
      const dateBadge = articleDate ? articleDate.slice(5) : "";

      currentArticle = {
        title,
        articleFile,
        articleDate,
        sourceUrl,
        summary: "",
        tags,
        importance,
        topicKey,
        dateBadge,
      };
      continue;
    }

    // 인용 라인 → 직전 카드의 summary로.
    const q = line.match(WEEKLY_QUOTE_RE);
    if (q && currentArticle) {
      currentArticle.summary = currentArticle.summary
        ? `${currentArticle.summary} ${q[1]}`
        : q[1];
      continue;
    }
    // 빈 줄/기타 라인은 카드를 종료.
    if (line.trim() === "") flushArticle();
  }
  flushArticle();

  // 카드 0개인 섹션은 제거.
  return sections.filter((s) => s.articles.length > 0);
}

function topicForLabelLoose(label) {
  const k = topicForLabel(label);
  if (k) return k;
  const norm = (label || "").toLowerCase();
  if (norm.includes("llm") || norm.includes("foundation")) return "llm_models";
  if (norm.includes("agent")) return "ai_agents";
  if (norm.includes("policy") || norm.includes("safety") || norm.includes("regulation")) return "ai_policy";
  if (norm.includes("industry") || norm.includes("business")) return "ai_industry";
  return null;
}

function renderWeekly() {
  if (!state.weekly) return;
  const root = bind("content");
  const fm = state.weekly.frontmatter;
  root.innerHTML = "";

  // 메타: 주차 범위 + 총 기사 수 + 토픽별 카운트 한 줄.
  const totalCount = fm.total_selected_this_week ?? Object.values(fm.topic_counts || {}).reduce((a, b) => a + b, 0);
  const tcText = TOPIC_ORDER
    .map((k) => `${TOPIC_LABELS[k]} ${fm.topic_counts?.[k] ?? 0}`)
    .join(" · ");
  const meta = document.createElement("section");
  meta.className = "meta-card";
  meta.innerHTML = `
    <div class="head">
      <div class="title">주간 ${escapeHtml(fm.iso_week || "")}</div>
      <div class="note">${fm.week_start && fm.week_end ? `${escapeHtml(fm.week_start)} ~ ${escapeHtml(fm.week_end)}` : ""}</div>
    </div>
    <div class="stats-line">
      <span><strong>${totalCount}</strong> 기사</span>
      <span class="sep">·</span>
      <span>${escapeHtml(tcText)}</span>
    </div>
  `;
  root.appendChild(meta);

  // 토픽 필터 / 태그 필터 적용.
  const sectionsForRender = (state.weeklySections || [])
    .map((sec) => {
      const articles = sec.articles.filter((a) => weeklyArticlePassesFilters(a));
      return { ...sec, articles };
    })
    .filter((sec) => sec.articles.length > 0);

  if (!sectionsForRender.length) {
    root.appendChild(emptyEl("필터 조건에 맞는 기사가 없습니다.", true));
  } else {
    sectionsForRender.forEach((sec) => {
      // 섹션의 토픽 색상은 섹션 라벨에서 우선 추정, 없으면 첫 카드의 topicKey 사용.
      const topicKey =
        topicForLabel(sec.label) ||
        topicForLabelLoose(sec.label) ||
        sec.articles[0]?.topicKey ||
        null;
      const sectionEl = document.createElement("section");
      sectionEl.className = "topic-section";
      sectionEl.style.setProperty("--topic-fg", `var(--topic-${topicKey || "default"}-fg)`);
      const head = document.createElement("div");
      head.className = "section-head";
      head.innerHTML = `<h2>${escapeHtml(sec.label)}</h2><span class="count">${sec.articles.length}</span>`;
      sectionEl.appendChild(head);
      const list = document.createElement("div");
      list.className = "card-list";
      // 같은 카테고리 안에서 importance 내림차순.
      const sorted = [...sec.articles].sort((a, b) => (b.importance ?? -1) - (a.importance ?? -1));
      sorted.forEach((a) => {
        const cardTopicKey = a.topicKey || topicKey;
        list.appendChild(buildArticleCard(a, cardTopicKey, { badge: a.dateBadge, articleDate: a.articleDate }));
      });
      sectionEl.appendChild(list);
      root.appendChild(sectionEl);
    });
  }

  bindArticleLinks(root);
  // 주간은 카드별 importance가 이미 마크다운에 들어있으므로 importance 슬롯도 채워준다.
  hydrateWeeklyImportance(root);
}

function weeklyArticlePassesFilters(a) {
  if (state.selectedTopics.size && (!a.topicKey || !state.selectedTopics.has(a.topicKey))) return false;
  const tagSet = new Set([...state.activeTags].map((t) => t.toLowerCase()));
  const tagSubstr = state.tagQuery.trim().toLowerCase().replace(/^#+/, "");
  const tags = (a.tags || []).map((t) => t.toLowerCase());
  if (tagSet.size && ![...tagSet].every((t) => tags.includes(t))) return false;
  if (tagSubstr && !tags.some((t) => t.includes(tagSubstr))) return false;
  return true;
}

// 주간 카드는 importance가 마크다운에 명시되어 있으므로 frontmatter fetch 없이 바로 채운다.
function hydrateWeeklyImportance(root) {
  $$(".card", root).forEach((card) => {
    const slot = card.querySelector("[data-importance-slot]");
    if (!slot) return;
    // weekly card는 buildArticleCard에서 importance를 따로 dataset에 넣지 않으므로
    // articleFile로 weeklySections를 역참조.
    const file = slot.dataset.importanceSlot;
    const article = (state.weeklySections || [])
      .flatMap((s) => s.articles)
      .find((a) => a.articleFile === file);
    if (!article || article.importance == null) return;
    const v = importanceVisual(article.importance);
    slot.classList.add("importance", v.cls);
    slot.innerHTML = `<span class="dots" aria-hidden="true">${v.dots}</span><span class="num">${escapeHtml(String(article.importance))}</span>`;
    slot.setAttribute("aria-label", `중요도 ${article.importance} / 10`);
    card.dataset.importance = String(article.importance);
  });
}

// ─────────── Article modal ───────────
const FOCUSABLE_SEL = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapModalFocus(e) {
  if (e.key !== "Tab") return;
  const panel = $("#article-panel");
  if (!panel || panel.hidden) return;
  const focusables = $$(FOCUSABLE_SEL, panel).filter((el) => !el.hasAttribute("hidden") && el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

async function openArticleModal(date, file) {
  state.modal.lastFocused = document.activeElement;
  const panel = $("#article-panel");
  const backdrop = $(".modal-backdrop");
  const body = bind("article-body");
  const sourceLink = bind("article-source-link");
  panel.hidden = false;
  backdrop.hidden = false;
  // double rAF to allow transition class
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.classList.add("open");
    backdrop.classList.add("open");
  }));
  state.modal.open = true;
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", trapModalFocus);
  body.innerHTML = `<div class="skeleton-list"><div class="card skeleton"></div></div>`;
  try {
    const article = await loadArticle(date, file);
    renderArticleInto(body, article);
    if (sourceLink) sourceLink.href = article.frontmatter.url || "#";
    panel.setAttribute("aria-labelledby", "article-h1");
    const closeBtn = panel.querySelector('[data-action="close-modal"]');
    closeBtn?.focus();
  } catch (err) {
    body.innerHTML = `<div class="error" role="alert"><div class="title">기사를 불러올 수 없습니다</div><div>${escapeHtml(err.message || "")}</div></div>`;
  }
}

function renderArticleInto(root, article) {
  const fm = article.frontmatter || {};
  const topics = (fm.user_topics || []).map((t) => TOPIC_LABELS[t] || t).join(", ");
  const importance = importanceVisual(fm.importance_score);
  root.innerHTML = `
    <header>
      <div class="article-meta">
        ${fm.source ? `<span>${escapeHtml(fm.source)}</span>` : ""}
        ${fm.published_at ? `<span class="dot-sep">·</span><span>${escapeHtml(formatPublished(fm.published_at))}</span>` : ""}
        ${topics ? `<span class="dot-sep">·</span><span>${escapeHtml(topics)}</span>` : ""}
      </div>
      <h1 class="article-h1" id="article-h1">${escapeHtml(fm.title || "")}</h1>
      ${fm.importance_score != null ? `<div class="article-importance"><span class="importance ${importance.cls}"><span class="dots">${importance.dots}</span> <span>${fm.importance_score}</span></span><span>${escapeHtml(fm.importance_reasoning || "")}</span></div>` : ""}
    </header>
    <div class="article-body prose-ko">${renderMarkdown(article.body)}</div>
    <div class="article-tags">${(fm.auto_tags || []).map((t) => buildTagChipHtml(t)).join("")}</div>
    ${fm.url ? `<a class="cta-btn" href="${escapeHtml(fm.url)}" target="_blank" rel="noopener noreferrer">원문 읽기 →</a>` : ""}
  `;
  // Attach tag chip handlers
  root.querySelectorAll(".tag").forEach((el) => {
    el.addEventListener("click", () => {
      const t = el.dataset.tag;
      if (!t) return;
      addTag(t);
      closeArticleModal();
    });
  });
}

function buildTagChipHtml(rawTag) {
  const tag = rawTag.replace(/^#+/, "");
  return `<button type="button" class="tag" data-tag="${escapeHtml(tag)}"><span class="hash">#</span><span>${escapeHtml(tag)}</span></button>`;
}

function importanceVisual(score) {
  if (score == null) return { cls: "low", dots: "" };
  if (score <= 4) return { cls: "low", dots: "●" };
  if (score <= 7) return { cls: "mid", dots: "●●" };
  return { cls: "high", dots: "●●●" };
}

function formatPublished(s) {
  // RFC822 or ISO; show YYYY-MM-DD HH:MM if parsable.
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function closeArticleModal() {
  if (!state.modal.open) return;
  const panel = $("#article-panel");
  const backdrop = $(".modal-backdrop");
  panel.classList.remove("open");
  backdrop.classList.remove("open");
  setTimeout(() => {
    panel.hidden = true;
    backdrop.hidden = true;
  }, 220);
  state.modal.open = false;
  document.body.style.overflow = "";
  document.removeEventListener("keydown", trapModalFocus);
  // Restore focus to the trigger element if still in DOM, else fall back to main.
  const last = state.modal.lastFocused;
  if (last && document.contains(last) && typeof last.focus === "function") last.focus();
  else $("#main")?.focus();
  // Strip /article/... from hash only when the current hash is an article route.
  const { parts } = parseHash();
  if (parts[0] === "article") {
    const fallbackParts = state.date ? [state.date] : ["today"];
    setHash(fallbackParts, { topic: state.selectedTopics, tag: state.activeTags });
  }
}

// ─────────── Drawer ───────────
function openDrawer() {
  const drawer = $("#mobile-drawer");
  const backdrop = $(".drawer-backdrop");
  drawer.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    drawer.classList.add("open");
    backdrop.classList.add("open");
  }));
}
function closeDrawer() {
  const drawer = $("#mobile-drawer");
  const backdrop = $(".drawer-backdrop");
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  setTimeout(() => { drawer.hidden = true; backdrop.hidden = true; }, 200);
}

// ─────────── Loading / empty / error ───────────
function showSkeleton() {
  const root = bind("content");
  if (!root) return;
  const tpl = document.getElementById("tpl-skeleton");
  root.innerHTML = "";
  root.appendChild(tpl.content.cloneNode(true));
}

function showEmpty(msg) {
  const root = bind("content");
  if (!root) return;
  root.innerHTML = "";
  root.appendChild(emptyEl(msg, false));
}

function emptyEl(msg, withClear) {
  const div = document.createElement("div");
  div.className = "empty";
  div.innerHTML = `<div class="title">${escapeHtml(msg)}</div>${withClear ? `<button class="link-btn" data-action="clear-filters">필터 초기화</button>` : ""}`;
  return div;
}

function showFatalError(err) {
  const root = bind("content");
  if (!root) return;
  const cmd = "python -m http.server 8000";
  root.innerHTML = `
    <div class="error" role="alert">
      <div class="title">디지스트 파일을 불러올 수 없습니다</div>
      <div>원인: ${escapeHtml(err.message || String(err))}</div>
      <div style="margin-top:12px">News Brief 루트 디렉토리에서 다음 명령을 실행하세요:</div>
      <code>${cmd}</code>
      <div style="margin-top:8px">manifest.json이 없다면 먼저 <code>python scripts/visualizer/build_manifest.py</code>를 실행하세요.</div>
    </div>
  `;
}

// ─────────── Global event wiring ───────────
function attachGlobalListeners() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    switch (action) {
      case "cycle-theme": cycleTheme(); break;
      case "today": goToLatest(); break;
      case "prev-date": navigateDate(-1); break;
      case "next-date": navigateDate(+1); break;
      case "clear-filters": clearFilters(); break;
      case "close-modal": closeArticleModal(); break;
      case "open-drawer": openDrawer(); break;
      case "close-drawer": closeDrawer(); break;
      case "open-calendar": openCalendar(); break;
      case "open-admin": setHash(["admin", "topics"]); break;
    }
  });

  $$('.seg').forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view === state.view) return;
      if (view === "weekly") {
        const week = state.manifest.weekly?.[0]?.week;
        if (!week) return;
        setHash(["weekly", week]);
      } else {
        setHash([state.date || state.manifest.latest_date]);
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.modal.open) closeArticleModal();
    }
    if (e.target.matches("input, textarea, [contenteditable]")) return;
    if (e.key === "/") { e.preventDefault(); bind("tag-input")?.focus(); }
    if (e.key === "[") navigateDate(-1);
    if (e.key === "]") navigateDate(+1);
  });

  // System theme listener
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if ((localStorage.getItem(THEME_PREF_KEY) || "auto") === "auto") applyTheme();
  });
}

function navigateDate(dir) {
  // dir < 0 (`[`): older. dir > 0 (`]`): newer.
  if (state.view === "weekly") {
    // weekly view: 이전/다음 주로 이동 (publish-visualizer Cycle #2 weekly-view-period-picker)
    const weeks = (state.manifest.weekly || []).map((w) => w.week);
    if (!weeks.length) return;
    const cur = state.weekly?.frontmatter?.iso_week;
    const idx = weeks.indexOf(cur);
    if (idx < 0) return;
    // weeks 는 newest-first → older = idx+1, newer = idx-1
    const targetIdx = idx + (dir < 0 ? +1 : -1);
    if (targetIdx >= 0 && targetIdx < weeks.length) {
      setHash(["weekly", weeks[targetIdx]]);
    }
    return;
  }
  // daily view
  // availableDates() is newest-first, so older = next in array.
  const target = adjacentDate(state.date, dir < 0 ? +1 : -1);
  if (target) setHash([target], { topic: state.selectedTopics, tag: state.activeTags });
}

function goToLatest() {
  setHash([state.manifest.latest_date]);
}

function openCalendar() {
  const input = $("#calendar-input");
  if (!input) return;

  if (state.view === "weekly") {
    // weekly view: input type 을 "week" 로 전환해 주(period) 단위 셀렉터로 동작
    const weeks = (state.manifest.weekly || []).map((w) => w.week);
    if (!weeks.length) return;
    input.type = "week";
    // weeks 는 newest-first
    input.min = weeks[weeks.length - 1];
    input.max = weeks[0];
    input.value = state.weekly?.frontmatter?.iso_week || weeks[0];
    input.onchange = () => {
      const v = input.value; // "YYYY-Www"
      if ((state.manifest.weekly || []).some((w) => w.week === v)) {
        setHash(["weekly", v]);
      }
    };
    input.showPicker?.();
    return;
  }

  // daily view
  input.type = "date";
  const dates = availableDates();
  if (dates.length) {
    input.min = dates[dates.length - 1];
    input.max = dates[0];
    input.value = state.date || dates[0];
  }
  input.onchange = () => {
    const v = input.value;
    if (dateEntry(v)) setHash([v]);
  };
  input.showPicker?.();
}

bootstrap();
