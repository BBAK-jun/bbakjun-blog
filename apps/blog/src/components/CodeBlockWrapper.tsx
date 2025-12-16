'use client'

import { useEffect } from 'react'

/**
 * Wraps code blocks with copy button
 * Works with server-rendered HTML from processMarkdown
 */
export default function CodeBlockWrapper() {
  useEffect(() => {
    // Find all code blocks (pre > code)
    const codeBlocks = document.querySelectorAll('pre code')

    codeBlocks.forEach((codeElement) => {
      const pre = codeElement.parentElement
      if (!pre) return

      // Skip if already wrapped
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return

      // Get code text
      const code = codeElement.textContent || ''

      // Create wrapper
      const wrapper = document.createElement('div')
      wrapper.className = 'code-block-wrapper group relative'

      // Create copy button
      const button = document.createElement('button')
      button.className =
        'absolute top-2 right-2 p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-sm'
      button.innerHTML = `
        <svg class="w-4 h-4 copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <svg class="w-4 h-4 check-icon hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="button-text">Copy</span>
      `
      button.title = '코드 복사'
      button.setAttribute('aria-label', '코드 복사')

      // Copy handler
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code)

          // Show success state
          const copyIcon = button.querySelector('.copy-icon')
          const checkIcon = button.querySelector('.check-icon')
          const buttonText = button.querySelector('.button-text')

          if (copyIcon && checkIcon && buttonText) {
            copyIcon.classList.add('hidden')
            checkIcon.classList.remove('hidden')
            buttonText.textContent = 'Copied!'
            button.classList.add('!opacity-100')

            // Reset after 2 seconds
            setTimeout(() => {
              copyIcon.classList.remove('hidden')
              checkIcon.classList.add('hidden')
              buttonText.textContent = 'Copy'
              button.classList.remove('!opacity-100')
            }, 2000)
          }
        } catch (err) {
          console.error('Failed to copy code:', err)
        }
      })

      // Wrap pre with wrapper
      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)
      wrapper.appendChild(button)
    })
  }, [])

  return null // This component only adds interactivity
}
