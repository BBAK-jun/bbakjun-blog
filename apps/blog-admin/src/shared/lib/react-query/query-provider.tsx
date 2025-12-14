"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5분 동안 캐시 유지
            staleTime: 1000 * 60 * 5,
            // 30분 동안 가비지 컬렉션 방지 (언마운트 후에도 유지)
            gcTime: 1000 * 60 * 30,
            // 에러 발생 시 재시도 설정
            retry: 1,
            // 윈도우 포커스 시 자동 refetch 비활성화
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
