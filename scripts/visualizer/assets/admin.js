// Admin page — config.yaml + filter_criteria.md editor.
// Talks to server.py REST API. Loaded by app.js when route starts with #/admin.

import { escapeHtml } from "./parser.js";

// `news/2026-04-30/articles/20260430-foo.md` → `/article/2026-04-30/20260430-foo`
// Returns null if the path doesn't look like an article markdown.
const _ARTICLE_PATH_RE = /(?:^|\/)news\/(\d{4}-\d{2}-\d{2})\/articles\/([^/]+?)\.md$/;
function articlePathToRoute(path) {
  if (!path) return null;
  const m = String(path).match(_ARTICLE_PATH_RE);
  return m ? `/article/${m[1]}/${m[2]}` : null;
}

const TABS = [
  { id: "topics",   label: "토픽" },
  { id: "queries",  label: "검색어" },
  { id: "feeds",    label: "RSS 피드" },
  { id: "criteria", label: "필터 기준" },
];

const state = {
  config: null,        // last server-loaded config (raw object)
  draft: null,         // working copy for current tab
  criteria: null,      // last server-loaded markdown content
  criteriaDraft: null,
  criteriaPreview: false,
  activeTab: "topics",
  loading: false,
  dirty: false,
};

let _toastTimer = null;

function _navGuard(e) {
  if (state.dirty) {
    e.preventDefault();
    e.returnValue = "";
    return "";
  }
}

export async function renderAdmin(parts) {
  // parts looks like ["admin"] or ["admin", "topics"|"queries"|"feeds"|"criteria"]
  const requested = parts[1] || "topics";
  const tabIds = TABS.map((t) => t.id);
  const tabId = tabIds.includes(requested) ? requested : "topics";

  document.body.classList.add("admin-mode");
  window.removeEventListener("beforeunload", _navGuard);
  window.addEventListener("beforeunload", _navGuard);

  // If we navigated to a different tab and there are unsaved edits, ask first.
  if (state.activeTab !== tabId && state.dirty) {
    const ok = confirm("저장하지 않은 변경사항이 있습니다. 다른 탭으로 이동하시겠습니까?");
    if (!ok) {
      // bounce hash back to the previous tab
      location.hash = `#/admin/${state.activeTab}`;
      return;
    }
    state.dirty = false;
  }
  state.activeTab = tabId;

  const root = document.querySelector('[data-bind="content"]');
  root.innerHTML = "";

  const layout = document.createElement("div");
  layout.className = "admin-layout";

  // ── Tabs (left) ──
  const tabs = document.createElement("nav");
  tabs.className = "admin-tabs";
  tabs.setAttribute("aria-label", "관리 섹션");
  TABS.forEach((t) => {
    const a = document.createElement("a");
    a.className = "admin-tab";
    a.href = `#/admin/${t.id}`;
    a.textContent = t.label;
    if (t.id === tabId) a.setAttribute("aria-current", "true");
    tabs.appendChild(a);
  });
  layout.appendChild(tabs);

  // ── Panel (right) ──
  const panel = document.createElement("section");
  panel.className = "admin-panel";
  panel.setAttribute("aria-live", "polite");
  layout.appendChild(panel);

  root.appendChild(layout);

  // Load and render
  await ensureLoaded(tabId);
  renderPanel(panel, tabId);
}

export function leaveAdmin() {
  document.body.classList.remove("admin-mode");
  window.removeEventListener("beforeunload", _navGuard);
}

// ─────────── Loaders ───────────
async function ensureLoaded(tabId) {
  if (tabId === "criteria") {
    if (state.criteria == null) await loadCriteria();
  } else {
    if (state.config == null) await loadConfig();
  }
  // Initialise draft for the tab.
  if (tabId === "criteria") {
    if (state.criteriaDraft == null || !state.dirty) state.criteriaDraft = state.criteria;
  } else {
    if (state.draft == null || !state.dirty) state.draft = clone(state.config);
  }
}

