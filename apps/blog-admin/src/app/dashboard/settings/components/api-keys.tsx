'use client';

import { Key, Mail, Database, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { env } from '../../../../env';

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

  // 카테고리별로 그룹화
  const groupedConfigs = API_KEY_CONFIGS.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, ApiKeyConfig[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          API 키 관리
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          시스템에서 사용하는 API 키 및 인증 정보를 확인합니다
        </p>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <Key className="w-4 h-4 inline mr-1" />
          API 키는 환경 변수로 관리됩니다. 키를 변경하려면 배포 플랫폼(Vercel 등)에서 환경 변수를
          수정해주세요.
        </p>
      </div>

      {/* 카테고리별 API 키 목록 */}
      <div className="space-y-6">
        {Object.entries(groupedConfigs).map(([category, configs]) => (
          <div
            key={category}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </h3>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {configs.map(config => {
                const Icon = config.icon;
                const envValue = process.env[`NEXT_PUBLIC_${config.key}`] || '';

                return (
                  <div
                    key={config.key}
                    className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {config.label}
                            </h4>
                            <code className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                              {config.key}
                            </code>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {config.description}
                          </p>

                          {/* 설정 상태 */}
                          <div className="mt-2">
                            {config.isSet ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                <Check className="w-3 h-3" />
                                설정됨
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                                미설정
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 값 표시 및 복사 버튼 (설정된 경우만) */}
                      {config.isSet && envValue && (
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 min-w-[200px]">
                            {visibleKeys.has(config.key) ? envValue : maskValue(envValue)}
                          </div>
                          <button
                            onClick={() => toggleVisibility(config.key)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
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
                            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="복사"
                          >
                            {copiedKey === config.key ? (
                              <Check className="w-4 h-4 text-green-600" />
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
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">
          환경 변수 설정 방법
        </h4>
        <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
          <li>Vercel 대시보드에서 프로젝트 설정으로 이동</li>
          <li>Environment Variables 섹션 찾기</li>
          <li>새 환경 변수 추가 (Key-Value 쌍)</li>
          <li>재배포 또는 함수 재시작으로 변경사항 적용</li>
        </ol>
      </div>
    </div>
  );
}
