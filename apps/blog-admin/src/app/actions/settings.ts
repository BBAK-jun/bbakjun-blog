'use server';

import { auth } from '../../../auth';
import { prisma } from '../../shared/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 설정 스키마
const settingSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, '키를 입력해주세요'),
  value: z.string(),
  category: z.enum(['blog', 'system', 'content']),
  type: z.enum(['string', 'number', 'boolean', 'json']),
  label: z.string().min(1, '라벨을 입력해주세요'),
});

// 초기 설정 데이터
const DEFAULT_SETTINGS = [
  // 블로그 설정
  {
    key: 'blog.title',
    value: 'DEV_BBAK 블로그',
    category: 'blog' as const,
    type: 'string' as const,
    label: '블로그 제목',
  },
  {
    key: 'blog.description',
    value: '기술 블로그',
    category: 'blog' as const,
    type: 'string' as const,
    label: '블로그 설명',
  },
  {
    key: 'blog.author',
    value: 'bbakjun',
    category: 'blog' as const,
    type: 'string' as const,
    label: '기본 작성자',
  },
  {
    key: 'blog.url',
    value: 'https://your-blog.com',
    category: 'blog' as const,
    type: 'string' as const,
    label: '블로그 URL',
  },
  // 시스템 설정
  {
    key: 'system.blobSyncInterval',
    value: '30',
    category: 'system' as const,
    type: 'number' as const,
    label: 'Blob 동기화 간격 (분)',
  },
  {
    key: 'system.cacheTTL',
    value: '300',
    category: 'system' as const,
    type: 'number' as const,
    label: '캐시 유효시간 (초)',
  },
  // 콘텐츠 설정
  {
    key: 'content.defaultStatus',
    value: 'draft',
    category: 'content' as const,
    type: 'string' as const,
    label: '기본 게시 상태',
  },
  {
    key: 'content.relatedPostsCount',
    value: '4',
    category: 'content' as const,
    type: 'number' as const,
    label: '관련 게시글 표시 개수',
  },
];

// 카테고리별 설정 조회
export async function getSettingsByCategory(category: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const settings = await prisma.setting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    return { success: true, data: settings };
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return { success: false, error: '설정을 불러오는데 실패했습니다' };
  }
}

// 전체 설정 조회
export async function getAllSettings() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const settings = await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return { success: true, data: settings };
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return { success: false, error: '설정을 불러오는데 실패했습니다' };
  }
}

// 단일 설정 조회
export async function getSetting(key: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return { success: false, error: '설정을 찾을 수 없습니다' };
    }

    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to fetch setting:', error);
    return { success: false, error: '설정을 불러오는데 실패했습니다' };
  }
}

// 설정 생성 또는 업데이트
export async function upsertSetting(data: z.infer<typeof settingSchema>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const validatedData = settingSchema.parse(data);

    const setting = await prisma.setting.upsert({
      where: { key: validatedData.key },
      update: {
        value: validatedData.value,
        category: validatedData.category,
        type: validatedData.type,
        label: validatedData.label,
        updatedBy: session.user.email,
      },
      create: {
        key: validatedData.key,
        value: validatedData.value,
        category: validatedData.category,
        type: validatedData.type,
        label: validatedData.label,
        updatedBy: session.user.email,
      },
    });

    revalidatePath('/dashboard/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to upsert setting:', error);
    return { success: false, error: '설정 저장에 실패했습니다' };
  }
}

// 설정 삭제
export async function deleteSetting(key: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    await prisma.setting.delete({
      where: { key },
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete setting:', error);
    return { success: false, error: '설정 삭제에 실패했습니다' };
  }
}

// 일괄 설정 업데이트
export async function updateSettings(settings: { key: string; value: string }[]) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    await prisma.$transaction(
      settings.map(({ key, value }) =>
        prisma.setting.update({
          where: { key },
          data: { value, updatedBy: session.user.email },
        })
      )
    );

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: '설정 일괄 업데이트에 실패했습니다' };
  }
}

// 초기 설정 데이터 시드
export async function seedDefaultSettings() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    // 기존 설정 확인
    const existingCount = await prisma.setting.count();
    if (existingCount > 0) {
      return { success: false, error: '이미 설정 데이터가 있습니다' };
    }

    // 초기 설정 생성
    const createdSettings = await prisma.$transaction(
      DEFAULT_SETTINGS.map(setting =>
        prisma.setting.create({
          data: {
            ...setting,
            updatedBy: session.user.email,
          },
        })
      )
    );

    revalidatePath('/dashboard/settings');
    return { success: true, data: createdSettings };
  } catch (error) {
    console.error('Failed to seed default settings:', error);
    return { success: false, error: '초기 설정 생성에 실패했습니다' };
  }
}

// 사용자 관련 액션
export async function getUsers() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return { success: false, error: '사용자 목록을 불러오는데 실패했습니다' };
  }
}

// 현재 사용자 정보 조회
export async function getCurrentUser() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    return {
      success: true,
      data: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return { success: false, error: '사용자 정보를 불러오는데 실패했습니다' };
  }
}

// 사용자 역할 업데이트
const userRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'GUEST']),
});

export async function updateUserRole(data: z.infer<typeof userRoleSchema>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    // SUPER_ADMIN만 역할 변경 가능
    if (session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: '권한이 없습니다' };
    }

    const validatedData = userRoleSchema.parse(data);

    // 자신의 역할은 변경 불가
    if (validatedData.userId === session.user.id) {
      return { success: false, error: '자신의 역할은 변경할 수 없습니다' };
    }

    const user = await prisma.user.update({
      where: { id: validatedData.userId },
      data: { role: validatedData.role },
    });

    revalidatePath('/dashboard/settings');
    return { success: true, data: user };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { success: false, error: '역할 변경에 실패했습니다' };
  }
}
