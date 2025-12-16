import { visit, SKIP } from 'unist-util-visit'
import type { Element, Root } from 'hast'

/**
 * Rehype plugin to optimize images for Next.js
 * Transforms <img> tags to be compatible with lazy loading and optimization
 */
export function rehypeOptimizeImages() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName === 'img' && parent && typeof index === 'number') {
        const src = node.properties?.src as string
        const alt = (node.properties?.alt as string) || ''

        // Skip if src is missing
        if (!src) return

        // Add loading="lazy" for better performance
        node.properties = {
          ...node.properties,
          loading: 'lazy',
          decoding: 'async',
          alt,
          // Add CSS classes for styling
          className: 'blog-image rounded-lg my-6 w-full h-auto',
          // Add dimensions if not already present (prevents layout shift)
          style: 'max-width: 100%; height: auto;',
        }

        // Wrap image in a figure with optional caption
        if (alt && parent.type === 'element') {
          const figure: Element = {
            type: 'element',
            tagName: 'figure',
            properties: {
              className: 'blog-image-figure my-8',
            },
            children: [
              { ...node }, // Clone the img node
              {
                type: 'element',
                tagName: 'figcaption',
                properties: {
                  className: 'text-center text-sm text-gray-600 dark:text-gray-400 mt-2 italic',
                },
                children: [
                  {
                    type: 'text',
                    value: alt,
                  },
                ],
              },
            ],
          }

          // Replace the img node with the figure in the parent's children
          parent.children[index] = figure

          // Skip visiting the newly created figure to avoid infinite loop
          return SKIP
        }
      }
    })
  }
}
