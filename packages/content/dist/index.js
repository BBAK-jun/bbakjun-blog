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
  getAllSeries: () => getAllSeries,
  getAllTags: () => getAllTags,
  getPostBySlug: () => getPostBySlug,
  getPostSeries: () => getPostSeries,
  getPostsByTag: () => getPostsByTag,
  getRelatedPosts: () => getRelatedPosts,
  getSeriesBySlug: () => getSeriesBySlug,
  getSeriesNavigation: () => getSeriesNavigation,
  getSeriesSummaries: () => getSeriesSummaries,
  processMarkdown: () => processMarkdown,
  rehypeMermaid: () => rehypeMermaid
});
module.exports = __toCommonJS(index_exports);

// src/posts-blob.ts
var import_gray_matter = __toESM(require("gray-matter"));
var import_reading_time = __toESM(require("reading-time"));
function filterMarkdownFiles(files) {
  return files.filter(
    (file) => (file.pathname.endsWith(".md") || file.pathname.endsWith(".mdx")) && !file.pathname.includes("/.")
    // 숨김 파일 제외
  );
}
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
async function fetchPostFromBlobFile(file) {
  try {
    const content = await downloadBlobContent(file.url);
    const { data, content: markdownContent } = (0, import_gray_matter.default)(content);
    const readingTimeStats = (0, import_reading_time.default)(markdownContent);
    const slug = pathnameToSlug(file.pathname);
    return {
      slug,
      frontMatter: data,
      content: markdownContent,
      readingTime: readingTimeStats.text
    };
  } catch (error) {
    console.error(`Error fetching post ${file.pathname}:`, error);
    return null;
  }
}
async function fetchAllPostsFromBlobFiles(blobFiles) {
  const mdFiles = filterMarkdownFiles(blobFiles);
  const posts = await Promise.all(
    mdFiles.map((file) => fetchPostFromBlobFile(file))
  );
  return posts.filter((post) => post !== null);
}

