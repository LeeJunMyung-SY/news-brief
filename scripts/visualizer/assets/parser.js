// Frontmatter + markdown parsing helpers.
// Uses globals from the CDN bundles (`marked`, `jsyaml`).

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

export function parseFrontmatter(text) {
  const match = text.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: {}, body: text };
  const raw = match[1];
  const body = text.slice(match[0].length);
  let fm = {};
  try {
    fm = window.jsyaml ? window.jsyaml.load(raw) || {} : {};
  } catch (err) {
    console.warn("frontmatter parse failed", err);
  }
  return { frontmatter: fm, body };
}

let rendererPatched = false;

function patchMarkedOnce() {
  if (rendererPatched || !window.marked) return;
  // Use marked.use() with a renderer hook — works across marked v9+ signatures.
  window.marked.use({
    gfm: true,
    breaks: false,
    renderer: {
      link(href, title, text) {
        // marked v9+ may pass an object {href,title,text} as the first arg.
        let h = href, t = title, x = text;
        if (typeof href === "object" && href !== null) {
          h = href.href; t = href.title; x = href.text;
        }
        if (typeof h !== "string") return false; // fall back to default
        const titleAttr = t ? ` title="${escapeAttr(t)}"` : "";
        if (/^https?:\/\//i.test(h)) {
          return `<a href="${escapeAttr(h)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${x}</a>`;
        }
        const articleMatch = h.match(/articles\/([^/?#]+\.md)/);
        if (articleMatch) {
          return `<a href="#" data-article-link="${escapeAttr(articleMatch[1])}"${titleAttr}>${x}</a>`;
        }
        return `<a href="${escapeAttr(h)}"${titleAttr}>${x}</a>`;
      },
    },
  });
  rendererPatched = true;
}

function escapeAttr(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

export function renderMarkdown(text) {
  if (!window.marked) return escapeHtml(text);
  patchMarkedOnce();
  try {
    return window.marked.parse(text);
  } catch (err) {
    console.warn("markdown render failed", err);
    return `<pre>${escapeHtml(text)}</pre>`;
  }
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Parse a digest body into structured sections of article cards.
// Each `## <Label> (N)` becomes a section; entries `### N. [title](href) `#tags` — [원문](url)`.
const SECTION_HEADER_RE = /^##\s+(.+?)(?:\s*\((\d+)\))?\s*$/;
const ARTICLE_HEADER_RE = /^###\s+\d+\.\s+\[(.+?)\]\(([^)]+)\)\s*(?:`([^`]*)`)?\s*(?:—\s*\[[^\]]*\]\(([^)]+)\))?/;
const SUMMARY_RE = /^>\s?(.*)$/;

export function parseDigestBody(body) {
  const sections = [];
  let current = null;
  let pendingArticle = null;
  let trailing = []; // lines after sections (e.g. "오늘의 주요 테마")
  let inTrailing = false;
  let trailingSection = null;

  const lines = body.split(/\r?\n/);

  function flushArticle() {
    if (current && pendingArticle) {
      current.articles.push(pendingArticle);
      pendingArticle = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sec = line.match(SECTION_HEADER_RE);
    if (sec) {
      flushArticle();
      const label = sec[1].trim();
      // A trailing "오늘의 주요 테마" / "신규 토픽 제안" type section is non-article narrative.
      const isTrailing = !/\(\d+\)\s*$/.test(line);
      if (isTrailing) {
        inTrailing = true;
        trailingSection = { label, lines: [] };
        trailing.push(trailingSection);
        current = null;
      } else {
        inTrailing = false;
        current = { label, count: sec[2] ? Number(sec[2]) : null, articles: [] };
        sections.push(current);
      }
      continue;
    }
    if (inTrailing) {
      trailingSection.lines.push(line);
      continue;
    }
    if (!current) continue;

    const art = line.match(ARTICLE_HEADER_RE);
    if (art) {
      flushArticle();
      const tagStr = (art[3] || "").trim();
      const tags = tagStr ? tagStr.split(/\s+/).filter(Boolean) : [];
      pendingArticle = {
        title: art[1].trim(),
        href: art[2].trim(),
        tags,
        sourceUrl: art[4] ? art[4].trim() : null,
        summary: "",
        articleFile: extractArticleFile(art[2].trim()),
      };
      continue;
    }
    if (pendingArticle) {
      const sum = line.match(SUMMARY_RE);
      if (sum) {
        pendingArticle.summary = pendingArticle.summary
          ? `${pendingArticle.summary} ${sum[1]}`
          : sum[1];
      }
    }
  }
  flushArticle();

  const trailingMd = trailing
    .map((t) => `## ${t.label}\n${t.lines.join("\n")}`)
    .join("\n\n")
    .trim();
  return { sections, trailingMd };
}

function extractArticleFile(href) {
  const m = href.match(/articles\/([^/?#]+\.md)/);
  return m ? m[1] : null;
}
