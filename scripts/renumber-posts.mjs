import fs from "node:fs/promises";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const postsDir = path.join(root, "posts");
const postsJsonPath = path.join(postsDir, "posts.json");
const imageRoots = [path.join(root, "public", "images"), path.join(root, "images")];

const raw = await fs.readFile(postsJsonPath, "utf-8");
const data = JSON.parse(raw);
const categoryPosts = data.find((item) => item.category_posts)?.category_posts ?? [];

const entries = categoryPosts.flatMap((group) =>
  group.posts.map((post) => ({
    oldId: String(post.id),
    title: post.title,
    date: post.date,
    category: group.category,
  })),
);

entries.sort((a, b) => {
  const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
  return diff !== 0 ? diff : Number(a.oldId) - Number(b.oldId);
});

const mapping = new Map(entries.map((entry, index) => [entry.oldId, String(index + 1)]));

// Phase 1: posts -> temp names
for (const [oldId, newId] of mapping) {
  if (oldId === newId) continue;
  const src = path.join(postsDir, `${oldId}.md`);
  const tmp = path.join(postsDir, `__renum_${oldId}.md`);
  await fs.rename(src, tmp);
}

// Phase 2: temp -> final names + update image paths inside
for (const [oldId, newId] of mapping) {
  if (oldId === newId) continue;
  const src = path.join(postsDir, `__renum_${oldId}.md`);
  const dest = path.join(postsDir, `${newId}.md`);
  let body = await fs.readFile(src, "utf-8");
  body = body.replaceAll(`images/${oldId}/`, `images/${newId}/`);
  await fs.writeFile(dest, body, "utf-8");
  await fs.unlink(src);
}

// Posts that kept the same id may still reference old image paths only if unchanged — fix 1.md if needed (1 stays 1)

// Image folders
for (const imageRoot of imageRoots) {
  try {
    await fs.access(imageRoot);
  } catch {
    continue;
  }

  for (const [oldId, newId] of mapping) {
    if (oldId === newId) continue;
    const srcDir = path.join(imageRoot, oldId);
    const destDir = path.join(imageRoot, newId);
    try {
      await fs.access(srcDir);
    } catch {
      continue;
    }
    try {
      await fs.access(destDir);
      console.warn(`skip image dir (exists): ${destDir}`);
      continue;
    } catch {
      await fs.rename(srcDir, destDir);
    }
  }
}

// Update posts.json
for (const group of categoryPosts) {
  for (const post of group.posts) {
    post.id = mapping.get(String(post.id)) ?? post.id;
  }
}

const meta = data.find((item) => item.all_posts_count !== undefined);
if (meta) meta.all_posts_count = entries.length;

await fs.writeFile(postsJsonPath, JSON.stringify(data, null, "\t") + "\n", "utf-8");

console.log("Renumbered posts (old -> new):");
for (const [oldId, newId] of [...mapping.entries()].sort((a, b) => Number(a[1]) - Number(b[1]))) {
  if (oldId !== newId) console.log(`  ${oldId} -> ${newId}`);
}
