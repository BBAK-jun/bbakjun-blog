/**
 * Upload History Page
 *
 * Server component that fetches initial data and renders the client-side HistoryWidget
 */

import { client } from '@/lib/rpc';
import { HistoryWidget } from './history-widget';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; actionType?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const response = await client.rpc['upload-history'].$get({
    query: {
      limit: String(limit),
      offset: String(offset),
      search: searchParams.search,
      actionType: searchParams.actionType as 'CREATE' | 'UPDATE' | 'DELETE' | undefined,
    },
  });

  if (!response.ok) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">이력을 불러오는데 실패했습니다</p>
        </div>
      </div>
    );
  }

  const data = await response.json();

  return <HistoryWidget initialData={data} />;
}
