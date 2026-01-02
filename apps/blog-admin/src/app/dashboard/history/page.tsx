import { getUploadHistory } from '@/shared/server/blob-cdc';
import { uploadHistoryQuerySchema } from '@/shared/api/upload-history';
import HistoryWidget from './HistoryWidget';

interface HistoryPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    actionType?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;

  // Zod 스키마로 searchParams 검증
  const validatedParams = uploadHistoryQuerySchema.parse({
    ...params,
    offset: (parseInt(params.page || '1') - 1) * 50,
  });

  const data = await getUploadHistory({
    limit: validatedParams.limit,
    offset: validatedParams.offset,
    searchTerm: validatedParams.search,
    actionType: validatedParams.actionType,
  });

  return <HistoryWidget initialData={data} />;
}
