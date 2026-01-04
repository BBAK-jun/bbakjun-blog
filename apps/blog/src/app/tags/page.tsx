import { getAllTags, getPostsByTag } from '@repo/content';
import Link from 'next/link';
import { Metadata } from 'next';
import { getBlobFiles } from '@/shared/lib/blob';

export const metadata: Metadata = {
  title: '태그 | 박준형',
  description: '블로그 포스트의 모든 태그',
};

export default async function TagsPage() {
  const blobFiles = await getBlobFiles();
  const tags = await getAllTags(blobFiles);

  // 각 태그별 포스트 수 계산
  const tagsWithCount = await Promise.all(
    tags.map(async tag => ({
      name: tag,
      count: (await getPostsByTag(blobFiles, tag)).length,
    }))
  );
  tagsWithCount.sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-12">
      {/* 페이지 헤더 */}
      <header>
        <h1 className="text-4xl font-bold mb-2">태그</h1>
        <p className="text-muted-foreground">
          {tags.length}개의 태그
        </p>
      </header>

      {/* 태그 목록 */}
      <section>
        {tagsWithCount.length > 0 ? (
          <div className="divide-y divide-border/15">
            {tagsWithCount.map(({ name, count }) => (
              <Link
                key={name}
                href={`/tags/${encodeURIComponent(name)}`}
                className="flex items-center justify-between py-4 group"
              >
                <span className="text-foreground group-hover:underline decoration-1 underline-offset-2">
                  #{name}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">태그가 없습니다</p>
          </div>
        )}
      </section>
    </div>
  );
}
