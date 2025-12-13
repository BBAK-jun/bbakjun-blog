/**
 * File Entity Types
 */

export interface BlobFile {
  filename: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface FileMetadata {
  pathname: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface FileContent {
  rawContent: string;
  htmlContent: string;
  frontMatter: Record<string, any> | null;
  metadata: FileMetadata;
}