async function loadConfig() {
  state.loading = true;
  const res = await fetch("/api/config", { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/config -> ${res.status}`);
  state.config = await res.json();
  state.draft = clone(state.config);
  state.dirty = false;
  state.loading = false;
}

async function loadCriteria() {
  state.loading = true;
  const res = await fetch("/api/filter-criteria", { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/filter-criteria -> ${res.status}`);
  const data = await res.json();
  state.criteria = data.content || "";
  state.criteriaDraft = state.criteria;
  state.dirty = false;
  state.loading = false;
}

// ─────────── Save ───────────
async function saveConfig() {
  const res = await fetch("/api/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state.draft),
  });
  let payload = null;
  try { payload = await res.json(); } catch { /* */ }
  if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`);
  // Reload from server so we see the canonical structure.
  await loadConfig();
  return payload;
}

async function saveCriteria() {
  const res = await fetch("/api/filter-criteria", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: state.criteriaDraft }),
  });
  let payload = null;
  try { payload = await res.json(); } catch { /* */ }
  if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`);
  await loadCriteria();
  return payload;
}

// ─────────── Panel rendering ───────────
function renderPanel(panel, tabId) {
  panel.innerHTML = "";
  const head = document.createElement("div");
  head.className = "admin-head";
  const tab = TABS.find((t) => t.id === tabId);
  head.innerHTML = `<h2>${escapeHtml(tab.label)}</h2>`;

  const actions = document.createElement("div");
  actions.className = "admin-actions";
  head.appendChild(actions);
  panel.appendChild(head);

  const body = document.createElement("div");
  panel.appendChild(body);

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-primary";
  saveBtn.textContent = "저장";
  saveBtn.disabled = !state.dirty;
  if (state.dirty) saveBtn.classList.add("dirty");
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    try {
      const result = tabId === "criteria" ? await saveCriteria() : await saveConfig();
      const t = (result?.saved_at ? new Date(result.saved_at) : new Date());
      const stamp = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
      showToast(`저장 완료 · ${stamp}`);
      // Re-render with the newly loaded server state.
      renderPanel(panel, tabId);
    } catch (err) {
      console.error(err);
      showToast(`저장 실패: ${err.message}`, true);
      saveBtn.disabled = false;
    }
  });
  actions.appendChild(saveBtn);

  if (tabId === "topics") renderTopics(body, saveBtn);
  else if (tabId === "queries") renderQueries(body, saveBtn);
  else if (tabId === "feeds") renderFeeds(body, saveBtn);
  else if (tabId === "criteria") renderCriteria(body, saveBtn, head);
}

function markDirty(saveBtn) {
  state.dirty = true;
  saveBtn.disabled = false;
  saveBtn.classList.add("dirty");
}

