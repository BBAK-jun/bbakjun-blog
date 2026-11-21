'use client';

import { useState, useEffect } from 'react';
import { Mail, Download, Users, Send } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source?: string;
  isActive: boolean;
}

interface Broadcast {
  id: string;
  slug: string;
  title: string;
  sentAt: string | null;
  recipientCount: number;
  failedCount: number;
  status: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    status: string;
    sent: number;
    failed: number;
    remaining: number;
  } | null>(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rpc/getNewsletterSubscribers');
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      const data = await response.json();
      setSubscribers(data.subscribers);
      setStats(data.stats);
      setBroadcasts(data.broadcasts || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBroadcast = async () => {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) {
      alert('발행된 글 slug를 입력하세요.');
      return;
    }

    const existing = broadcasts.find(broadcast => broadcast.slug === normalizedSlug);
    const force = existing?.status === 'sent';
    const confirmation = force
      ? `이미 발송된 ${normalizedSlug}를 다시 발송할까요?`
      : `${normalizedSlug} 글을 활성 구독자 ${stats.active}명에게 발송할까요?`;
    if (!confirm(confirmation)) return;

    setIsSending(true);
    setSendResult(null);
    try {
      const response = await fetch('/api/rpc/sendNewsletterBroadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: normalizedSlug,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          force,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || '발송에 실패했습니다');
      setSendResult(data);
      await fetchSubscribers();
    } catch (error) {
      alert(error instanceof Error ? error.message : '발송에 실패했습니다');
    } finally {
      setIsSending(false);
    }
  };

  const exportSubscribers = () => {
    const activeSubscribers = subscribers.filter(s => s.isActive);
    const csv = [
      ['Email', 'Subscribed At', 'Source'].join(','),
      ...activeSubscribers.map(s =>
        [s.email, new Date(s.subscribedAt).toLocaleDateString(), s.source || 'unknown'].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">구독자 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 md:w-6 md:h-6" />
            뉴스레터 구독자
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            이메일 구독자를 관리하고 통계를 확인하세요
          </p>
        </div>
        <button
          onClick={exportSubscribers}
          className="flex items-center gap-2 min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          CSV 내보내기
        </button>
      </div>

      {/* Newsletter broadcast */}
      <section className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Send className="w-5 h-5" /> 새 글 뉴스레터 발송
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              발행된 글만 선택하고, 확인 후 활성 구독자에게 발송합니다.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">대상: {stats.active}명</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={slug}
            onChange={event => setSlug(event.target.value)}
            placeholder="발행된 글 slug (예: DEV/my-post)"
            className="min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
          />
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="제목 (비우면 글의 제목 사용)"
            className="min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
          />
          <input
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="설명 (비우면 글의 설명 사용)"
            className="min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>
        {slug.trim() && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <p>
              <strong>미리보기 제목:</strong> {title.trim() || '발행된 글의 제목을 조회합니다'}
            </p>
            <p>
              <strong>미리보기 링크:</strong>{' '}
              {`${window.location.origin.replace('admin.', 'www.')}/blog/${slug.trim()}`}
            </p>
            <p>
              <strong>대상 인원:</strong> {stats.active}명
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={sendBroadcast}
          disabled={isSending || !slug.trim()}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          {isSending
            ? '발송 중...'
            : broadcasts.find(item => item.slug === slug.trim())?.status === 'sent'
              ? '재발송'
              : '발송'}
        </button>
        {sendResult && (
          <p className="text-sm text-foreground">
            결과: {sendResult.status} · 성공 {sendResult.sent}명 · 실패 {sendResult.failed}명 · 남음{' '}
            {sendResult.remaining}명
          </p>
        )}
        {broadcasts.length > 0 && (
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-2">발송 이력</h3>
            <div className="space-y-2">
              {broadcasts.map(broadcast => (
                <div key={broadcast.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{broadcast.slug}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {broadcast.status === 'sent'
                      ? `발송됨 · ${broadcast.sentAt ? new Date(broadcast.sentAt).toLocaleString('ko-KR') : ''}`
                      : broadcast.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">전체 구독자</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">
                {stats.total}
              </p>
            </div>
            <div className="p-2.5 md:p-3 bg-accent rounded-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">활성 구독자</p>
              <p className="text-2xl md:text-3xl font-bold text-success-500 mt-1 md:mt-2">
                {stats.active}
              </p>
            </div>
            <div className="p-2.5 md:p-3 bg-success-50 rounded-lg">
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-success-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">구독 취소</p>
              <p className="text-2xl md:text-3xl font-bold text-muted-foreground mt-1 md:mt-2">
                {stats.inactive}
              </p>
            </div>
            <div className="p-2.5 md:p-3 bg-muted rounded-lg">
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Subscribers: Desktop table / Mobile cards */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  구독일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  출처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscribers.map(subscriber => (
                <tr key={subscriber.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{subscriber.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">
                      {new Date(subscriber.subscribedAt).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">
                      {subscriber.source || 'unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {subscriber.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-600">
                        활성
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        비활성
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {subscribers.map(subscriber => (
            <div key={subscriber.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium text-foreground break-all">
                  {subscriber.email}
                </div>
                {subscriber.isActive ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-600 flex-shrink-0">
                    활성
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground flex-shrink-0">
                    비활성
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(subscriber.subscribedAt).toLocaleDateString('ko-KR')}</span>
                <span>·</span>
                <span>{subscriber.source || 'unknown'}</span>
              </div>
            </div>
          ))}
        </div>

        {subscribers.length === 0 && (
          <div className="text-center py-12 px-4">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">아직 구독자가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
