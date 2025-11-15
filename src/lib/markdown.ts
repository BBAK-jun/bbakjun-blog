import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import type { Element } from 'hast'
import { rehypeMermaid } from './rehype-mermaid'

// 마크다운을 HTML로 변환하는 함수
export async function processMarkdown(content: string): Promise<string> {
  const processor = unified()
    .use(remarkParse) // 마크다운 파싱
    .use(remarkGfm) // GitHub Flavored Markdown 지원 (테이블, 체크박스 등)
    .use(remarkRehype, { allowDangerousHtml: true }) // 마크다운을 HTML로 변환
    .use(rehypeSlug) // 제목에 ID 추가
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: {
        className: ['anchor-link'],
        title: 'Direct link to heading',
      },
      content: (): Element[] => [
        {
          type: 'element',
          tagName: 'svg',
          properties: {
            className: ['anchor-icon'],
            width: 16,
            height: 16,
            viewBox: '0 0 16 16',
            fill: 'currentColor',
          },
          children: [
            {
              type: 'element',
              tagName: 'path',
              properties: {
                d: 'M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z',
              },
              children: [],
            },
          ],
        },
      ],
    }) // 제목에 앵커 링크 추가
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
    }) // 코드 하이라이팅
    .use(rehypeMermaid) // Mermaid 차트 처리
    .use(rehypeStringify, { allowDangerousHtml: true }) // HTML 문자열로 변환

  const result = await processor.process(content)
  return String(result)
}