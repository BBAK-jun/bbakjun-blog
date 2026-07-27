'use client';

import { Key, Mail, Database, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface ApiKeyConfig {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'auth' | 'storage' | 'database' | 'integration' | 'system';
  isSet: boolean;
}

const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    key: 'AUTH_SECRET',
    label: 'Auth Secret',
    description: 'NextAuth.js 인증 시크릿 키',
    icon: Key,
    category: 'auth',
    isSet: !!process.env.NEXT_PUBLIC_AUTH_SECRET,
  },
  {
    key: 'AUTH_GOOGLE_ID',
    label: 'Google OAuth Client ID',
    description: 'Google OAuth 클라이언트 ID',
    icon: Key,
    category: 'auth',
    isSet: !!process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
  },
  {
    key: 'AUTH_GOOGLE_SECRET',
    label: 'Google OAuth Secret',
    description: 'Google OAuth 클라이언트 시크릿',
    icon: Key,
    category: 'auth',
    isSet: !!process.env.NEXT_PUBLIC_AUTH_GOOGLE_SECRET,
  },
  {
    key: 'BLOB_READ_WRITE_TOKEN',
    label: 'Vercel Blob Token',
    description: 'Vercel Blob Storage 읽기/쓰기 토큰',
    icon: Database,
    category: 'storage',
    isSet: !!process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
  },
  {
    key: 'DATABASE_URL',
    label: 'Database URL',
    description: 'PostgreSQL 데이터베이스 연결 문자열',
    icon: Database,
    category: 'database',
    isSet: !!process.env.NEXT_PUBLIC_DATABASE_URL,
  },
  {
    key: 'RESEND_API_KEY',
    label: 'Resend API Key',
    description: '이메일 발송을 위한 Resend API 키',
    icon: Mail,
    category: 'integration',
    isSet: !!process.env.NEXT_PUBLIC_RESEND_API_KEY,
  },
  {
    key: 'REVALIDATION_SECRET',
    label: 'ISR Revalidation Secret',
    description: 'ISR 재검증을 위한 시크릿 키',
    icon: Key,
    category: 'system',
    isSet: !!process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
  },
  {
    key: 'REDIS_URL',
    label: 'Redis URL',
    description: '캐싱을 위한 Redis 연결 URL (선택사항)',
    icon: Database,
    category: 'system',
    isSet: !!process.env.NEXT_PUBLIC_REDIS_URL,
  },
  {
    key: 'RAG_GATEWAY_API_KEY',
    label: 'RAG Gateway API Key',
    description: 'RAG 서비스 연동을 위한 API 키',
    icon: Key,
    category: 'integration',
    isSet: !!process.env.NEXT_PUBLIC_RAG_GATEWAY_API_KEY,
  },
];

const CATEGORY_LABELS = {
  auth: '인증',
  storage: '스토리지',
  database: '데이터베이스',
  integration: '외부 연동',
  system: '시스템',
};

export default function ApiKeys() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const maskValue = (value: string) => {
    if (value.length <= 8) return '*'.repeat(value.length);
    return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
  };

  const groupedConfigs = API_KEY_CONFIGS.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, ApiKeyConfig[]>);

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-foreground">API 키 관리</h2>
        <p className="text-sm text-muted-foreground mt-1">
          시스템에서 사용하는 API 키 및 인증 정보를 확인합니다
        </p>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-accent border border-border rounded-lg p-4">
        <p className="text-sm text-accent-foreground">
          <Key className="w-4 h-4 inline mr-1" />
          API 키는 환경 변수로 관리됩니다. 키를 변경하려면 배포 플랫폼(Vercel 등)에서 환경 변수를
          수정해주세요.
        </p>
      </div>

      {/* 카테고리별 API 키 목록 */}
      <div className="space-y-5 md:space-y-6">
        {Object.entries(groupedConfigs).map(([category, configs]) => (
          <div
            key={category}
            className="bg-card rounded-lg border border-border overflow-hidden"
          >
            <div className="px-4 md:px-6 py-4 border-b border-border">
              <h3 className="text-base md:text-lg font-semibold text-foreground">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </h3>
            </div>

            <div className="divide-y divide-border">
              {configs.map(config => {
                const Icon = config.icon;
                const envValue = process.env[`NEXT_PUBLIC_${config.key}`] || '';

                return (
                  <div
                    key={config.key}
                    className="px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                          <Icon className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-foreground">{config.label}</h4>
                            <code className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                              {config.key}
                            </code>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>

                          <div className="mt-2">
                            {config.isSet ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-success-100 dark:bg-success-950/40 text-success-700 dark:text-success-400 rounded-full">
                                <Check className="w-3 h-3" />
                                설정됨
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-warning-100 dark:bg-warning-950/40 text-warning-700 dark:text-warning-400 rounded-full">
                                미설정
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 값 표시 및 복사 버튼 */}
                      {config.isSet && envValue && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="font-mono text-sm bg-muted px-3 py-2 rounded-lg text-foreground min-w-0 md:min-w-[200px] truncate">
                            {visibleKeys.has(config.key) ? envValue : maskValue(envValue)}
                          </div>
                          <button
                            onClick={() => toggleVisibility(config.key)}
                            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            aria-label={visibleKeys.has(config.key) ? '값 숨기기' : '값 표시'}
                          >
                            {visibleKeys.has(config.key) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(envValue, config.key)}
                            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            aria-label="복사"
                          >
                            {copiedKey === config.key ? (
                              <Check className="w-4 h-4 text-success-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 추가 안내 */}
      <div className="bg-muted/50 border border-border rounded-lg p-4 md:p-6">
        <h4 className="font-medium text-foreground mb-3">환경 변수 설정 방법</h4>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Vercel 대시보드에서 프로젝트 설정으로 이동</li>
          <li>Environment Variables 섹션 찾기</li>
          <li>새 환경 변수 추가 (Key-Value 쌍)</li>
          <li>재배포 또는 함수 재시작으로 변경사항 적용</li>
        </ol>
      </div>
    </div>
  );
}
