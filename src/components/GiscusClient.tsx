'use client'

import { useEffect, useState } from 'react'
import Giscus from '@giscus/react'
import { useTheme } from 'next-themes'

interface GiscusClientProps {
  identifier: string
}

export default function GiscusClient({ identifier }: GiscusClientProps) {
  const { resolvedTheme } = useTheme()

  // 현재 테마에 따라 giscus 테마 설정
  const giscusTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <div className="w-full">
      <Giscus
        id="comments"
        // GitHub repo 설정 - 사용자가 자신의 repo로 변경해야 함
        repo={process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}` || "bbakjun/bbakjun-blog"}
        repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID || ""}
        category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General"}
        categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || ""}
        // 댓글 매핑 방식
        mapping="specific"
        term={identifier}
        // 반응 활성화
        reactionsEnabled="1"
        // 메인 댓글 내 반응 위치
        emitMetadata="0"
        // 입력 위치
        inputPosition="top"
        // 테마
        theme={giscusTheme}
        // 언어
        lang="ko"
        // 로딩 방식
        loading="lazy"
      />
    </div>
  )
}

