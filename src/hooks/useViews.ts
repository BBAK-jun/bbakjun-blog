'use client'

import { useState, useEffect } from 'react'

interface ViewData {
  views: number
  loading: boolean
  error: string | null
}

export function useViews(slug: string, increment: boolean = false): ViewData {
  const [viewData, setViewData] = useState<ViewData>({
    views: 0,
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!slug) return

    let isMounted = true

    const fetchViews = async () => {
      try {
        setViewData(prev => ({ ...prev, loading: true, error: null }))

        if (increment) {
          // 조회수 증가
          const response = await fetch(`/api/views/${slug}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            throw new Error('Failed to increment views')
          }

          const data = await response.json()

          if (isMounted) {
            setViewData({
              views: data.views,
              loading: false,
              error: null
            })
          }
        } else {
          // 조회수만 조회
          const response = await fetch(`/api/views/${slug}`)

          if (!response.ok) {
            throw new Error('Failed to fetch views')
          }

          const data = await response.json()

          if (isMounted) {
            setViewData({
              views: data.views,
              loading: false,
              error: null
            })
          }
        }
      } catch (error) {
        if (isMounted) {
          setViewData(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }))
        }
      }
    }

    fetchViews()

    return () => {
      isMounted = false
    }
  }, [slug, increment])

  return viewData
}