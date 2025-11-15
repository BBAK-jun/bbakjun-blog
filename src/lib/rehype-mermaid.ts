import type { Element, Root, Node } from 'hast'

// 트리를 순회하는 간단한 함수
function walkTree(node: Node, callback: (node: Node, parent?: Element, index?: number) => void, parent?: Element, index?: number) {
  callback(node, parent, index)

  if ('children' in node && Array.isArray(node.children)) {
    node.children.forEach((child, childIndex) => {
      walkTree(child, callback, node as Element, childIndex)
    })
  }
}

export function rehypeMermaid() {
  return (tree: Root) => {
    const nodesToReplace: Array<{ parent: Element; index: number; newNode: Element }> = []

    walkTree(tree, (node, parent, index) => {
      // code 태그이면서 class가 language-mermaid인 경우를 찾습니다
      if (
        node.type === 'element' &&
        (node as Element).tagName === 'code' &&
        (node as Element).properties &&
        Array.isArray((node as Element).properties.className) &&
        ((node as Element).properties.className as string[]).includes('language-mermaid')
      ) {
        const element = node as Element

        // 텍스트 내용을 추출합니다
        const codeContent = element.children
          .filter((child) => child.type === 'text')
          .map((child) => child.value)
          .join('')

        // Mermaid 컴포넌트로 교체할 요소를 생성합니다
        const mermaidElement: Element = {
          type: 'element',
          tagName: 'div',
          properties: {
            'data-mermaid': codeContent,
            className: ['mermaid-container', 'my-6', 'p-4', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'border', 'border-gray-200', 'dark:border-gray-700', 'shadow-sm', 'overflow-x-auto']
          },
          children: [
            {
              type: 'element',
              tagName: 'pre',
              properties: {
                className: ['mermaid'],
                style: 'display: flex; justify-content: center; align-items: center; min-height: 150px;'
              },
              children: [
                {
                  type: 'text',
                  value: codeContent
                }
              ]
            }
          ]
        }

        // 부모가 pre 태그인 경우 (일반적인 마크다운 코드 블록)
        if (parent && parent.tagName === 'pre') {
          // pre 태그의 부모를 찾아서 교체해야 합니다
          walkTree(tree, (grandParentNode, greatGrandParent, grandParentIndex) => {
            if (grandParentNode === parent && greatGrandParent && grandParentIndex !== undefined) {
              nodesToReplace.push({
                parent: greatGrandParent,
                index: grandParentIndex,
                newNode: mermaidElement
              })
            }
          })
        } else if (parent && index !== undefined) {
          // 직접 교체
          nodesToReplace.push({
            parent,
            index,
            newNode: mermaidElement
          })
        }
      }
    })

    // 수집된 노드들을 교체합니다
    nodesToReplace.forEach(({ parent, index, newNode }) => {
      parent.children[index] = newNode
    })
  }
}