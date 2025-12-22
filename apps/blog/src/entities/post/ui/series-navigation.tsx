import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { BookOpen, ChevronLeft, ChevronRight, List } from 'lucide-react';
import type { Series, Post } from '@repo/types';

interface SeriesNavigationProps {
  series: Series;
  currentPost: Post;
  prev: Post | null;
  next: Post | null;
}

export default function SeriesNavigation({
  series,
  currentPost,
  prev,
  next,
}: SeriesNavigationProps) {
  const currentIndex = series.posts.findIndex(p => p.slug === currentPost.slug);
  const progress = ((currentIndex + 1) / series.totalPosts) * 100;

  return (
    <Card className="my-8">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">
                <Link href={`/series/${series.slug}`} className="hover:underline">
                  {series.title}
                </Link>
              </CardTitle>
              <CardDescription className="mt-1">
                {currentIndex + 1} / {series.totalPosts} 포스트
              </CardDescription>
            </div>
          </div>
          <Badge variant={series.status === 'completed' ? 'default' : 'secondary'}>
            {series.status === 'completed' ? '완료' : '진행중'}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Navigation buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prev ? (
              <Link href={`/blog/${prev.slug}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <div className="text-left overflow-hidden">
                    <div className="text-xs text-muted-foreground">이전 포스트</div>
                    <div className="truncate font-medium">{prev.frontMatter.title}</div>
                  </div>
                </Button>
              </Link>
            ) : (
              <div /> // Empty div for grid alignment
            )}

            {next ? (
              <Link href={`/blog/${next.slug}`} className="block sm:col-start-2">
                <Button variant="outline" className="w-full justify-end">
                  <div className="text-right overflow-hidden">
                    <div className="text-xs text-muted-foreground">다음 포스트</div>
                    <div className="truncate font-medium">{next.frontMatter.title}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : null}
          </div>

          <Separator />

          {/* View all posts button */}
          <Link href={`/series/${series.slug}`} className="block">
            <Button variant="ghost" className="w-full">
              <List className="w-4 h-4 mr-2" />
              시리즈 전체 보기
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
