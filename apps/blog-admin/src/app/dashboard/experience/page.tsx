'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  seedExperiences,
} from '../../../app/actions/experience';

// 타입 정의
interface Experience {
  id: string;
  company: string;
  position: string;
  team?: string;
  period: string;
  isCurrent: boolean;
  description?: string;
  sortOrder: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  tags?: string;
  sortOrder: number;
}

// DB 데이터를 UI 데이터로 변환
function transformDBData(dbData: any[]): Experience[] {
  return dbData.map(exp => ({
    id: exp.id,
    company: exp.company,
    position: exp.position,
    team: exp.team || undefined,
    period: exp.period,
    isCurrent: exp.isCurrent,
    description: exp.description || undefined,
    sortOrder: exp.sortOrder,
    achievements: exp.achievements || [],
  }));
}
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Loader2,
  Database,
  X,
} from 'lucide-react';

// 간단한 UI 컴포넌트들
const Button = ({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  disabled,
  className = '',
}: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      variant === 'outline'
        ? 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
        : 'bg-blue-600 hover:bg-blue-700 text-white'
    } ${size === 'sm' ? 'px-3 py-1.5 text-sm' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

const Card = ({ children, className = '' }: any) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children }: any) => <div className="p-6 pb-4">{children}</div>;

const CardContent = ({ children }: any) => <div className="p-6 pt-0">{children}</div>;

const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>{children}</h3>
);

const Input = ({ id, value, onChange, placeholder, type = 'text', className = '' }: any) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${className}`}
  />
);

const Label = ({ htmlFor, children }: any) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
  >
    {children}
  </label>
);

const Textarea = ({ id, value, onChange, placeholder, rows = 3, className = '' }: any) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${className}`}
  />
);

