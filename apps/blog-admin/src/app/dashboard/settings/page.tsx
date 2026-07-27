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
    <div className="space-y-5 md:space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">설정</h1>
        </div>
        <p className="text-sm text-muted-foreground">백오피스 설정을 관리합니다</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-border">
        {/* Desktop: horizontal tabs */}
        <nav className="hidden md:flex gap-1 -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-3.5 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Mobile: vertical list */}
        <nav className="md:hidden space-y-1 pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full min-h-[44px] px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
      <div className="mt-4 md:mt-6">
        {activeTab === 'system' && <SystemSettings />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'api-keys' && <ApiKeys />}
      </div>
    </div>
  );
}
