import type { AppRouteHandler } from '@/rpc/libs';
import { getUploadHistory } from '@/shared/server/blob-cdc';
import * as routes from './upload-history.routes';

export const getUploadHistoryHandler: AppRouteHandler<typeof routes.getUploadHistory> = async c => {
  const { limit, offset, search: searchTerm, actionType } = c.req.valid('query');

  const result = await getUploadHistory({ limit, offset, searchTerm, actionType });

  return c.json(result, 200);
};
