import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "posts");
const postsJsonPath = path.join(postsDir, "posts.json");

export async function getPostIndex() {
  const raw = await fs.readFile(postsJsonPath, "utf-8");
  const data = JSON.parse(raw);
  const categoryPosts = data.find((item) => item.category_posts)?.category_posts ?? [];

  return categoryPosts
    .flatMap((categoryGroup) =>
      categoryGroup.posts.map((post) => ({
        id: String(post.id),
        title: post.title || "",
        date: post.date || "",
        category: categoryGroup.category || "기타",
      })),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostById(id) {
  const [posts, raw] = await Promise.all([
    getPostIndex(),
    fs.readFile(path.join(postsDir, `${id}.md`), "utf-8"),
  ]);
  const post = posts.find((item) => item.id === String(id));
  const parsed = matter(raw);

  if (!post) {
    return null;
  }

  return {
    ...post,
    title: post.title || parsed.data.title || "제목 없음",
    body: parsed.content,
    excerpt: extractExcerpt(parsed.content),
    searchText: extractSearchText(parsed.content),
  };
}

export async function getAllPosts() {
  const posts = await getPostIndex();
  return Promise.all(posts.map((post) => getPostById(post.id)));
}

export function groupPostsByCategory(posts) {
  return posts.reduce((groups, post) => {
    groups[post.category] = groups[post.category] ?? [];
    groups[post.category].push(post);
    return groups;
  }, {});
}

export function extractExcerpt(markdown, maxLength = 120) {
  const text = markdownToPlainText(markdown);

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated}...`;
}

export function extractSearchText(markdown) {
  return markdownToPlainText(markdown).toLowerCase();
}

function markdownToPlainText(markdown) {
  const text = markdown
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#+\s+.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]+/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}
