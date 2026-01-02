'use server';

import { getUploadHistory } from '@/shared/server/blob-cdc';

export interface UploadHistoryResponse {
  history: Array<{
    id: string;
    actionType: 'CREATE' | 'UPDATE' | 'DELETE';
    pathname: string;
    fileUrl: string | null;
    fileSize: number | null;
    contentType: string | null;
    createdAt: string;
    uploadedBy: string | null;
  }>;
  total: number;
  hasMore: boolean;
}

export async function fetchUploadHistory(params: {
  limit: number;
  offset: number;
  search?: string;
  actionType?: 'CREATE' | 'UPDATE' | 'DELETE';
}): Promise<UploadHistoryResponse> {
  const result = await getUploadHistory({
    limit: params.limit,
    offset: params.offset,
    searchTerm: params.search,
    actionType: params.actionType,
  });

  // Convert Date to string for JSON serialization
  return {
    ...result,
    history: result.history.map(h => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}
