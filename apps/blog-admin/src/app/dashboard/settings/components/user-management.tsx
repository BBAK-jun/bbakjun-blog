'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Shield,
  Crown,
  User as UserIcon,
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
    badgeClass: 'bg-primary/10 text-primary',
  },
  ADMIN: {
    label: '관리자',
    description: '콘텐츠 관리 (CRUD)',
    icon: Shield,
    badgeClass: 'bg-info-50 dark:bg-info-950/40 text-info-700 dark:text-info-400',
  },
  GUEST: {
    label: '게스트',
    description: '읽기 전용',
    icon: UserIcon,
    badgeClass: 'bg-muted text-muted-foreground',
  },
} as const;

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
    if (currentUser.role !== 'SUPER_ADMIN') return false;
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
        <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground">사용자 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            사용자 역할 및 권한을 관리합니다
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-foreground hover:bg-muted rounded-lg transition-colors self-start"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 권한 안내 */}
      <div className="bg-card rounded-lg border border-border p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">역할별 권한</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={role}
                className={`${config.badgeClass} rounded-lg p-4 border border-border`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5" />
                  <h4 className="font-semibold">{config.label}</h4>
                </div>
                <p className="text-sm opacity-90">{config.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-foreground" />
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              사용자 목록 ({users.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-border">
          {users.map(user => {
            const roleConfig = ROLE_CONFIG[user.role];
            const RoleIcon = roleConfig.icon;
            const isCurrentUser = currentUser?.id === user.id;
            const canModify = canModifyUser(user);

            return (
              <div
                key={user.id}
                className="px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                      {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{user.name || '이름 없음'}</p>
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
                            나
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                    <div className="text-left md:text-right">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${roleConfig.badgeClass}`}
                      >
                        <RoleIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{roleConfig.label}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.createdAt)}
                      </div>
                    </div>

                    {canModify && (
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={updating === user.id}
                        className="min-h-[44px] px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="px-4 md:px-6 py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">사용자가 없습니다</p>
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      {currentUser?.role !== 'SUPER_ADMIN' && (
        <div className="bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-900 rounded-lg p-4">
          <p className="text-sm text-warning-800 dark:text-warning-400">
            <Shield className="w-4 h-4 inline mr-1" />
            사용자 역할을 변경하려면 최고 관리자(SUPER_ADMIN) 권한이 필요합니다.
          </p>
        </div>
      )}
    </div>
  );
}
