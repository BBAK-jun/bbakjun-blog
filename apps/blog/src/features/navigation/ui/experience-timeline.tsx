import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Briefcase, Calendar } from 'lucide-react';

interface Experience {
  company: string;
  position: string;
  team?: string;
  period: string;
  current?: boolean;
  description: string;
  achievements: {
    title: string;
    description: string;
    tags?: string[];
  }[];
}

const experiences: Experience[] = [
  {
    company: '비바리퍼블리카 (토스)',
    position: 'Frontend Developer',
    team: '토스 플레이스',
    period: '2026.01 ~ 재직중',
    current: true,
    description: 'TBD..',
    achievements: [],
  },
  {
    company: '데이원컴퍼니',
    position: 'Frontend Developer',
    team: '포도 사업부문 테크팀',
    period: '2024.10 ~ 2025.12',
    description: '글로벌 외국어 레슨 플랫폼 BEP 달성 기여',
    achievements: [
      {
        title: '멀티존 마이크로프론트엔드 아키텍처 설계 및 구축',
        description:
          'PHP, Nuxt.js(Vue), Next.js로 개발된 세 개의 독립 웹앱을 하나의 도메인으로 통합. Next.js Rewrite 기반 멀티존 아키텍처 설계로 쿠키 공유 환경 구축 및 점진적 마이그레이션 구조 구현',
        tags: ['Next.js', 'Vue2', 'Microservices', 'Architecture'],
      },
      {
        title: 'Blue-Green 배포 전략 및 인프라 최적화',
        description:
          'Rolling Deployment에서 Blue-Green 배포로 전환, 5초 내 롤백 가능한 안전장치 구축. Keel Approve 기반 반자동화 배포로 프로덕션 안정성 확보',
        tags: ['DevOps', 'Kubernetes', 'CI/CD'],
      },
      {
        title: '디자인 시스템 구축 및 개발 생산성 개선',
        description:
          'shadcn + Tailwind CSS 기반 디자인 시스템 구축. Figma Design Token 자동화 파이프라인으로 디자인-개발 간 일관성 확보',
        tags: ['Design System', 'Tailwind CSS', 'Automation'],
      },
    ],
  },
  {
    company: '휴톰',
    position: 'Software Engineer',
    team: '플랫폼팀',
    period: '2023.06 ~ 2024.10',
    description: '의료 데이터 라벨링 및 예측 플랫폼 개발',
    achievements: [
      {
        title: '영상 데이터 라벨링 솔루션 개발 및 팀 리딩',
        description:
          '레거시 시스템 전면 개편 프로젝트 주도. 1인 시작에서 3인 팀으로 성장시키며 팀 리딩. Nest.js + TypeORM 마스터하여 풀스택 개발',
        tags: ['Team Leading', 'Nest.js', 'TypeORM', 'PostgreSQL'],
      },
      {
        title: '의료 데이터 보안 아키텍처 설계',
        description:
          'GCS Signed URL 기반 미디어 접근 제어 시스템 구축. 수술 영상 데이터 보안을 위한 4가지 접근 방식 비교 분석 후 최적 솔루션 도출',
        tags: ['Security', 'GCS', 'Architecture'],
      },
      {
        title: '모노레포 기반 개발 환경 통합',
        description:
          'Turborepo 기반 모노레포 환경 구축으로 코드 재사용성 극대화. CI/CD 시간 평균 2분대 단축',
        tags: ['Turborepo', 'Monorepo', 'DevOps'],
      },
      {
        title: '클라우드 인프라 최적화',
        description:
          'Google Compute Engine → Cloud Run 전환으로 서버리스 아키텍처 구현. 서버 운영 비용 35% 절감',
        tags: ['GCP', 'Cloud Run', 'Cost Optimization'],
      },
    ],
  },
  {
    company: '세진마인드',
    position: 'Frontend Engineer',
    team: '개발팀',
    period: '2022.03 ~ 2023.05',
    description: '특허관리 백오피스 및 온라인 상표 출원 서비스 개발',
    achievements: [
      {
        title: 'PIIP Intranet & Markiny 프론트엔드 개발',
        description:
          'Next.js, GraphQL, Apollo Client를 활용한 효율적인 데이터 관리. Lerna 기반 Monorepo 환경에서 코드 일관성 유지',
        tags: ['Next.js', 'GraphQL', 'Apollo Client', 'Lerna'],
      },
      {
        title: '단위 테스트 도입으로 코드 안정성 확보',
        description:
          'Jest와 React Testing Library를 활용한 140개의 테스트 케이스 작성. 기획 변경에 대응하는 안정성 향상',
        tags: ['Jest', 'Testing Library', 'TDD'],
      },
    ],
  },
  {
    company: '무른모',
    position: 'Web Developer Intern',
    period: '2021.08 ~ 2021.12',
    description: '사내 백오피스 시스템 개발',
    achievements: [
      {
        title: '연차 관리 시스템 개발',
        description:
          'Laravel 프레임워크와 MySQL을 활용한 백오피스 구축. Linux Crontab을 이용한 자동화 알림 기능 개발',
        tags: ['Laravel', 'MySQL', 'jQuery'],
      },
    ],
  },
];

export default function ExperienceTimeline() {
  return (
    <div className="space-y-8">
      {experiences.map((exp, index) => (
        <div key={exp.company + exp.period} className="relative">
          {/* Timeline connector */}
          {index !== experiences.length - 1 && (
            <div className="absolute left-6 top-20 bottom-0 w-px bg-border hidden md:block" />
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-xl">{exp.company}</CardTitle>
                      {exp.current && (
                        <Badge variant="default" className="text-xs">
                          재직중
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {exp.position}
                        {exp.team && ` · ${exp.team}`}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{exp.period}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {exp.description && (
                <CardDescription className="mt-4 md:ml-16">{exp.description}</CardDescription>
              )}
            </CardHeader>

            {exp.achievements.length > 0 && (
              <CardContent className="md:ml-16 space-y-4">
                {exp.achievements.map((achievement, achIndex) => (
                  <div key={achIndex} className="space-y-2">
                    <h4 className="font-semibold text-sm">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {achievement.description}
                    </p>
                    {achievement.tags && achievement.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {achievement.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}
