import GiscusClient from './GiscusClient'

interface CommentsProps {
  /**
   * 포스트의 고유 식별자 (일반적으로 slug 사용)
   */
  identifier: string
  /**
   * 포스트 제목 (현재는 사용되지 않음, 향후 확장 가능)
   */
  title?: string
}

export default function Comments({ identifier }: CommentsProps) {
  return <GiscusClient identifier={identifier} />
}

// 환경 변수 설정 안내를 위한 설정 컴포넌트
export function CommentsConfig() {
  return (
    <div className="border border-border rounded-lg p-6 space-y-4 bg-muted/50">
      <h3 className="text-lg font-semibold text-foreground">
        💬 댓글 시스템 설정 필요
      </h3>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>giscus 댓글 시스템을 사용하려면 다음 환경 변수를 설정해야 합니다:</p>
        <div className="bg-background border rounded p-3 font-mono text-xs space-y-1">
          <div>NEXT_PUBLIC_GISCUS_REPO=your-username/your-repo</div>
          <div>NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id</div>
          <div>NEXT_PUBLIC_GISCUS_CATEGORY=General</div>
          <div>NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id</div>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">설정 방법:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>
              <a
                href="https://giscus.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                giscus.app
              </a>
              에서 GitHub repo 연결
            </li>
            <li>생성된 설정값을 .env.local 파일에 추가</li>
            <li>GitHub Discussions 활성화 필요</li>
          </ol>
        </div>
      </div>
    </div>
  )
}