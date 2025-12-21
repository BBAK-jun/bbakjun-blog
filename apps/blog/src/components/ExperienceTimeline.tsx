import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Briefcase, Calendar } from 'lucide-react'
import { getExperiences, type Experience as DBExperience, type Achievement } from '@/lib/experience'

// 경력 기간을 기반으로 총 경력 개월 수를 계산하는 함수
export function calculateTotalExperience(experiences: DBExperience[]): number {
  let totalMonths = 0

  experiences.forEach((exp) => {
    const periodMatch = exp.period.match(/(\d{4})\.(\d{2})\s*~\s*(재직중|\d{4}\.(\d{2}))?/)
    if (periodMatch) {
      const startYear = parseInt(periodMatch[1])
      const startMonth = parseInt(periodMatch[2])

      let endYear, endMonth
      if (periodMatch[3] === '재직중') {
        const now = new Date()
        endYear = now.getFullYear()
        endMonth = now.getMonth() + 1
      } else if (periodMatch[4]) {
        endYear = parseInt(periodMatch[3])
        endMonth = parseInt(periodMatch[4])
      } else {
        return // 종료 연도가 없는 경우 건너뛰기
      }

      const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1
      totalMonths += Math.max(0, months)
    }
  })

  return totalMonths
}

// 총 경력 기간을 "X년 Y개월" 형식으로 변환
export function formatExperience(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years === 0) {
    return `${months}개월`
  } else if (months === 0) {
    return `${years}년`
  } else {
    return `${years}년 ${months}개월`
  }
}

// 타일라인 컴포넌트에서 사용할 Experience 타입
export interface Experience {
  company: string
  position: string
  team?: string
  period: string
  current?: boolean
  description?: string
  achievements: {
    title: string
    description: string
    tags?: string[]
  }[]
}

// DB 데이터를 컴포넌트 형식으로 변환
function convertDBExperienceToComponent(dbExperience: DBExperience): Experience {
  return {
    company: dbExperience.company,
    position: dbExperience.position,
    team: dbExperience.team || undefined,
    period: dbExperience.period,
    current: dbExperience.isCurrent,
    description: dbExperience.description || undefined,
    achievements: dbExperience.achievements.map(achievement => ({
      title: achievement.title,
      description: achievement.description,
      tags: achievement.tags ? achievement.tags.split(',').map(tag => tag.trim()) : undefined,
    })),
  }
}

export default async function ExperienceTimeline() {
  // DB에서 경력 데이터 가져오기
  let dbExperiences: DBExperience[] = []

  try {
    dbExperiences = await getExperiences()
  } catch (error) {
    console.error('Failed to load experiences from DB:', error)
    // 실패 시 빈 배열로 처리 (Fallback)
  }

  // DB 데이터를 컴포넌트 형식으로 변환
  const experiences: Experience[] = dbExperiences.map(convertDBExperienceToComponent)

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
                <CardDescription className="mt-4 md:ml-16">
                  {exp.description}
                </CardDescription>
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
                        {achievement.tags.map((tag) => (
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
  )
}