const Switch = ({ id, checked, onCheckedChange }: any) => (
  <button
    id={id}
    type="button"
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const Badge = ({ children, variant = 'default', className = '' }: any) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      variant === 'default'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    } ${className}`}
  >
    {children}
  </span>
);

interface Experience {
  id: string;
  company: string;
  position: string;
  team?: string;
  period: string;
  isCurrent: boolean;
  description?: string;
  sortOrder: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  tags?: string;
  sortOrder: number;
}

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [experienceForm, setExperienceForm] = useState({
    company: '',
    position: '',
    team: '',
    period: '',
    isCurrent: false,
    description: '',
    sortOrder: 0,
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    try {
      setLoading(true);
      const result = await getExperiences();
      if (result.success) {
        setExperiences(transformDBData(result.data || []));
      } else {
        showToast('경력 정보를 불러오는데 실패했습니다', 'error');
      }
    } catch (error) {
      console.error('Failed to load experiences:', error);
      showToast('경력 정보를 불러오는데 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateExperience = async () => {
    try {
      const result = await createExperience(experienceForm);
      if (result.success) {
        showToast('경력이 생성되었습니다', 'success');
        setShowModal(false);
        resetExperienceForm();
        await loadExperiences();
      } else {
        showToast(result.error || '경력 생성에 실패했습니다', 'error');
      }
    } catch (error) {
      console.error('Failed to create experience:', error);
      showToast('경력 생성에 실패했습니다', 'error');
    }
  };

  const handleUpdateExperience = async () => {
    if (!editingExperience) return;

    try {
      const result = await updateExperience(editingExperience.id, experienceForm);
      if (result.success) {
        showToast('경력이 수정되었습니다', 'success');
        setShowModal(false);
        setEditingExperience(null);
        resetExperienceForm();
        await loadExperiences();
      } else {
        showToast(result.error || '경력 수정에 실패했습니다', 'error');
      }
    } catch (error) {
      console.error('Failed to update experience:', error);
      showToast('경력 수정에 실패했습니다', 'error');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('정말로 이 경력을 삭제하시겠습니까?')) return;

    try {
      const result = await deleteExperience(id);
      if (result.success) {
        showToast('경력이 삭제되었습니다', 'success');
        await loadExperiences();
      } else {
        showToast(result.error || '경력 삭제에 실패했습니다', 'error');
      }
    } catch (error) {
      console.error('Failed to delete experience:', error);
      showToast('경력 삭제에 실패했습니다', 'error');
    }
  };

  const openExperienceModal = (experience?: Experience) => {
    if (experience) {
      setEditingExperience(experience);
      setExperienceForm({
        company: experience.company,
        position: experience.position,
        team: experience.team || '',
        period: experience.period,
        isCurrent: experience.isCurrent,
        description: experience.description || '',
        sortOrder: experience.sortOrder,
      });
    } else {
      setEditingExperience(null);
      resetExperienceForm();
    }
    setShowModal(true);
  };

  const resetExperienceForm = () => {
    setExperienceForm({
      company: '',
      position: '',
      team: '',
      period: '',
      isCurrent: false,
      description: '',
      sortOrder: 0,
    });
  };

  const handleSeedData = async () => {
    if (!confirm('초기 경력 데이터를 생성하시겠습니까? 기존 데이터가 없는 경우에만 생성됩니다.'))
      return;

    try {
      const result = await seedExperiences();
      if (result.success) {
        showToast('초기 데이터가 생성되었습니다', 'success');
        await loadExperiences();
      } else {
        showToast(result.error || '초기 데이터 생성에 실패했습니다', 'error');
      }
    } catch (error) {
      console.error('Failed to seed experiences:', error);
      showToast('초기 데이터 생성에 실패했습니다', 'error');
    }
  };

  const moveExperience = async (index: number, direction: 'up' | 'down') => {
    const newExperiences = [...experiences];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newExperiences.length) return;

    // sortOrder 교환
    const temp = newExperiences[index].sortOrder;
    newExperiences[index].sortOrder = newExperiences[targetIndex].sortOrder;
    newExperiences[targetIndex].sortOrder = temp;

    // 각각 업데이트
    try {
      await Promise.all([
        updateExperience(newExperiences[index].id, { ...newExperiences[index] }),
        updateExperience(newExperiences[targetIndex].id, { ...newExperiences[targetIndex] }),
      ]);
      await loadExperiences();
      showToast('순서가 변경되었습니다', 'success');
    } catch (error) {
      console.error('Failed to move experience:', error);
      showToast('순서 변경에 실패했습니다', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">경력 관리</h1>
          <p className="text-gray-600 dark:text-gray-400">
            소개 페이지에 표시될 경력 정보를 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          {experiences.length === 0 && (
            <Button onClick={handleSeedData} variant="outline" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              초기 데이터 생성
            </Button>
          )}
          <Button onClick={() => openExperienceModal()}>
            <Plus className="h-4 w-4 mr-2" />
            경력 추가
          </Button>
        </div>
      </div>

      {/* 경력 목록 */}
      <div className="space-y-4">
        {experiences.map((experience, index) => (
          <Card key={experience.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{experience.company}</CardTitle>
                    {experience.isCurrent && <Badge variant="default">재직중</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {experience.position}
                    {experience.team && ` · ${experience.team}`}
                  </p>
                  <p className="text-sm text-gray-500">{experience.period}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveExperience(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveExperience(index, 'down')}
                    disabled={index === experiences.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openExperienceModal(experience)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteExperience(experience.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {experience.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {experience.description}
                </p>
              )}
            </CardHeader>
            {experience.achievements && experience.achievements.length > 0 && (
              <CardContent>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  주요 성과
                </h4>
                <div className="space-y-2">
                  {experience.achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <h5 className="font-medium">{achievement.title}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {achievement.description}
                      </p>
                      {achievement.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {achievement.tags.split(',').map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingExperience ? '경력 수정' : '새 경력 추가'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">회사명 *</Label>
                    <Input
                      id="company"
                      value={experienceForm.company}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExperienceForm(prev => ({ ...prev, company: e.target.value }))
                      }
                      placeholder="예: 비바리퍼블리카"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">직책 *</Label>
                    <Input
                      id="position"
                      value={experienceForm.position}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExperienceForm(prev => ({ ...prev, position: e.target.value }))
                      }
                      placeholder="예: Frontend Developer"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="team">팀명 (선택)</Label>
                  <Input
                    id="team"
                    value={experienceForm.team}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setExperienceForm(prev => ({ ...prev, team: e.target.value }))
                    }
                    placeholder="예: 토스 플레이스"
                  />
                </div>

                <div>
                  <Label htmlFor="period">근무 기간 *</Label>
                  <Input
                    id="period"
                    value={experienceForm.period}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setExperienceForm(prev => ({ ...prev, period: e.target.value }))
                    }
                    placeholder="예: 2023.01 ~ 재직중 또는 2022.01 ~ 2023.12"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isCurrent"
                    checked={experienceForm.isCurrent}
                    onCheckedChange={(checked: boolean) =>
                      setExperienceForm(prev => ({ ...prev, isCurrent: checked }))
                    }
                  />
                  <Label htmlFor="isCurrent">재직중</Label>
                </div>

                <div>
                  <Label htmlFor="description">설명 (선택)</Label>
                  <Textarea
                    id="description"
                    value={experienceForm.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setExperienceForm(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="회사나 직무에 대한 간단한 설명"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="sortOrder">정렬 순서</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={experienceForm.sortOrder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setExperienceForm(prev => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="클수록 위에 표시됩니다"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    취소
                  </Button>
                  <Button
                    onClick={editingExperience ? handleUpdateExperience : handleCreateExperience}
                  >
                    {editingExperience ? '수정' : '생성'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
