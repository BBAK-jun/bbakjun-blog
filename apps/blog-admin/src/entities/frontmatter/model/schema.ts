/**
 * Frontmatter Entity - Validation Schema
 *
 * Zod schemas for frontmatter entity validation
 */

import { z } from 'zod';

/**
 * Frontmatter Schema
 * Validates blog post metadata structure
 */
export const frontmatterEntitySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  description: z.string().min(1, '설명은 필수입니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다'),
  tags: z.array(z.string().min(1)).min(1, '최소 1개의 태그가 필요합니다'),
  author: z.string().min(1, '작성자는 필수입니다'),
  draft: z.boolean().optional(),
});

/**
 * Editor Form Data Schema
 * Used for client-side form validation
 */
export const editorFormDataSchema = frontmatterEntitySchema.extend({
  content: z.string().min(1, '내용은 필수입니다'),
});

/**
 * Type Inference Exports
 */
export type FrontmatterEntity = z.infer<typeof frontmatterEntitySchema>;
export type EditorFormDataEntity = z.infer<typeof editorFormDataSchema>;
