'use client'

import { useState, useEffect } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      // 현재 스크롤 위치
      const scrollTop = window.scrollY

      // 전체 문서 높이 - 뷰포트 높이 = 스크롤 가능한 높이
      const documentHeight = document.documentElement.scrollHeight
      const windowHeight = window.innerHeight
      const scrollableHeight = documentHeight - windowHeight

      if (scrollableHeight > 0) {
        // 진행률 계산 (0-100%)
        const scrollProgress = (scrollTop / scrollableHeight) * 100
        setProgress(Math.min(100, Math.max(0, scrollProgress)))
      }
    }

    // 초기 진행률 계산
    updateProgress()

    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress, { passive: true })

    // 정리 함수
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-700">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}