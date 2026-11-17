import { Post } from '@repo/content';

export function filterPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) {
    return posts;
  }

  const lowerQuery = query.toLowerCase();

  return posts.filter(post => {
    if (post.frontMatter.title?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    if (post.frontMatter.description?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    if (post.frontMatter.tags?.some(tag => tag?.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    return post.content?.slice(0, 1000).toLowerCase().includes(lowerQuery) ?? false;
  });
}
