/**
 * File Entity
 *
 * Public API for file domain model
 */

export type { BlobFile, FileMetadata, FileContent } from './model/types';
// Alias for backward compatibility
export type { FileContent as FileData } from './model/types';
export { fileKeys, useFilesQuery, useFileQuery, useDeleteFileMutation } from './api/queries';
export { FileListItem } from './ui';
export {
  fileMetadataSchema,
  fileContentSchema,
  type FileMetadata as FileMetadataEntity,
  type FileContent as FileContentEntity,
} from './model/schema';
