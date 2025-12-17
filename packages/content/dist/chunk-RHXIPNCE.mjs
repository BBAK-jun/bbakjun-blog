// src/posts.ts
import fs from "fs";
import path from "path";
import matter2 from "gray-matter";
import readingTime2 from "reading-time";

// src/posts-blob.ts
import matter from "gray-matter";
import readingTime from "reading-time";
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
    const { data, content: markdownContent } = matter(content);
    const readingTimeStats = readingTime(markdownContent);
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
async function fetchAllPostsFromBlobFiles(blobFiles2) {
  const mdFiles = filterMarkdownFiles(blobFiles2);
  const posts = await Promise.all(
    mdFiles.map((file) => fetchPostFromBlobFile(file))
  );
  return posts.filter((post) => post !== null);
}

// src/posts.ts
var postsDirectory = path.join(process.cwd(), "../../packages/content/posts");
var blobFiles = [];
function setBlobFiles(files) {
  blobFiles = files;
}
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
async function getPostBySlug(slug) {
  if (process.env.POST_SOURCE === "blob") {
    const allPosts = await fetchAllPostsFromBlobFiles(blobFiles);
    return allPosts.find((post) => post.slug === slug) || null;
  }
  try {
    let fullPath = path.join(postsDirectory, slug, "index.mdx");
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, `${slug}.mdx`);
    }
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter2(fileContents);
    const readingTimeStats = readingTime2(content);
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
  if (process.env.POST_SOURCE === "blob") {
    const posts2 = await fetchAllPostsFromBlobFiles(blobFiles);
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
  if (process.env.POST_SOURCE === "blob") {
    const posts2 = await fetchAllPostsFromBlobFiles(blobFiles);
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

export {
  setBlobFiles,
  getPostSlugs,
  getPostBySlug,
  getAllPosts,
  getAllPostsIncludingDrafts,
  getPostsByTag,
  getAllTags,
  getRelatedPosts
};
