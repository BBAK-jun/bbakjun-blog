'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { client } from '@/shared/lib/rpc';

interface NewsletterSubscribeProps {
  source?: string;
  compact?: boolean;
}

export default function NewsletterSubscribe({
  source = 'footer',
  compact = false,
}: NewsletterSubscribeProps) {
  const [email, setEmail] = useState('');

  const subscribeMutation = useMutation({
    mutationFn: async ({ email, source }: { email: string; source: string }) => {
      const response = await client.rpc.subscribeNewsletter.$post({
        json: { email, source },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '구독 처리 중 오류가 발생했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      setEmail('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    subscribeMutation.mutate({ email, source });
  };

  const status = subscribeMutation.isPending
    ? 'loading'
    : subscribeMutation.isSuccess
      ? 'success'
      : subscribeMutation.isError
        ? 'error'
        : 'idle';

  const message = subscribeMutation.isSuccess
    ? subscribeMutation.data?.message || '구독이 완료되었습니다!'
    : subscribeMutation.error?.message || '';

  if (compact) {
    return (
      <div className="space-y-2">
        {status === 'success' ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일 주소"
              required
              disabled={status === 'loading'}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? '...' : '구독'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">뉴스레터 구독</h3>
          <p className="text-sm text-muted-foreground">새 포스트를 이메일로 받아보세요</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">{message}</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              확인 이메일을 보내드렸습니다.
            </p>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === 'loading'}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {status === 'loading' ? '처리 중...' : '구독하기'}
            </button>
          </form>
          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mt-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900 dark:text-red-100">{message}</p>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        언제든지 구독을 취소할 수 있습니다. 개인정보는 안전하게 보호됩니다.
      </p>
    </div>
  );
}
