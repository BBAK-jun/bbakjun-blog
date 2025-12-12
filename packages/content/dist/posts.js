"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getAllPosts: () => getAllPosts,
  getAllPostsIncludingDrafts: () => getAllPostsIncludingDrafts,
  getAllTags: () => getAllTags,
  getPostBySlug: () => getPostBySlug,
  getPostSlugs: () => getPostSlugs,
  getPostsByTag: () => getPostsByTag,
  getRelatedPosts: () => getRelatedPosts
});
module.exports = __toCommonJS(posts_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_gray_matter = __toESM(require("gray-matter"));
var import_reading_time = __toESM(require("reading-time"));
var postsDirectory = import_path.default.join(process.cwd(), "content/posts");
function getAllMdxFiles(dir, relativePath = "") {
  if (!import_fs.default.existsSync(dir)) {
    return [];
  }
  const items = import_fs.default.readdirSync(dir);
  let files = [];
  for (const item of items) {
    const fullPath = import_path.default.join(dir, item);
    const stat = import_fs.default.statSync(fullPath);
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
    let fullPath = import_path.default.join(postsDirectory, slug, "index.mdx");
    if (!import_fs.default.existsSync(fullPath)) {
      fullPath = import_path.default.join(postsDirectory, `${slug}.mdx`);
    }
    const fileContents = import_fs.default.readFileSync(fullPath, "utf8");
    const { data, content } = (0, import_gray_matter.default)(fileContents);
    const readingTimeStats = (0, import_reading_time.default)(content);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAllPosts,
  getAllPostsIncludingDrafts,
  getAllTags,
  getPostBySlug,
  getPostSlugs,
  getPostsByTag,
  getRelatedPosts
});
