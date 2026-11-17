import SearchablePostsClient from '@/features/post-search/ui/searchable-posts-client';
import BlogPostsView from '@/features/posts/ui/blog-posts-view';
import { getBlobFiles } from '@/shared/lib/blob';
import { getAllPosts, getAllTags } from '@repo/content';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '포스트 | 박준형',
  description: '프론트엔드 개발자 박준형의 블로그 포스트',
};

export const revalidate = 3600;

export default async function PostsPage() {
  const blobFiles = await getBlobFiles();
  const [allPosts, tags] = await Promise.all([getAllPosts(blobFiles), getAllTags(blobFiles)]);

  const clientPosts = allPosts.map(post => ({
    ...post,
    content: post.content?.slice(0, 1000),
  }));

  return (
    <Suspense fallback={<BlogPostsView posts={allPosts} tags={tags} searchQuery="" />}>
      <SearchablePostsClient posts={clientPosts} tags={tags} />
    </Suspense>
  );
}
