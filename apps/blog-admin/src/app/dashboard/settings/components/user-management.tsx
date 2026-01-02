'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Shield,
  Crown,
  User,
  RefreshCw,
  Mail,
  Calendar,
} from 'lucide-react';
import { getUsers, updateUserRole, getCurrentUser } from '../../../actions/settings';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'GUEST';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: Date;
}

const ROLE_CONFIG = {
  SUPER_ADMIN: {
    label: '최고 관리자',
    description: '모든 권한 + 사용자 역할 관리',
    icon: Crown,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  ADMIN: {
    label: '관리자',
    description: '콘텐츠 관리 (CRUD)',
    icon: Shield,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  GUEST: {
    label: '게스트',
    description: '읽기 전용',
    icon: User,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-800',
  },
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: UserRole } | null>(null);

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        toast.error(result.error || '사용자 목록을 불러오는데 실패했습니다');
      }
    } catch (error) {
      toast.error('사용자 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const result = await getCurrentUser();
      if (result.success && result.data) {
        setCurrentUser({
          id: result.data.id,
          role: result.data.role as UserRole,
        });
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    try {
      const result = await updateUserRole({ userId, role: newRole });
      if (result.success) {
        toast.success('역할이 변경되었습니다');
        // 사용자 목록 갱신
        await loadUsers();
      } else {
        toast.error(result.error || '역할 변경에 실패했습니다');
      }
    } catch (error) {
      toast.error('역할 변경에 실패했습니다');
    } finally {
      setUpdating(null);
    }
  };

  const canModifyUser = (user: User): boolean => {
    if (!currentUser) return false;
    // SUPER_ADMIN만 역할 변경 가능
    if (currentUser.role !== 'SUPER_ADMIN') return false;
    // 자신은 변경 불가
    if (user.id === currentUser.id) return false;
    return true;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            사용자 관리
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            사용자 역할 및 권한을 관리합니다
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 권한 안내 */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          역할별 권한
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={role}
                className={`${config.bgColor} rounded-lg p-4 border border-slate-200 dark:border-slate-700`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <h4 className={`font-semibold ${config.color}`}>
                    {config.label}
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {config.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              사용자 목록 ({users.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {users.map(user => {
            const roleConfig = ROLE_CONFIG[user.role];
            const RoleIcon = roleConfig.icon;
            const isCurrentUser = currentUser?.id === user.id;
            const canModify = canModifyUser(user);

            return (
              <div
                key={user.id}
                className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.name || '이름 없음'}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                            나
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full ${roleConfig.bgColor}`}
                      >
                        <RoleIcon className={`w-4 h-4 ${roleConfig.color}`} />
                        <span className={`text-sm font-medium ${roleConfig.color}`}>
                          {roleConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.createdAt)}
                      </div>
                    </div>

                    {canModify && (
                      <select
                        value={user.role}
                        onChange={e =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        disabled={updating === user.id}
                        className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="SUPER_ADMIN">최고 관리자</option>
                        <option value="ADMIN">관리자</option>
                        <option value="GUEST">게스트</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {users.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              사용자가 없습니다
            </p>
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      {currentUser?.role !== 'SUPER_ADMIN' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <Shield className="w-4 h-4 inline mr-1" />
            사용자 역할을 변경하려면 최고 관리자(SUPER_ADMIN) 권한이 필요합니다.
          </p>
        </div>
      )}
    </div>
  );
}
