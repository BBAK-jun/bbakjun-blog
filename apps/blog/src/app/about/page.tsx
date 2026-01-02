import { getPopularPostsStats } from '@/shared/lib/stats';
import { getBlobFiles } from '@/shared/lib/blob';
import { getAllPosts } from '@repo/content';
import Link from 'next/link';
import type { Metadata } from 'next';
import ExperienceTimeline from '@/features/navigation/ui/experience-timeline';

export const metadata: Metadata = {
  title: '소개 | 박준형',
  description: '프론트엔드 개발자 박준형을 소개합니다.',
  openGraph: {
    title: '소개 | 박준형',
    description: `프론트엔드 엔지니어 박준형입니다.`,
  },
};

// ISR: 5분마다 재검증
export const revalidate = 300;

export default async function AboutPage() {
  // 블로그 통계 가져오기
  const stats = await getPopularPostsStats();
  const blobFiles = await getBlobFiles();
  const posts = await getAllPosts(blobFiles);

  // 기술 스택
  const techStack = {
    frontend: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Zustand', 'TanStack Query'],
    backend: ['Node.js', 'Hono', 'Prisma', 'PostgreSQL', 'Redis'],
    tools: ['Git', 'Vercel', 'Turbo', 'pnpm', 'VSCode'],
  };

  return (
    <div className="max-w-3xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="space-y-6 py-8">
        <h1 className="text-5xl md:text-6xl font-bold">박준형</h1>
        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
          프론트엔드 개발자
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          사용자 경험을 만들고, 그 경험이 운영 환경에서도 안정적으로 유지되게 하는 데 관심이 있습니다.
          React와 TypeScript로 확장 가능하고 유지보수하기 쉬운 웹 애플리케이션을 만듭니다.
        </p>

        {/* 연락처 링크 */}
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

      {/* 통계 */}
      <section>
        <div className="grid grid-cols-3 gap-8 py-8 border-t border-b border-border/15">
          <div>
            <div className="text-3xl font-bold">{posts.length}</div>
            <div className="text-sm text-muted-foreground mt-1">포스트</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">조회수</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{(stats.averageViews || 0).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">평균 조회수</div>
          </div>
        </div>
      </section>

      {/* 기술 스택 */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold">기술 스택</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Frontend</h3>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {techStack.frontend.map(tech => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Backend & Database</h3>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {techStack.backend.map(tech => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Tools & Platform</h3>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {techStack.tools.map(tech => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 경력 */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold">경력</h2>
        <ExperienceTimeline />
      </section>

      {/* 주요 프로젝트 */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold">프로젝트</h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-medium">DEV_BBAK 블로그</h3>
              <Link
                href="https://github.com/BBAK-jun/bbakjun-blog"
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2"
              >
                GitHub
              </Link>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Next.js 15, TypeScript, MDX 기반의 모던 블로그 플랫폼입니다.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Next.js 15</span>
              <span>·</span>
              <span>TypeScript</span>
              <span>·</span>
              <span>Hono RPC</span>
              <span>·</span>
              <span>Prisma</span>
              <span>·</span>
              <span>Redis</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
