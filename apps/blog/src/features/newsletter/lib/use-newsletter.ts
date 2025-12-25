import { useMutation, useQuery, queryOptions } from '@tanstack/react-query';
import { client } from '@/lib/rpc';
import { newsletterKeyConstructors } from './query-keys';

export const newsletterQueries = {
  unsubscribe: (token: string) =>
    queryOptions({
      queryKey: newsletterKeyConstructors.unsubscribe(token),
      queryFn: async () => {
        if (!token) {
          throw new Error('유효하지 않은 구독 취소 링크입니다');
        }

        const response = await client.rpc.unsubscribeNewsletter.$post({
          json: { token },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '구독 취소 중 오류가 발생했습니다');
        }

        return await response.json();
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: 1,
    }),
};

export function useUnsubscribeMutation() {
  return useMutation({
    mutationFn: async (token: string) => {
      if (!token) {
        throw new Error('유효하지 않은 구독 취소 링크입니다');
      }

      const response = await client.rpc.unsubscribeNewsletter.$post({
        json: { token },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '구독 취소 중 오류가 발생했습니다');
      }

      return await response.json();
    },
    retry: 1,
  });
}

export function useUnsubscribe(token: string, enabled = true) {
  return useQuery({
    ...newsletterQueries.unsubscribe(token),
    enabled: !!token && enabled,
  });
}
