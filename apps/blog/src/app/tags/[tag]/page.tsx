import { notFound } from 'next/navigation';
import { getPostsByTag, getAllTags } from '@repo/content';
import PostCard from '@/entities/post/ui/post-card';
import Link from 'next/link';
import { Metadata } from 'next';
import { getBlobFiles } from '@/shared/lib/blob';

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

// 정적 경로 생성 (ISR과 함께 사용)
export async function generateStaticParams() {
  const blobFiles = await getBlobFiles();
  const tags = await getAllTags(blobFiles);
  return tags.map(tag => ({
    tag: encodeURIComponent(tag),
  }));
}

// ISR 설정: 300초(5분)마다 재검증
export const revalidate = 300;

// 새 태그가 추가되면 런타임에 생성 후 캐싱
export const dynamicParams = true;

// 메타데이터 생성
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const blobFiles = await getBlobFiles();
  const posts = await getPostsByTag(blobFiles, decodedTag);

  if (posts.length === 0) {
    return {
      title: 'Tag Not Found',
    };
  }

  return {
    title: `#${decodedTag} | 박준형`,
    description: `${decodedTag} 태그의 포스트 ${posts.length}개`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const blobFiles = await getBlobFiles();
  const posts = await getPostsByTag(blobFiles, decodedTag);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-12">
      {/* 페이지 헤더 */}
      <header>
        <Link
          href="/blog"
          className="inline-block text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          ← 포스트
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-2">#{decodedTag}</h1>
        <p className="text-muted-foreground">
          {posts.length}개의 포스트
        </p>
      </header>

      {/* 포스트 목록 */}
      <section>
        <div className="divide-y divide-border/15">
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