// ─────────── Tab: Topics ───────────
function renderTopics(body, saveBtn) {
  const draft = state.draft;
  if (!Array.isArray(draft.topics)) draft.topics = [];

  // Suggestions section (above the topic list). Empty container until fetch returns.
  const suggWrap = document.createElement("div");
  suggWrap.className = "admin-suggestions";
  body.appendChild(suggWrap);

  const list = document.createElement("div");
  list.className = "admin-card-list";
  body.appendChild(list);

  let cachedSuggestions = null;

  function rebuild() {
    list.innerHTML = "";
    draft.topics.forEach((topic, idx) => list.appendChild(buildTopicCard(topic, idx)));
    paintSuggestions();
  }

  async function loadSuggestionsOnce() {
    if (cachedSuggestions !== null) return;
    try {
      const res = await fetch("/api/suggested-topics");
      cachedSuggestions = res.ok ? (await res.json()).suggestions || [] : [];
    } catch {
      cachedSuggestions = [];
    }
    paintSuggestions();
  }

  function paintSuggestions() {
    suggWrap.innerHTML = "";
    if (!cachedSuggestions || cachedSuggestions.length === 0) return;
    const head = document.createElement("div");
    head.className = "admin-section-head";
    head.textContent = `토픽 제안 (${cachedSuggestions.length})`;
    suggWrap.appendChild(head);
    const grid = document.createElement("div");
    grid.className = "admin-card-list";
    cachedSuggestions.forEach((s) => grid.appendChild(buildSuggestionCard(s)));
    suggWrap.appendChild(grid);
  }

  function buildSuggestionCard(s) {
    const card = document.createElement("div");
    card.className = "admin-card admin-suggestion";

    const title = document.createElement("div");
    title.className = "admin-sugg-title";
    title.appendChild(Object.assign(document.createElement("strong"), { textContent: s.name }));
    if (s.count) {
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = ` · ${s.count}`;
      title.appendChild(sub);
    }
    card.appendChild(title);

    if (s.definition) {
      const d = document.createElement("div");
      d.className = "admin-sugg-def";
      d.textContent = s.definition;
      card.appendChild(d);
    }
    if (Array.isArray(s.keywords) && s.keywords.length) {
      const kw = document.createElement("div");
      kw.className = "sub admin-sugg-desc";
      kw.textContent = `참고 키워드: ${s.keywords.join(", ")}`;
      card.appendChild(kw);
    } else if (s.evidence) {
      const ev = document.createElement("div");
      ev.className = "sub admin-sugg-desc";
      ev.textContent = s.evidence;
      card.appendChild(ev);
    }

    if (Array.isArray(s.articles) && s.articles.length) {
      const wrap = document.createElement("div");
      wrap.className = "sub admin-sugg-articles";
      const lab = document.createElement("span");
      lab.textContent = "관련 기사: ";
      wrap.appendChild(lab);
      s.articles.forEach((a, i) => {
        if (i) wrap.appendChild(document.createTextNode(", "));
        if (a.path) {
          const route = articlePathToRoute(a.path);
          const link = document.createElement("a");
          // Open in new tab so the user keeps unsaved admin edits.
          link.href = route ? `#${route}` : `/${a.path}`;
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = a.title || a.path;
          wrap.appendChild(link);
        } else {
          wrap.appendChild(document.createTextNode(a.title || ""));
        }
      });
      card.appendChild(wrap);
    }

    const metaParts = [];
    if (s.first_seen) metaParts.push(`최초 ${s.first_seen}`);
    if (s.last_seen) metaParts.push(`마지막 ${s.last_seen}`);
    if (metaParts.length) {
      const meta = document.createElement("div");
      meta.className = "sub";
      meta.textContent = metaParts.join(" · ");
      card.appendChild(meta);
    }

    const foot = document.createElement("div");
    foot.className = "admin-card-foot";
    const exists = draft.topics.some((t) => t.name === s.name);
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary";
    addBtn.textContent = exists ? "✓ 추가됨" : "+ 토픽으로 추가";
    addBtn.disabled = exists;
    addBtn.addEventListener("click", () => {
      if (draft.topics.some((t) => t.name === s.name)) return;
      // description holds the topic's *definition* (scope), not extracted keywords
      // or article titles. If the agent didn't supply one, leave it empty so the
      // user writes a proper definition before saving.
      draft.topics.push({
        name: s.name,
        label: humanizeName(s.name),
        description: s.definition || "",
      });
      markDirty(saveBtn);
      rebuild();
    });
    foot.appendChild(addBtn);
    card.appendChild(foot);
    return card;
  }

  function humanizeName(name) {
    return String(name).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function buildTopicCard(topic, idx) {
    const card = document.createElement("div");
    card.className = "admin-card";
    const fields = [
      { key: "name",        label: "name",        readonly: !!topic.name && idx < (state.config?.topics?.length ?? 0) },
      { key: "label",       label: "label",       readonly: false },
      { key: "description", label: "description", readonly: false, textarea: true },
    ];
    fields.forEach((f) => {
      const row = document.createElement("div");
      row.className = "row";
      const lab = document.createElement("label");
      lab.className = "sub";
      lab.textContent = f.label;
      const input = document.createElement(f.textarea ? "textarea" : "input");
      input.className = f.textarea ? "admin-textarea" : "admin-input";
      if (!f.textarea) input.type = "text";
      input.value = topic[f.key] ?? "";
      if (f.readonly) input.readOnly = true;
      input.addEventListener("input", () => {
        topic[f.key] = input.value;
        markDirty(saveBtn);
      });
      row.appendChild(lab);
      row.appendChild(input);
      card.appendChild(row);
    });

    // Optional keywords
    const kwRow = document.createElement("div");
    kwRow.className = "row";
    const kwLab = document.createElement("label");
    kwLab.className = "sub";
    kwLab.textContent = "keywords";
    const kwInput = document.createElement("input");
    kwInput.type = "text";
    kwInput.className = "admin-input";
    kwInput.placeholder = "콤마로 구분 (예: gpt, llama, claude)";
    kwInput.value = Array.isArray(topic.keywords) ? topic.keywords.join(", ") : (topic.keywords || "");
    kwInput.addEventListener("input", () => {
      const v = kwInput.value.trim();
      if (!v) {
        delete topic.keywords;
      } else {
        topic.keywords = v.split(",").map((s) => s.trim()).filter(Boolean);
      }
      markDirty(saveBtn);
    });
    kwRow.appendChild(kwLab);
    kwRow.appendChild(kwInput);
    card.appendChild(kwRow);

    const foot = document.createElement("div");
    foot.className = "admin-card-foot";
    const del = document.createElement("button");
    del.className = "btn btn-danger";
    del.textContent = "삭제";
    del.addEventListener("click", () => {
      if (!confirm(`토픽 "${topic.name || topic.label || ""}"를 삭제하시겠습니까?`)) return;
      draft.topics.splice(idx, 1);
      markDirty(saveBtn);
      rebuild();
    });
    foot.appendChild(del);
    card.appendChild(foot);
    return card;
  }

  rebuild();
  loadSuggestionsOnce();

  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "+ 토픽 추가";
  addBtn.style.marginTop = "12px";
  addBtn.addEventListener("click", () => {
    draft.topics.push({ name: "new_topic", label: "", description: "" });
    markDirty(saveBtn);
    rebuild();
  });
  body.appendChild(addBtn);
}

// ─────────── Tab: Queries ───────────
function renderQueries(body, saveBtn) {
  const draft = state.draft;
  if (!draft.sources) draft.sources = {};
  if (!draft.sources.web_search) draft.sources.web_search = { enabled: true, queries: [], max_results_per_query: 5, language: "ko" };
  const ws = draft.sources.web_search;
  if (!Array.isArray(ws.queries)) ws.queries = [];

  const wrap = document.createElement("div");
  wrap.className = "admin-list-rows";
  body.appendChild(wrap);

  function rebuild() {
    wrap.innerHTML = "";
    ws.queries.forEach((q, i) => {
      const row = document.createElement("div");
      row.className = "admin-list-row";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "admin-input";
      input.value = q;
      input.addEventListener("input", () => {
        ws.queries[i] = input.value;
        markDirty(saveBtn);
      });
      const ctrls = document.createElement("div");
      ctrls.className = "ctrls";
      const up = document.createElement("button");
      up.className = "btn btn-ghost";
      up.textContent = "↑";
      up.disabled = i === 0;
      up.addEventListener("click", () => { swap(ws.queries, i, i - 1); markDirty(saveBtn); rebuild(); });
      const down = document.createElement("button");
      down.className = "btn btn-ghost";
      down.textContent = "↓";
      down.disabled = i === ws.queries.length - 1;
      down.addEventListener("click", () => { swap(ws.queries, i, i + 1); markDirty(saveBtn); rebuild(); });
      const del = document.createElement("button");
      del.className = "btn btn-danger";
      del.textContent = "삭제";
      del.addEventListener("click", () => { ws.queries.splice(i, 1); markDirty(saveBtn); rebuild(); });
      ctrls.append(up, down, del);
      row.append(input, ctrls);
      wrap.appendChild(row);
    });
  }
  rebuild();

  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "+ 검색어 추가";
  addBtn.style.marginTop = "12px";
  addBtn.addEventListener("click", () => {
    ws.queries.push("");
    markDirty(saveBtn);
    rebuild();
  });
  body.appendChild(addBtn);
}

// ─────────── Tab: RSS Feeds ───────────
function renderFeeds(body, saveBtn) {
  const draft = state.draft;
  if (!draft.sources) draft.sources = {};
  if (!Array.isArray(draft.sources.rss_feeds)) draft.sources.rss_feeds = [];
  const feeds = draft.sources.rss_feeds;

  const list = document.createElement("div");
  list.className = "admin-card-list";
  body.appendChild(list);

  function rebuild() {
    list.innerHTML = "";
    feeds.forEach((feed, idx) => {
      const card = document.createElement("div");
      card.className = "admin-card";
      [
        { key: "name", label: "name" },
        { key: "url",  label: "url" },
        { key: "lang", label: "lang", placeholder: "ko 또는 en" },
      ].forEach((f) => {
        const row = document.createElement("div");
        row.className = "row";
        const lab = document.createElement("label");
        lab.className = "sub";
        lab.textContent = f.label;
        const input = document.createElement("input");
        input.type = "text";
        input.className = "admin-input";
        input.value = feed[f.key] ?? "";
        if (f.placeholder) input.placeholder = f.placeholder;
        input.addEventListener("input", () => { feed[f.key] = input.value; markDirty(saveBtn); });
        row.append(lab, input);
        card.appendChild(row);
      });
      const foot = document.createElement("div");
      foot.className = "admin-card-foot";
      const del = document.createElement("button");
      del.className = "btn btn-danger";
      del.textContent = "삭제";
      del.addEventListener("click", () => {
        if (!confirm(`피드 "${feed.name || feed.url || ""}"를 삭제하시겠습니까?`)) return;
        feeds.splice(idx, 1);
        markDirty(saveBtn);
        rebuild();
      });
      foot.appendChild(del);
      card.appendChild(foot);
      list.appendChild(card);
    });
  }
  rebuild();

  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "+ 피드 추가";
  addBtn.style.marginTop = "12px";
  addBtn.addEventListener("click", () => {
    feeds.push({ name: "", url: "", lang: "en" });
    markDirty(saveBtn);
    rebuild();
  });
  body.appendChild(addBtn);
}

// ─────────── Tab: Filter Criteria ───────────
function renderCriteria(body, saveBtn, head) {
  // Add a preview toggle button to the head actions area.
  const actions = head.querySelector(".admin-actions");
  const previewBtn = document.createElement("button");
  previewBtn.className = "btn";
  previewBtn.textContent = state.criteriaPreview ? "미리보기 끄기" : "미리보기";
  previewBtn.addEventListener("click", () => {
    state.criteriaPreview = !state.criteriaPreview;
    renderPanel(body.parentElement, "criteria");
  });
  actions.insertBefore(previewBtn, saveBtn);

  const grid = document.createElement("div");
  grid.className = "admin-criteria-grid" + (state.criteriaPreview ? " split" : "");
  body.appendChild(grid);

  const ta = document.createElement("textarea");
  ta.className = "admin-textarea";
  ta.spellcheck = false;
  ta.value = state.criteriaDraft ?? "";
  ta.addEventListener("input", () => {
    state.criteriaDraft = ta.value;
    markDirty(saveBtn);
    if (state.criteriaPreview && preview) {
      preview.innerHTML = renderMarkdown(state.criteriaDraft);
    }
  });
  grid.appendChild(ta);

  let preview = null;
  if (state.criteriaPreview) {
    preview = document.createElement("div");
    preview.className = "admin-criteria-preview prose-ko";
    preview.innerHTML = renderMarkdown(state.criteriaDraft ?? "");
    grid.appendChild(preview);
  }
}

// ─────────── Misc ───────────
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function pad(n) { return String(n).padStart(2, "0"); }
function swap(arr, a, b) { const t = arr[a]; arr[a] = arr[b]; arr[b] = t; }

function renderMarkdown(md) {
  // marked is loaded globally via CDN script tag.
  if (typeof window.marked?.parse === "function") {
    return window.marked.parse(md, { breaks: true });
  }
  return `<pre>${escapeHtml(md)}</pre>`;
}

function showToast(message, isError = false) {
  let el = document.querySelector(".admin-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "admin-toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.toggle("error", !!isError);
  // force reflow then add show
  void el.offsetWidth;
  el.classList.add("show");
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}