// src/posts.ts
async function getPostBySlug(blobFiles, slug) {
  const allPosts = await fetchAllPostsFromBlobFiles(blobFiles);
  return allPosts.find((post) => post.slug === slug) || null;
}
async function getAllPosts(blobFiles) {
  const posts = await fetchAllPostsFromBlobFiles(blobFiles);
  return posts.filter((post) => !post.frontMatter.draft).sort((a, b) => {
    const orderA = a.frontMatter.order ?? 999999;
    const orderB = b.frontMatter.order ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime();
  });
}
async function getAllPostsIncludingDrafts(blobFiles) {
  const posts = await fetchAllPostsFromBlobFiles(blobFiles);
  return posts.sort((a, b) => {
    const orderA = a.frontMatter.order ?? 999999;
    const orderB = b.frontMatter.order ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime();
  });
}
async function getPostsByTag(blobFiles, tag) {
  const allPosts = await getAllPosts(blobFiles);
  return allPosts.filter(
    (post) => post.frontMatter.tags?.includes(tag)
  );
}
async function getAllTags(blobFiles) {
  const allPosts = await getAllPosts(blobFiles);
  const tags = /* @__PURE__ */ new Set();
  allPosts.forEach((post) => {
    post.frontMatter.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}
async function getRelatedPosts(blobFiles, currentPost, maxPosts = 4) {
  const allPosts = await getAllPosts(blobFiles);
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

// src/series.ts
async function getAllSeries(blobFiles) {
  const allPosts = await getAllPosts(blobFiles);
  const seriesMap = /* @__PURE__ */ new Map();
  for (const post of allPosts) {
    const seriesSlug = post.frontMatter.series;
    if (seriesSlug) {
      if (!seriesMap.has(seriesSlug)) {
        seriesMap.set(seriesSlug, []);
      }
      seriesMap.get(seriesSlug).push(post);
    }
  }
  const series = [];
  for (const [slug, posts] of seriesMap.entries()) {
    const sortedPosts = posts.sort((a, b) => {
      const orderA = a.frontMatter.seriesOrder ?? 999;
      const orderB = b.frontMatter.seriesOrder ?? 999;
      return orderA - orderB;
    });
    const firstPost = sortedPosts[0];
    const lastPost = sortedPosts[sortedPosts.length - 1];
    const title = slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    series.push({
      slug,
      title,
      description: `${sortedPosts.length}\uAC1C\uC758 \uD3EC\uC2A4\uD2B8\uB85C \uAD6C\uC131\uB41C \uC2DC\uB9AC\uC988`,
      status: "ongoing",
      // Can be determined by checking if there are recent posts
      posts: sortedPosts,
      totalPosts: sortedPosts.length,
      startedAt: firstPost.frontMatter.date,
      updatedAt: lastPost.frontMatter.date
    });
  }
  return series.sort((a, b) => {
    const dateA = new Date(a.updatedAt || "");
    const dateB = new Date(b.updatedAt || "");
    return dateB.getTime() - dateA.getTime();
  });
}
async function getSeriesSummaries(blobFiles) {
  const allSeries = await getAllSeries(blobFiles);
  return allSeries.map((series) => ({
    slug: series.slug,
    title: series.title,
    description: series.description,
    cover: series.cover,
    status: series.status,
    totalPosts: series.totalPosts,
    startedAt: series.startedAt,
    updatedAt: series.updatedAt
  }));
}
async function getSeriesBySlug(blobFiles, slug) {
  const allSeries = await getAllSeries(blobFiles);
  return allSeries.find((s) => s.slug === slug) || null;
}
function getSeriesNavigation(series, currentSlug) {
  const currentIndex = series.posts.findIndex((p) => p.slug === currentSlug);
  if (currentIndex === -1) {
    return { prev: null, next: null };
  }
  return {
    prev: currentIndex > 0 ? series.posts[currentIndex - 1] : null,
    next: currentIndex < series.posts.length - 1 ? series.posts[currentIndex + 1] : null
  };
}
async function getPostSeries(blobFiles, postSlug) {
  const allSeries = await getAllSeries(blobFiles);
  for (const series of allSeries) {
    if (series.posts.some((p) => p.slug === postSlug)) {
      return series;
    }
  }
  return null;
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

// src/rehype-optimize-images.ts
var import_unist_util_visit = require("unist-util-visit");
function rehypeOptimizeImages() {
  return (tree) => {
    (0, import_unist_util_visit.visit)(tree, "element", (node, index, parent) => {
      if (node.tagName === "img" && parent && typeof index === "number") {
        const src = node.properties?.src;
        const alt = node.properties?.alt || "";
        if (!src) return;
        node.properties = {
          ...node.properties,
          loading: "lazy",
          decoding: "async",
          alt,
          // Add CSS classes for styling
          className: "blog-image rounded-lg my-6 w-full h-auto",
          // Add dimensions if not already present (prevents layout shift)
          style: "max-width: 100%; height: auto;"
        };
        if (alt && parent.type === "element") {
          const figure = {
            type: "element",
            tagName: "figure",
            properties: {
              className: "blog-image-figure my-8"
            },
            children: [
              { ...node },
              // Clone the img node
              {
                type: "element",
                tagName: "figcaption",
                properties: {
                  className: "text-center text-sm text-gray-600 dark:text-gray-400 mt-2 italic"
                },
                children: [
                  {
                    type: "text",
                    value: alt
                  }
                ]
              }
            ]
          };
          parent.children[index] = figure;
          return import_unist_util_visit.SKIP;
        }
      }
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
  }).use(rehypeMermaid).use(rehypeOptimizeImages).use(import_rehype_stringify.default, { allowDangerousHtml: true });
  const result = await processor.process(content);
  return String(result);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAllPosts,
  getAllPostsIncludingDrafts,
  getAllSeries,
  getAllTags,
  getPostBySlug,
  getPostSeries,
  getPostsByTag,
  getRelatedPosts,
  getSeriesBySlug,
  getSeriesNavigation,
  getSeriesSummaries,
  processMarkdown,
  rehypeMermaid
});
