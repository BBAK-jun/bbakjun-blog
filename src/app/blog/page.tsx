import { getAllPosts, getAllTags } from '@/lib/posts'
import BlogWithSearch from '@/components/BlogWithSearch'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '모든 포스트 | DEV_BBAK 블로그',
  description: 'DEV_BBAK 블로그의 모든 포스트를 확인해보세요.',
}

export default function PostsPage() {
  const posts = getAllPosts()
  const tags = getAllTags()

  return <BlogWithSearch posts={posts} tags={tags} />
}