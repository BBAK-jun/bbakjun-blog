'use client';

import BlogPostsView from '@/features/posts/ui/blog-posts-view';
import { filterPosts } from '@/features/posts/model/filter-posts';
import { Post } from '@repo/content';
import { parseAsString, useQueryState } from 'nuqs';

interface SearchablePostsClientProps {
  posts: Post[];
  tags: string[];
}

export default function SearchablePostsClient({ posts, tags }: SearchablePostsClientProps) {
  const [searchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      shallow: true,
    })
  );

  const filteredPosts = filterPosts(posts, searchQuery);

  return <BlogPostsView posts={filteredPosts} tags={tags} searchQuery={searchQuery} />;
}
