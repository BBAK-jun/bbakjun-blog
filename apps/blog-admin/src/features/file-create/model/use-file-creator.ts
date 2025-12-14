/**
 * File Create Feature - File Creator Hook
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createFile, previewMarkdown, type CreateFileInput } from "@/app/actions/files";
import { fileKeys } from "@/entities/file";

export interface EditorFormData {
  title: string;
  description: string;
  tags: string[];
  author: string;
  date: string;
  draft: boolean;
  content: string;
}

export function useFileCreator() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [previewHtml, setPreviewHtml] = useState("");

  // Form state
  const [formData, setFormData] = useState<EditorFormData>({
    title: "",
    description: "",
    tags: [],
    author: "bbakjun",
    date: new Date().toISOString().split("T")[0],
    draft: false,
    content: "",
  });

  const [category, setCategory] = useState<string>("");

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (content: string) => {
      const result = await previewMarkdown(content);
      if (!result.success) throw new Error(result.error);
      return result.htmlContent;
    },
    onSuccess: (html) => {
      setPreviewHtml(html || "");
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!category.trim()) throw new Error("카테고리를 선택해주세요");
      if (!formData.title.trim()) throw new Error("제목을 입력해주세요");
      if (!formData.content.trim()) throw new Error("내용을 입력해주세요");

      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-|-$/g, "");

      const pathname = `${category.trim()}/${slug}`;

      const input: CreateFileInput = {
        pathname,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        tags: formData.tags,
        author: formData.author,
        draft: formData.draft,
        content: formData.content,
      };

      const result = await createFile(input);
      if (!result.success) throw new Error(result.error);

      return result;
    },
    onSuccess: (result) => {
      // 파일 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });

      // 생성된 파일로 이동
      router.push(`/dashboard/files/view?pathname=${encodeURIComponent(result.pathname!)}`);
    },
  });

  const handlePreview = () => {
    if (formData.content) {
      previewMutation.mutate(formData.content);
    }
  };

  return {
    // Form state
    formData,
    setFormData,
    category,
    setCategory,

    // Preview
    previewHtml,
    handlePreview,
    isPreviewLoading: previewMutation.isPending,

    // Creation
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    isSuccess: createMutation.isSuccess,
  };
}
