import { client } from './rpc';

export interface Experience {
  id: string;
  company: string;
  position: string;
  team: string | null;
  period: string;
  isCurrent: boolean;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tags: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 경력 정보를 가져오는 함수
 */
export async function getExperiences(): Promise<Experience[]> {
  try {
    const response = await client.api.rpc.experiences.$get();

    if (!response.ok) {
      throw new Error('Failed to fetch experiences');
    }

    const result = (await response.json()) as {
      success: boolean;
      data?: Experience[];
      error?: string;
    };

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch experiences');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching experiences:', error);
    // Fallback: 빈 배열 반환
    return [];
  }
}
