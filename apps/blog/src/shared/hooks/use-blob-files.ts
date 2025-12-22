import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/rpc';
import type { BlobFileInfo } from '@repo/content';

export function useBlobFiles() {
  return useQuery({
    queryKey: ['blob-files'],
    queryFn: async (): Promise<BlobFileInfo[]> => {
      const response = await client.api.rpc.getBlobFiles.$get({
        query: {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch blob files');
      }

      const { files } = await response.json();
      return files.map(f => ({
        url: f.url,
        pathname: f.pathname,
        contentType: f.contentType,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
