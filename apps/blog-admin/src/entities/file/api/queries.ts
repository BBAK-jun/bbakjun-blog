/**
 * File Entity - TanStack Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listFiles, deleteFile, getFileContent } from '@/app/actions/files';
import type { BlobFile, FileContent } from '../model/types';

/**
 * Query Keys
 */
export const fileKeys = {
  all: ['files'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  list: (limit?: number) => [...fileKeys.lists(), limit] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (pathname: string) => [...fileKeys.details(), pathname] as const,
};

/**
 * useFilesQuery - Fetch list of files
 */
export function useFilesQuery(limit?: number) {
  return useQuery({
    queryKey: fileKeys.list(limit),
    queryFn: async () => {
      const result = await listFiles(limit || 100);
      if (!result.success) {
        throw new Error(result.error || '파일 목록을 불러올 수 없습니다.');
      }
      return result.files || [];
    },
    staleTime: 0, // Always fetch fresh data (blob URLs change on update)
  });
}

/**
 * useFileQuery - Fetch single file content
 */
export function useFileQuery(pathname: string | null) {
  return useQuery({
    queryKey: fileKeys.detail(pathname || ''),
    queryFn: async () => {
      if (!pathname) {
        throw new Error('파일 경로가 지정되지 않았습니다.');
      }

      const result = await getFileContent(pathname);

      if (!result.success) {
        throw new Error(result.error || '파일을 불러올 수 없습니다.');
      }

      // Type guard: check if result has rawContent (success case)
      if (!('rawContent' in result) || !result.rawContent) {
        throw new Error('파일을 불러올 수 없습니다.');
      }

      // Transform the server action response to match entity's FileContent interface
      const transformedFileContent: FileContent = {
        rawContent: result.rawContent,
        htmlContent: result.htmlContent || '',
        frontMatter: result.frontMatter || null,
        metadata: {
          pathname: result.metadata.pathname,
          size: result.metadata.size,
          uploadedAt: result.metadata.uploadedAt,
          url: result.metadata.url,
        },
      };

      return transformedFileContent;
    },
    enabled: !!pathname,
    staleTime: 0, // Always fetch fresh data (blob URLs change on update)
  });
}

/**
 * useDeleteFileMutation - Delete a file
 */
export function useDeleteFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pathname }: { pathname: string }) => {
      const result = await deleteFile(pathname);
      if (!result.success) {
        throw new Error(result.error || '파일 삭제 중 오류가 발생했습니다.');
      }
      return { pathname };
    },
    onSuccess: data => {
      // Remove deleted file from cache
      queryClient.setQueryData<BlobFile[]>(fileKeys.all, old => {
        return old?.filter(f => f.pathname !== data.pathname) || [];
      });
      // Invalidate all file lists
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
    },
  });
}
