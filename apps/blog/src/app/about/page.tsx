import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPopularPostsStats } from '@/lib/stats'
import { getBlobFiles } from '@/lib/blob'
import { getAllPosts } from '@repo/content'
import { Github, Linkedin, Mail, ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '소개 - DEV_BBAK 블로그',
  description: '2026년 5년차 프론트엔드 엔지니어 박준형입니다. 사용자 경험을 만들고, 그 경험이 운영 환경에서도 안정적으로 유지되게 하는 데 관심이 있습니다.',
  openGraph: {
    title: '소개 - DEV_BBAK 블로그',
    description: '2026년 5년차 프론트엔드 엔지니어 박준형입니다.',
  },
}

// ISR: 5분마다 재검증
export const revalidate = 300

export default async function AboutPage() {
  // 블로그 통계 가져오기
  const stats = await getPopularPostsStats()
  const blobFiles = await getBlobFiles()
  const posts = await getAllPosts(blobFiles)

  // 기술 스택
  const techStack = {
    frontend: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Zustand', 'TanStack Query'],
    backend: ['Node.js', 'Hono', 'Prisma', 'PostgreSQL', 'Redis'],
    tools: ['Git', 'Vercel', 'Turbo', 'pnpm', 'VSCode'],
  }

  // 연락처
  const contacts = [
    {
      icon: Github,
      label: 'GitHub',
      href: 'https://github.com/BBAK-jun',
      username: '@BBAK-jun',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/bbakjun0913/',
      username: 'bbakjun0913',
    },
    {
      icon: Mail,
      label: 'Email',
      href: 'mailto:wnsguddl789@gmail.com',
      username: 'wnsguddl789@gmail.com',
    },
    {
      icon: FileText,
      label: '이력서',
      href: 'https://bbakjun.notion.site/25c42b6fc4ab807b8b24d8e40d935819',
      username: 'Notion Resume',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-6xl font-bold text-white">
          박
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">박준형</h1>
        <p className="text-xl text-muted-foreground">Frontend Engineer</p>
        <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
          2026년 5년차
        </div>
        <p className="text-lg max-w-2xl mx-auto leading-relaxed text-muted-foreground">
          사용자 경험을 만들고, 그 경험이 운영 환경에서도 안정적으로 유지되게 하는 데 관심이 있습니다.
          <br />
          React와 TypeScript로 확장 가능하고 유지보수하기 쉬운 웹 애플리케이션을 만듭니다.
        </p>
      </section>

      {/* 블로그 통계 */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 포스트</CardDescription>
            <CardTitle className="text-4xl">{posts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">작성한 글</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 조회수</CardDescription>
            <CardTitle className="text-4xl">{stats.totalViews.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">누적 조회</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>평균 조회수</CardDescription>
            <CardTitle className="text-4xl">{(stats.averageViews || 0).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">글당 평균</p>
          </CardContent>
        </Card>
      </section>

      {/* 기술 스택 */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">기술 스택</h2>

        <Card>
          <CardHeader>
            <CardTitle>Frontend</CardTitle>
            <CardDescription>프론트엔드 개발에 사용하는 기술</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {techStack.frontend.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-sm px-3 py-1">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend & Database</CardTitle>
            <CardDescription>백엔드 및 데이터베이스 기술</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {techStack.backend.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-sm px-3 py-1">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tools & Platform</CardTitle>
            <CardDescription>개발 도구 및 플랫폼</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {techStack.tools.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-sm px-3 py-1">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 주요 프로젝트 */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">주요 프로젝트</h2>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>DEV_BBAK 블로그</CardTitle>
                <CardDescription>개인 기술 블로그</CardDescription>
              </div>
              <Link href="https://github.com/BBAK-jun/bbakjun-blog" target="_blank">
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Next.js 15, TypeScript, MDX 기반의 모던 블로그 플랫폼입니다.
              Vercel Blob Storage와 CDC 패턴을 활용한 효율적인 콘텐츠 관리 시스템을 구현했습니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Next.js 15</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Hono RPC</Badge>
              <Badge variant="outline">Prisma</Badge>
              <Badge variant="outline">Redis</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 추가 프로젝트가 있다면 여기에 Card 추가 */}
      </section>

      {/* 연락처 */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">연락처</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {contacts.map((contact) => (
            <Card key={contact.label}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <contact.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{contact.label}</CardTitle>
                    <CardDescription className="text-xs truncate">{contact.username}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={contact.href} target="_blank">
                  <Button variant="outline" className="w-full" size="sm">
                    방문하기
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-4 py-8 border-t">
        <h2 className="text-2xl font-bold">블로그 둘러보기</h2>
        <p className="text-muted-foreground">
          개발 과정에서 배운 내용과 경험을 공유합니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/blog">모든 포스트 보기</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/tags">태그로 찾아보기</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
