// src/posts.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
var postsDirectory = path.join(process.cwd(), "content/posts");
console.log(postsDirectory);
function getAllMdxFiles(dir, relativePath = "") {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const items = fs.readdirSync(dir);
  let files = [];
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const subPath = relativePath ? `${relativePath}/${item}` : item;
      files = files.concat(getAllMdxFiles(fullPath, subPath));
    } else if (item.endsWith(".mdx")) {
      const fileName = item.replace(/\.mdx$/, "");
      if (fileName === "index" && relativePath) {
        files.push(relativePath);
      } else {
        const slug = relativePath ? `${relativePath}/${fileName}` : fileName;
        files.push(slug);
      }
    }
  }
  return files;
}
function getPostSlugs() {
  return getAllMdxFiles(postsDirectory);
}
function getPostBySlug(slug) {
  try {
    let fullPath = path.join(postsDirectory, slug, "index.mdx");
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, `${slug}.mdx`);
    }
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const readingTimeStats = readingTime(content);
    return {
      slug,
      frontMatter: data,
      content,
      readingTime: readingTimeStats.text
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}
function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => getPostBySlug(slug)).filter((post) => post !== null).filter((post) => !post.frontMatter.draft).sort((a, b) => {
    const orderA = a.frontMatter.order ?? 999999;
    const orderB = b.frontMatter.order ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime();
  });
  return posts;
}
function getAllPostsIncludingDrafts() {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => getPostBySlug(slug)).filter((post) => post !== null).sort((a, b) => {
    const orderA = a.frontMatter.order ?? 999999;
    const orderB = b.frontMatter.order ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime();
  });
  return posts;
}
function getPostsByTag(tag) {
  const allPosts = getAllPosts();
  return allPosts.filter(
    (post) => post.frontMatter.tags?.includes(tag)
  );
}
function getAllTags() {
  const allPosts = getAllPosts();
  const tags = /* @__PURE__ */ new Set();
  allPosts.forEach((post) => {
    post.frontMatter.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}
function getRelatedPosts(currentPost, maxPosts = 4) {
  const allPosts = getAllPosts();
  const currentSlug = currentPost.slug;
  const currentTags = currentPost.frontMatter.tags || [];
  const currentCategory = currentPost.slug.split("/")[0];
  const otherPosts = allPosts.filter((post) => post.slug !== currentSlug);
  const postsWithScores = otherPosts.map((post) => {
    let score = 0;
    const postTags = post.frontMatter.tags || [];
    const postCategory = post.slug.split("/")[0];
    const commonTags = postTags.filter((tag) => currentTags.includes(tag));
    score += commonTags.length * 3;
    if (postCategory === currentCategory) {
      score += 2;
    }
    const postDate = new Date(post.frontMatter.date).getTime();
    const currentDate = new Date(currentPost.frontMatter.date).getTime();
    const daysDiff = Math.abs(currentDate - postDate) / (1e3 * 60 * 60 * 24);
    if (daysDiff < 30) {
      score += 0.5;
    }
    return {
      post,
      score,
      commonTags: commonTags.length,
      sameCategory: postCategory === currentCategory
    };
  });
  return postsWithScores.sort((a, b) => {
    if (b.score === a.score) {
      if (b.commonTags === a.commonTags) {
        return new Date(b.post.frontMatter.date).getTime() - new Date(a.post.frontMatter.date).getTime();
      }
      return b.commonTags - a.commonTags;
    }
    return b.score - a.score;
  }).slice(0, maxPosts).map((item) => item.post);
}

export {
  getPostSlugs,
  getPostBySlug,
  getAllPosts,
  getAllPostsIncludingDrafts,
  getPostsByTag,
  getAllTags,
  getRelatedPosts
};
