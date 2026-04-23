import { marked } from "marked";
import { basePath } from "./site.js";

export function renderMarkdown(markdown) {
  const headings = [];
  const usedIds = new Set();
  const renderer = new marked.Renderer();

  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((token) => token.raw ?? token.text ?? "").join("");
    const id = uniqueSlug(slugify(text), usedIds);

    if (depth <= 4) {
      headings.push({ id, text, depth });
    }

    return `<h${depth} id="${id}">${escapeHtml(text)}</h${depth}>`;
  };

  renderer.image = ({ href, title, text }) => {
    const src = normalizeAssetPath(href);
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(text)}"${titleAttribute} loading="lazy" decoding="async">`;
  };

  renderer.link = ({ href, title, tokens }) => {
    const target = normalizeAssetPath(href);
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(target)}"${titleAttribute}>${marked.parser(tokens)}</a>`;
  };

  const html = marked(markdown, { renderer })
    .replaceAll('src="images/', `src="${basePath}images/`)
    .replaceAll('src="webapps/', `src="${basePath}webapps/`);
  return { html, headings };
}

function normalizeAssetPath(href) {
  if (!href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("/")) {
    return href;
  }

  if (href.startsWith("images/") || href.startsWith("webapps/")) {
    return `${basePath}${href}`;
  }

  return href;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function uniqueSlug(baseId, usedIds) {
  const safeBaseId = baseId || "section";
  let candidate = safeBaseId;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${safeBaseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\uAC00-\uD7AF-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}
