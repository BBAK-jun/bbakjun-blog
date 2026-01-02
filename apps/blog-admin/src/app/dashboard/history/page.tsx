/**
 * Upload History Page
 *
 * Server component that fetches initial data and renders the client-side HistoryWidget
 */

import { fetchUploadHistory } from '../../actions/upload-history';
import { HistoryWidget } from './history-widget';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; actionType?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const data = await fetchUploadHistory({
    limit,
    offset,
    search: searchParams.search,
    actionType: searchParams.actionType as 'CREATE' | 'UPDATE' | 'DELETE' | undefined,
  });

  return <HistoryWidget initialData={data} />;
}
