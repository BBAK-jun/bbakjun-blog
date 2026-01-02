import CodeBlockWrapper from '@/shared/ui/code-block-wrapper';
import Comments, { CommentsConfig } from '@/processes/post-reading/ui/comments';
import MermaidRenderer from '@/processes/post-reading/ui/mermaid-renderer';
import PopularPosts from '@/widgets/popular-posts/ui/popular-posts';
import RelatedPosts from '@/entities/post/ui/related-posts';
import SeriesNavigation from '@/entities/post/ui/series-navigation';
import ShareButton from '@/entities/post/ui/share-button';
import TableOfContents from '@/processes/post-reading/ui/table-of-contents';
import ViewCounter from '@/shared/ui/view-counter';
import { getBlobFiles } from '@/shared/lib/blob';
import {
  getAllPosts,
  getPostBySlug,
  getPostSeries,
  getRelatedPosts,
  getSeriesNavigation,
  processMarkdown,
} from '@repo/content';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { env } from '@/env';

interface PostPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// 정적 경로 생성 (ISR과 함께 사용)
export async function generateStaticParams() {
  const blobFiles = await getBlobFiles();
  const posts = await getAllPosts(blobFiles);
  return posts.map(post => ({
    slug: post.slug.split('/'),
  }));
}

// ISR 설정: 60초마다 재검증
export const revalidate = 60;

// 동적 경로 처리 방식
export const dynamicParams = true;

// 메타데이터 생성
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugString = slug.join('/');

  const blobFiles = await getBlobFiles();
  const post = await getPostBySlug(blobFiles, slugString);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const { frontMatter } = post;

  const ogImageUrl = `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/og/${slugString}`;

  return {
    title: `${frontMatter.title}`,
    description: frontMatter.description,
    authors: [{ name: frontMatter.author || 'bbakjun' }],
    keywords: frontMatter.tags?.join(', '),
    openGraph: {
      title: frontMatter.title,
      description: frontMatter.description,
      type: 'article',
      publishedTime: frontMatter.date,
      authors: [frontMatter.author || 'bbakjun'],
      tags: frontMatter.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: frontMatter.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: frontMatter.title,
      description: frontMatter.description,
      images: [ogImageUrl],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const slugString = slug.join('/');

  // React.cache로 중복 호출 방지
  const blobFiles = await getBlobFiles();
  const post = await getPostBySlug(blobFiles, slugString);

  if (!post) {
    notFound();
  }

  const { frontMatter, content, readingTime } = post;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 병렬 데이터 페칭
  const [htmlContent, relatedPosts, series] = await Promise.all([
    processMarkdown(content),
    getRelatedPosts(blobFiles, post, 4),
    getPostSeries(blobFiles, slugString),
  ]);

  const seriesNav = series ? getSeriesNavigation(series, slugString) : null;

  return (
    <div className="max-w-3xl mx-auto">
      <article>
        {/* 포스트 헤더 */}
        <header className="mb-12">
          <Link
            href="/blog"
            className="inline-block text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            ← 포스트
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {frontMatter.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-8">
            <time dateTime={frontMatter.date}>{formatDate(frontMatter.date)}</time>
            <span>·</span>
            <span>{readingTime}</span>
            <span>·</span>
            <ViewCounter slug={slugString} increment={true} />
          </div>

          {frontMatter.tags && frontMatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-3 text-sm">
              {frontMatter.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* 시리즈 네비게이션 */}
        {series && seriesNav && (
          <SeriesNavigation
            series={series}
            currentPost={post}
            prev={seriesNav.prev}
            next={seriesNav.next}
          />
        )}

        {/* 포스트 내용 */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-16"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Mermaid 차트 렌더링 */}
        <MermaidRenderer content={htmlContent} />

        {/* 코드 블록 복사 버튼 */}
        <CodeBlockWrapper />

        {/* 포스트 푸터 */}
        <footer className="space-y-16">
          <div className="border-t border-border/15 pt-8">
            <div className="flex items-center justify-between">
              <ShareButton title={frontMatter.title} description={frontMatter.description} />
            </div>
          </div>

          {/* 연관 포스트 */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6">연관 포스트</h2>
              <RelatedPosts posts={relatedPosts} />
            </section>
          )}

          {/* 댓글 섹션 */}
          <section className="border-t border-border/15 pt-8">
            <h3 className="text-xl font-bold mb-6">댓글</h3>
            {!env.NEXT_PUBLIC_GISCUS_REPO_ID ? (
              <CommentsConfig />
            ) : (
              <Comments identifier={slugString} title={frontMatter.title} />
            )}
          </section>
        </footer>
      </article>
    </div>
  );
}
