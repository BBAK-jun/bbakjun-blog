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

const inputClass =
  'w-full min-h-[44px] px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent';

export default function SystemSettings() {
  const [settings, setSettings] = useState<CategorySettings>({
    blog: [],
    system: [],
    content: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

      if (Object.values(loadedSettings).every(arr => arr.length === 0)) {
        const seedResult = await seedDefaultSettings();
        if (seedResult.success) {
          await loadSettings();
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
    const { key, value, type } = setting;

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
            className={inputClass}
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
              className={inputClass}
            />
            {key.includes('Interval') && (
              <span className="text-sm text-muted-foreground w-16">분</span>
            )}
            {key.includes('TTL') && (
              <span className="text-sm text-muted-foreground w-16">초</span>
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
            className={inputClass}
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
        className="bg-card rounded-lg border border-border p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-foreground" />
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            {CATEGORY_LABELS[category]}
          </h3>
        </div>

        <div className="space-y-4">
          {categorySettings.map(setting => (
            <div key={setting.id}>
              <label className="block text-sm font-medium text-foreground mb-1">
                {setting.label}
              </label>
              <p className="text-xs text-muted-foreground mb-2">{setting.key}</p>
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
        <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground">시스템 설정</h2>
          <p className="text-sm text-muted-foreground mt-1">
            블로그 및 시스템 동작을 설정합니다
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadSettings}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5 md:space-y-6">
        {(Object.keys(settings) as (keyof CategorySettings)[]).map(category =>
          renderCategorySection(category, category)
        )}
      </div>

      {!hasChanges && (
        <div className="bg-accent border border-border rounded-lg p-4">
          <p className="text-sm text-accent-foreground">
            <Clock className="w-4 h-4 inline mr-1" />
            설정이 저장되었습니다. 변경 사항이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
