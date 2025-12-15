/**
 * File Create Feature - Form Validation Schema
 *
 * Client-side form validation using Zod
 */

import { z } from "zod";

/**
 * File Creation Form Schema
 * Validates file creation form inputs on the client side
 */
export const fileCreateFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().min(1, "설명을 입력해주세요"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)"),
  tags: z
    .array(z.string().min(1, "빈 태그는 허용되지 않습니다"))
    .min(1, "최소 1개의 태그를 입력해주세요"),
  author: z.string().min(1, "작성자를 입력해주세요"),
  draft: z.boolean().optional(),
  content: z.string().min(1, "내용을 입력해주세요"),
});

/**
 * Type Inference
 */
export type FileCreateFormData = z.infer<typeof fileCreateFormSchema>;
