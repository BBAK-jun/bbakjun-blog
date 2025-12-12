'use client'

import { useState, useEffect } from 'react'

interface HeadingItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  className?: string
}

export default function TableOfContents({ className = '' }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from the document
    const extractHeadings = () => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const headingItems: HeadingItem[] = []

      headingElements.forEach((heading) => {
        const id = heading.id
        const text = heading.textContent || ''
        const level = parseInt(heading.tagName.charAt(1))

        if (id && text) {
          headingItems.push({ id, text, level })
        }
      })

      setHeadings(headingItems)
    }

    // Wait for content to be rendered
    const timer = setTimeout(extractHeadings, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (headings.length === 0) return

    // Intersection Observer to track which heading is currently visible
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting)

        if (visibleEntries.length > 0) {
          // Get the first visible heading (topmost)
          const sortedEntries = visibleEntries.sort((a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top
          )
          const topEntry = sortedEntries[0]
          setActiveId(topEntry.target.id)
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px', // Trigger when heading is in top 40% of viewport
        threshold: 0
      }
    )

    // Observe all headings
    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [headings])

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      // Calculate offset to account for fixed header
      const headerOffset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <nav className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        📑 목차
      </h3>
      <ul className="space-y-1">
        {headings.map(({ id, text, level }) => (
          <li key={id}>
            <button
              onClick={() => handleHeadingClick(id)}
              className={`
                block w-full text-left text-sm transition-colors duration-200 p-2 rounded-md relative
                ${level === 1 ? 'font-semibold' : level === 2 ? 'font-medium' : 'font-normal'}
                ${
                  activeId === id
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
              `}
              style={{
                paddingLeft: `${0.5 + (level - 1) * 0.75}rem`
              }}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}