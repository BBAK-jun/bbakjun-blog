/**
 * Shared File Validation Schemas
 *
 * Zod schemas for file operations used across Server Actions and API routes
 */

import { z } from 'zod';

/**
 * Create File Input Schema
 * Validates input for creating new markdown files
 */
export const createFileSchema = z.object({
  pathname: z
    .string()
    .min(1, '경로는 필수입니다')
    .regex(/^[^/].*[^/]$/, "경로는 '/'로 시작하거나 끝날 수 없습니다")
    .refine(
      path => {
        const parts = path.split('/');
        return parts.every(part => part.trim().length > 0);
      },
      { message: '경로의 모든 부분은 비어있을 수 없습니다' }
    ),
  title: z.string().min(1, '제목은 필수입니다'),
  description: z.string().min(1, '설명은 필수입니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다'),
  tags: z.array(z.string().min(1)).min(1, '최소 1개의 태그가 필요합니다'),
  author: z.string().min(1, '작성자는 필수입니다'),
  draft: z.boolean().optional(),
  content: z.string().min(1, '내용은 필수입니다'),
  series: z.string().optional(),
  seriesOrder: z.number().optional(),
});

/**
 * Update File Input Schema
 * Validates input for updating existing markdown files
 */
export const updateFileSchema = z.object({
  pathname: z.string().min(1, '경로는 필수입니다'),
  title: z.string().min(1, '제목은 필수입니다'),
  description: z.string().min(1, '설명은 필수입니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다'),
  tags: z.array(z.string().min(1)).min(1, '최소 1개의 태그가 필요합니다'),
  author: z.string().min(1, '작성자는 필수입니다'),
  draft: z.boolean().optional(),
  content: z.string().min(1, '내용은 필수입니다'),
  series: z.string().optional(),
  seriesOrder: z.number().optional(),
});

/**
 * Delete File Input Schema
 */
export const deleteFileSchema = z.object({
  pathname: z.string().min(1, '경로는 필수입니다'),
});

/**
 * Type Inference Exports
 */
export type CreateFileInput = z.infer<typeof createFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
