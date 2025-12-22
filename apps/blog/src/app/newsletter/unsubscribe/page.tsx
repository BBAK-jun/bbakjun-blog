'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useUnsubscribeMutation } from '@/features/newsletter/lib/use-newsletter';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const { data, mutate: unsubscribe, isPending, isError, error } = useUnsubscribeMutation();

  // Auto-unsubscribe on mount if token exists
  useEffect(() => {
    if (token && !data && !isError && !isPending) {
      unsubscribe(token);
    }
  }, [token, data, isError, isPending, unsubscribe]);

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
          <p className="text-muted-foreground mb-6">구독 취소 링크가 유효하지 않습니다.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {isPending && (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">처리 중...</h1>
            <p className="text-muted-foreground">구독을 취소하고 있습니다.</p>
          </>
        )}

        {data && (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">구독이 취소되었습니다</h1>
            <p className="text-muted-foreground mb-2">{data.message}</p>
            {data.email && (
              <p className="text-sm text-muted-foreground mb-6">
                이메일: <span className="font-medium">{data.email}</span>
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

        {isError && (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">오류가 발생했습니다</h1>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : '구독 취소 중 오류가 발생했습니다'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => token && unsubscribe(token)}
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
  );
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
  );
}
