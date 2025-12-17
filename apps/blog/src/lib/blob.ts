import { client } from './rpc'
import type { BlobFileInfo } from '@repo/content'

/**
 * CDC 캐시에서 BlobFiles 가져오기
 */
export async function getBlobFiles(): Promise<BlobFileInfo[]> {
  const response = await client.api.v1['blob-files'].$get({})
  if (!response.ok) {
    throw new Error('Failed to fetch blob files')
  }

  const { files } = await response.json()
  return files.map(f => ({
    url: f.url,
    pathname: f.pathname,
    contentType: f.contentType
  }))
}
