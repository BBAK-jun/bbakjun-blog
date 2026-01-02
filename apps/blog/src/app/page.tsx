import Link from 'next/link';
import { PopularPostsGrid } from '@/widgets/popular-posts';
import { RecentPostsGrid } from '@/widgets/recent-posts';

// ISR 설정: 60초마다 재검증 (최신글 자동 업데이트)
export const revalidate = 60;

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto space-y-20">
      {/* Hero Section */}
      <section className="space-y-6 py-8">
        <h1 className="text-5xl md:text-6xl font-bold">
          박준형
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
          프론트엔드 개발자
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          사용자 경험을 만들고, 그 경험이 운영 환경에서도 안정적으로 유지되게 하는 데 관심이 있습니다.
          React와 TypeScript로 확장 가능하고 유지보수하기 쉬운 웹 애플리케이션을 만듭니다.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="https://github.com/BBAK-jun"
            target="_blank"
            className="text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2"
          >
            GitHub
          </Link>
          <Link
            href="https://www.linkedin.com/in/bbakjun0913/"
            target="_blank"
            className="text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2"
          >
            LinkedIn
          </Link>
          <Link
            href="mailto:wnsguddl789@gmail.com"
            className="text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2"
          >
            Email
          </Link>
          <Link
            href="https://bbakjun.notion.site/25c42b6fc4ab807b8b24d8e40d935819"
            target="_blank"
            className="text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2"
          >
            이력서
          </Link>
        </div>
      </section>

      {/* Posts Section */}
      <section className="space-y-10">
        <div>
          <h2 className="text-2xl font-bold mb-8">최신 포스트</h2>
          <RecentPostsGrid limit={10} />
        </div>

        <div className="pt-8 border-t border-border/15">
          <h2 className="text-2xl font-bold mb-8">인기 포스트</h2>
          <PopularPostsGrid limit={10} />
        </div>
      </section>
    </div>
  );
}
