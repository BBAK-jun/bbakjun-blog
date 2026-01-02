'use client';

import { useState } from 'react';
import {
  Settings,
  Globe,
  Users,
  Key,
} from 'lucide-react';
import SystemSettings from './components/system-settings';
import UserManagement from './components/user-management';
import ApiKeys from './components/api-keys';

type SettingsTab = 'system' | 'users' | 'api-keys';

const TABS = [
  {
    id: 'system' as SettingsTab,
    name: '시스템 설정',
    icon: Globe,
    description: '블로그 및 시스템 동작 설정',
  },
  {
    id: 'users' as SettingsTab,
    name: '사용자 관리',
    icon: Users,
    description: '사용자 역할 및 권한 관리',
  },
  {
    id: 'api-keys' as SettingsTab,
    name: 'API 키',
    icon: Key,
    description: 'API 키 및 인증 정보 확인',
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('system');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            설정
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          백오피스 설정을 관리합니다
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-8">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mt-6">
        {activeTab === 'system' && <SystemSettings />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'api-keys' && <ApiKeys />}
      </div>
    </div>
  );
}
