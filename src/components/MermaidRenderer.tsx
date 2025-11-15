'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Mermaid 컴포넌트를 동적으로 임포트 (CSR에서만 로드)
const Mermaid = dynamic(() => import('./Mermaid'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
      <div className="animate-pulse text-gray-500">Mermaid 차트 로딩 중...</div>
    </div>
  )
})

interface MermaidRendererProps {
  content: string
}

export default function MermaidRenderer({ content }: MermaidRendererProps) {
  useEffect(() => {
    // DOM이 로드된 후 mermaid 코드 블록을 찾아서 렌더링
    const mermaidElements = document.querySelectorAll('.mermaid-container')

    mermaidElements.forEach((element) => {
      const mermaidCode = element.getAttribute('data-mermaid')
      if (mermaidCode && !element.querySelector('.mermaid-rendered')) {
        // 기존 pre 태그 제거
        const preElement = element.querySelector('pre')
        if (preElement) {
          preElement.remove()
        }

        // React 컴포넌트를 직접 렌더링하는 대신
        // 마커를 추가하고 별도 처리
        element.innerHTML = `<div class="mermaid-placeholder" data-chart="${encodeURIComponent(mermaidCode)}"></div>`
        element.classList.add('mermaid-rendered')
      }
    })

    // Mermaid 플레이스홀더를 실제 컴포넌트로 렌더링
    const placeholders = document.querySelectorAll('.mermaid-placeholder')
    placeholders.forEach((placeholder) => {
      const chartData = placeholder.getAttribute('data-chart')
      if (chartData) {
        const chart = decodeURIComponent(chartData)

        // CDN에서 Mermaid 동적 로드 후 렌더링
        const loadAndRenderMermaid = async () => {
          try {
            // CDN에서 Mermaid 로드
            if (typeof window !== 'undefined' && !(window as any).mermaid) {
              await new Promise((resolve, reject) => {
                const script = document.createElement('script')
                script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js'
                script.onload = resolve
                script.onerror = reject
                document.head.appendChild(script)
              })
            }

            const mermaid = (window as any).mermaid

            // 다크모드 감지
            const isDarkMode = document.documentElement.classList.contains('dark')

            mermaid.initialize({
              startOnLoad: false,
              theme: isDarkMode ? 'dark' : 'default',
              securityLevel: 'loose',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: 14,
              flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis',
                padding: 10,
                nodeSpacing: 30,
                rankSpacing: 40,
              },
              sequence: {
                useMaxWidth: true,
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                mirrorActors: true,
                bottomMarginAdj: 1,
              },
              gantt: {
                useMaxWidth: true,
                leftPadding: 75,
                gridLineStartPadding: 35,
                fontSize: 11,
                sectionFontSize: 24,
                numberSectionStyles: 4,
              },
              pie: {
                useMaxWidth: true,
                textPosition: 0.75,
              },
              git: {
                useMaxWidth: true,
                mainBranchName: 'main',
              },
              class: {
                useMaxWidth: true,
              },
              themeVariables: isDarkMode ? {
                primaryColor: '#1f2937',
                primaryTextColor: '#f9fafb',
                primaryBorderColor: '#374151',
                lineColor: '#6b7280',
                secondaryColor: '#374151',
                tertiaryColor: '#4b5563',
                background: '#111827',
                mainBkg: '#1f2937',
                secondBkg: '#374151',
                tertiaryTextColor: '#d1d5db',
              } : {
                primaryColor: '#3b82f6',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#1d4ed8',
                lineColor: '#374151',
                secondaryColor: '#e5e7eb',
                tertiaryColor: '#f3f4f6',
                background: '#ffffff',
                mainBkg: '#ffffff',
                secondBkg: '#f9fafb',
                tertiaryTextColor: '#374151',
              }
            })

            const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`

            const { svg } = await mermaid.render(uniqueId, chart)
            placeholder.innerHTML = svg
          } catch (error) {
            console.error('Mermaid rendering error:', error)
            placeholder.innerHTML = `
              <div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
                <p class="font-semibold">Mermaid 차트 렌더링 오류</p>
                <p class="text-sm mt-1">차트 문법을 확인해주세요.</p>
                <details class="mt-2">
                  <summary class="cursor-pointer text-sm">원본 코드 보기</summary>
                  <pre class="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">${chart}</pre>
                </details>
              </div>
            `
          }
        }

        loadAndRenderMermaid()
      }
    })
  }, [content])

  return null // 이 컴포넌트는 렌더링하지 않고 side effect만 수행
}