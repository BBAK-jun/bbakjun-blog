'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { CheckCircle, AlertCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { env } from '@/env'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (token && status === 'idle') {
      handleUnsubscribe()
    }
  }, [token, status])

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus('error')
      setMessage('유효하지 않은 구독 취소 링크입니다')
      return
    }

    setStatus('loading')

    try {
      const adminUrl = env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
      const response = await fetch(`${adminUrl}/api/newsletter/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '구독 취소 중 오류가 발생했습니다')
      }

      setStatus('success')
      setMessage(data.message)
      setEmail(data.email)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '구독 취소 중 오류가 발생했습니다')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">유효하지 않은 링크</h1>
          <p className="text-muted-foreground mb-6">
            구독 취소 링크가 유효하지 않습니다.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">처리 중...</h1>
            <p className="text-muted-foreground">구독을 취소하고 있습니다.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">구독이 취소되었습니다</h1>
            <p className="text-muted-foreground mb-2">{message}</p>
            {email && (
              <p className="text-sm text-muted-foreground mb-6">
                이메일: <span className="font-medium">{email}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-6">
              더 이상 뉴스레터를 받지 않습니다. 언제든지 다시 구독하실 수 있습니다.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">오류가 발생했습니다</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleUnsubscribe}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                다시 시도
              </button>
              <Link
                href="/"
                className="block px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}
