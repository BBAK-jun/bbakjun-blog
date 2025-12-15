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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  getAllPosts: () => getAllPosts,
  getAllPostsIncludingDrafts: () => getAllPostsIncludingDrafts,
  getAllTags: () => getAllTags,
  getPostBySlug: () => getPostBySlug,
  getPostSlugs: () => getPostSlugs,
  getPostsByTag: () => getPostsByTag,
  getRelatedPosts: () => getRelatedPosts,
  processMarkdown: () => processMarkdown,
  rehypeMermaid: () => rehypeMermaid
});
module.exports = __toCommonJS(index_exports);

// src/posts.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_gray_matter2 = __toESM(require("gray-matter"));
var import_reading_time2 = __toESM(require("reading-time"));

// src/posts-blob.ts
var import_blob = require("@vercel/blob");
var import_gray_matter = __toESM(require("gray-matter"));
var import_reading_time = __toESM(require("reading-time"));
var cachedPosts = null;
var lastFetchTime = 0;
var CACHE_DURATION = 60 * 60 * 1e3;
function pathnameToSlug(pathname) {
  let slug = pathname;
  slug = slug.replace(/\.(md|mdx)$/, "");
  if (slug.endsWith("/index")) {
    slug = slug.replace(/\/index$/, "");
  }
  return slug;
}
async function downloadBlobContent(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download blob: ${response.statusText}`);
  }
  return response.text();
}
async function fetchPostFromBlob(pathname, url) {
  try {
    const content = await downloadBlobContent(url);
    const { data, content: markdownContent } = (0, import_gray_matter.default)(content);
    const readingTimeStats = (0, import_reading_time.default)(markdownContent);
    const slug = pathnameToSlug(pathname);
    return {
      slug,
      frontMatter: data,
      content: markdownContent,
      readingTime: readingTimeStats.text
    };
  } catch (error) {
    console.error(`Error fetching post ${pathname}:`, error);
    return null;
  }
}
async function fetchAllPostsFromBlob() {
  const now = Date.now();
  if (cachedPosts && now - lastFetchTime < CACHE_DURATION) {
    console.log("Using cached posts from Blob");
    return cachedPosts;
  }
  console.log("Fetching posts from Blob Storage...");
  try {
    const { blobs } = await (0, import_blob.list)({
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    const mdBlobs = blobs.filter(
      (blob) => (blob.pathname.endsWith(".md") || blob.pathname.endsWith(".mdx")) && !blob.pathname.includes("/.")
      // 숨김 파일 제외
    );
    console.log(`Found ${mdBlobs.length} markdown files in Blob Storage`);
    const posts = await Promise.all(
      mdBlobs.map((blob) => fetchPostFromBlob(blob.pathname, blob.url))
    );
    const validPosts = posts.filter((post) => post !== null);
    cachedPosts = validPosts;
    lastFetchTime = now;
    console.log(`Successfully fetched ${validPosts.length} posts from Blob`);
    return validPosts;
  } catch (error) {
    console.error("Error fetching posts from Blob:", error);
    if (cachedPosts) {
      console.log("Returning cached posts due to error");
      return cachedPosts;
    }
    return [];
  }
}

// src/posts.ts
var postsDirectory = import_path.default.join(process.cwd(), "../../packages/content/posts");
var POST_SOURCE = process.env.POST_SOURCE || "filesystem";
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
async function getPostBySlug(slug) {
  if (POST_SOURCE === "blob") {
    const allPosts = await fetchAllPostsFromBlob();
    return allPosts.find((post) => post.slug === slug) || null;
  }
  try {
    let fullPath = import_path.default.join(postsDirectory, slug, "index.mdx");
    if (!import_fs.default.existsSync(fullPath)) {
      fullPath = import_path.default.join(postsDirectory, `${slug}.mdx`);
    }
    const fileContents = import_fs.default.readFileSync(fullPath, "utf8");
    const { data, content } = (0, import_gray_matter2.default)(fileContents);
    const readingTimeStats = (0, import_reading_time2.default)(content);
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
async function getAllPosts() {
  if (POST_SOURCE === "blob") {
    const posts2 = await fetchAllPostsFromBlob();
    return posts2.filter((post) => !post.frontMatter.draft).sort((a, b) => {
      const orderA = a.frontMatter.order ?? 999999;
      const orderB = b.frontMatter.order ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime();
    });
  }
  const slugs = getPostSlugs();
  const postsPromises = slugs.map((slug) => getPostBySlug(slug));
  const posts = (await Promise.all(postsPromises)).filter((post) => post !== null).filter((post) => !post.frontMatter.draft).sort((a, b) => {
    const orderA = a.frontMatter.order ?? 999999;
    const orderB = b.frontMatter.order ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime();
  });
  return posts;
}
async function getAllPostsIncludingDrafts() {
  if (POST_SOURCE === "blob") {
    const posts2 = await fetchAllPostsFromBlob();
    return posts2.sort((a, b) => {
      const orderA = a.frontMatter.order ?? 999999;
      const orderB = b.frontMatter.order ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime();
    });
  }
  const slugs = getPostSlugs();
  const postsPromises = slugs.map((slug) => getPostBySlug(slug));
  const posts = (await Promise.all(postsPromises)).filter((post) => post !== null).sort((a, b) => {
    const orderA = a.frontMatter.order ?? 999999;
    const orderB = b.frontMatter.order ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime();
  });
  return posts;
}
async function getPostsByTag(tag) {
  const allPosts = await getAllPosts();
  return allPosts.filter(
    (post) => post.frontMatter.tags?.includes(tag)
  );
}
async function getAllTags() {
  const allPosts = await getAllPosts();
  const tags = /* @__PURE__ */ new Set();
  allPosts.forEach((post) => {
    post.frontMatter.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}
async function getRelatedPosts(currentPost, maxPosts = 4) {
  const allPosts = await getAllPosts();
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

// src/markdown.ts
var import_unified = require("unified");
var import_remark_parse = __toESM(require("remark-parse"));
var import_remark_gfm = __toESM(require("remark-gfm"));
var import_remark_rehype = __toESM(require("remark-rehype"));
var import_rehype_slug = __toESM(require("rehype-slug"));
var import_rehype_autolink_headings = __toESM(require("rehype-autolink-headings"));
var import_rehype_highlight = __toESM(require("rehype-highlight"));
var import_rehype_stringify = __toESM(require("rehype-stringify"));

// src/rehype-mermaid.ts
function walkTree(node, callback, parent, index) {
  callback(node, parent, index);
  if ("children" in node && Array.isArray(node.children)) {
    node.children.forEach((child, childIndex) => {
      walkTree(child, callback, node, childIndex);
    });
  }
}
function rehypeMermaid() {
  return (tree) => {
    const nodesToReplace = [];
    walkTree(tree, (node, parent, index) => {
      if (node.type === "element" && node.tagName === "code" && node.properties && Array.isArray(node.properties.className) && node.properties.className.includes("language-mermaid")) {
        const element = node;
        const codeContent = element.children.filter((child) => child.type === "text").map((child) => child.value).join("");
        const mermaidElement = {
          type: "element",
          tagName: "div",
          properties: {
            "data-mermaid": codeContent,
            className: ["mermaid-container", "my-6", "p-4", "bg-white", "dark:bg-gray-900", "rounded-lg", "border", "border-gray-200", "dark:border-gray-700", "shadow-sm", "overflow-x-auto"]
          },
          children: [
            {
              type: "element",
              tagName: "pre",
              properties: {
                className: ["mermaid"],
                style: "display: flex; justify-content: center; align-items: center; min-height: 150px;"
              },
              children: [
                {
                  type: "text",
                  value: codeContent
                }
              ]
            }
          ]
        };
        if (parent && parent.tagName === "pre") {
          walkTree(tree, (grandParentNode, greatGrandParent, grandParentIndex) => {
            if (grandParentNode === parent && greatGrandParent && grandParentIndex !== void 0) {
              nodesToReplace.push({
                parent: greatGrandParent,
                index: grandParentIndex,
                newNode: mermaidElement
              });
            }
          });
        } else if (parent && index !== void 0) {
          nodesToReplace.push({
            parent,
            index,
            newNode: mermaidElement
          });
        }
      }
    });
    nodesToReplace.forEach(({ parent, index, newNode }) => {
      parent.children[index] = newNode;
    });
  };
}

// src/markdown.ts
async function processMarkdown(content) {
  const processor = (0, import_unified.unified)().use(import_remark_parse.default).use(import_remark_gfm.default).use(import_remark_rehype.default, { allowDangerousHtml: true }).use(import_rehype_slug.default).use(import_rehype_autolink_headings.default, {
    behavior: "append",
    properties: {
      className: ["anchor-link"],
      title: "Direct link to heading"
    },
    content: () => [
      {
        type: "element",
        tagName: "svg",
        properties: {
          className: ["anchor-icon"],
          width: 16,
          height: 16,
          viewBox: "0 0 16 16",
          fill: "currentColor"
        },
        children: [
          {
            type: "element",
            tagName: "path",
            properties: {
              d: "M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"
            },
            children: []
          }
        ]
      }
    ]
  }).use(import_rehype_highlight.default, {
    detect: true,
    ignoreMissing: true
  }).use(rehypeMermaid).use(import_rehype_stringify.default, { allowDangerousHtml: true });
  const result = await processor.process(content);
  return String(result);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAllPosts,
  getAllPostsIncludingDrafts,
  getAllTags,
  getPostBySlug,
  getPostSlugs,
  getPostsByTag,
  getRelatedPosts,
  processMarkdown,
  rehypeMermaid
});
