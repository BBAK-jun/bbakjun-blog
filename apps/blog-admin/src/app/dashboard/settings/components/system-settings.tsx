'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Globe,
  Clock,
  FileText,
  Save,
  RefreshCw,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  getSettingsByCategory,
  updateSettings,
  seedDefaultSettings,
} from '../../../actions/settings';

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  type: string;
  label: string;
}

interface CategorySettings {
  blog: Setting[];
  system: Setting[];
  content: Setting[];
}

const CATEGORY_ICONS = {
  blog: Globe,
  system: SettingsIcon,
  content: FileText,
};

const CATEGORY_LABELS = {
  blog: '블로그 설정',
  system: '시스템 설정',
  content: '콘텐츠 설정',
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<CategorySettings>({
    blog: [],
    system: [],
    content: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 초기 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const categories: (keyof CategorySettings)[] = ['blog', 'system', 'content'];
      const loadedSettings: CategorySettings = {
        blog: [],
        system: [],
        content: [],
      };

      for (const category of categories) {
        const result = await getSettingsByCategory(category);
        if (result.success && result.data) {
          loadedSettings[category] = result.data;
        }
      }

      // 설정이 없으면 초기 설정 생성
      if (Object.values(loadedSettings).every(arr => arr.length === 0)) {
        const seedResult = await seedDefaultSettings();
        if (seedResult.success) {
          await loadSettings(); // 재로드
          return;
        }
      }

      setSettings(loadedSettings);
    } catch (error) {
      toast.error('설정을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    category: keyof CategorySettings,
    key: string,
    value: string
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category].map(setting =>
        setting.key === key ? { ...setting, value } : setting
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allSettings = [
        ...settings.blog,
        ...settings.system,
        ...settings.content,
      ].map(({ key, value }) => ({ key, value }));

      const result = await updateSettings(allSettings);
      if (result.success) {
        toast.success('설정이 저장되었습니다');
        setHasChanges(false);
      } else {
        toast.error(result.error || '설정 저장에 실패했습니다');
      }
    } catch (error) {
      toast.error('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: Setting) => {
    const { key, value, type, label } = setting;

    switch (type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={e =>
              handleInputChange(
                setting.category as keyof CategorySettings,
                key,
                e.target.value
              )
            }
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={e =>
                handleInputChange(
                  setting.category as keyof CategorySettings,
                  key,
                  e.target.value
                )
              }
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {key.includes('Interval') && (
              <span className="text-sm text-slate-600 dark:text-slate-400 w-16">
                분
              </span>
            )}
            {key.includes('TTL') && (
              <span className="text-sm text-slate-600 dark:text-slate-400 w-16">
                초
              </span>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={e =>
              handleInputChange(
                setting.category as keyof CategorySettings,
                key,
                e.target.value
              )
            }
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  const renderCategorySection = (
    category: keyof CategorySettings,
    categoryKey: string
  ) => {
    const Icon = CATEGORY_ICONS[category];
    const categorySettings = settings[category];

    if (!categorySettings || categorySettings.length === 0) {
      return null;
    }

    return (
      <div
        key={categoryKey}
        className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {CATEGORY_LABELS[category]}
          </h3>
        </div>

        <div className="space-y-4">
          {categorySettings.map(setting => (
            <div key={setting.id}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {setting.label}
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {setting.key}
              </p>
              {renderSettingInput(setting)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            시스템 설정
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            블로그 및 시스템 동작을 설정합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {(Object.keys(settings) as (keyof CategorySettings)[]).map(
          category => renderCategorySection(category, category)
        )}
      </div>

      {!hasChanges && (
        <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <Clock className="w-4 h-4 inline mr-1" />
            설정이 저장되었습니다. 변경 사항이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
