import {
  processMarkdown
} from "./chunk-UZVXQ3SA.mjs";
import {
  getAllPosts,
  getAllPostsIncludingDrafts,
  getAllTags,
  getPostBySlug,
  getPostSlugs,
  getPostsByTag,
  getRelatedPosts
} from "./chunk-EYTNGVVS.mjs";
import {
  rehypeMermaid
} from "./chunk-NG4EI63L.mjs";

// src/series.ts
async function getAllSeries() {
  const allPosts = await getAllPosts();
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
async function getSeriesSummaries() {
  const allSeries = await getAllSeries();
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
async function getSeriesBySlug(slug) {
  const allSeries = await getAllSeries();
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
async function getPostSeries(postSlug) {
  const allSeries = await getAllSeries();
  for (const series of allSeries) {
    if (series.posts.some((p) => p.slug === postSlug)) {
      return series;
    }
  }
  return null;
}
export {
  getAllPosts,
  getAllPostsIncludingDrafts,
  getAllSeries,
  getAllTags,
  getPostBySlug,
  getPostSeries,
  getPostSlugs,
  getPostsByTag,
  getRelatedPosts,
  getSeriesBySlug,
  getSeriesNavigation,
  getSeriesSummaries,
  processMarkdown,
  rehypeMermaid
};
