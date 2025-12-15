/**
 * File Create Feature - File Creator Hook
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createFile, previewMarkdown, type CreateFileInput } from "@/app/actions/files";
import { fileKeys } from "@/entities/file";
import { useLocalStorage } from "@/shared/hooks/use-local-storage";

export interface EditorFormData {
  title: string;
  description: string;
  tags: string[];
  author: string;
  date: string;
  draft: boolean;
  content: string;
}

interface DraftData extends EditorFormData {
  category: string;
}

const AUTOSAVE_KEY = "blog-admin-draft-autosave";

const getDefaultFormData = (): EditorFormData => ({
  title: "",
  description: "",
  tags: [],
  author: "bbakjun",
  date: new Date().toISOString().split("T")[0],
  draft: false,
  content: "",
});

const getDefaultDraftData = (): DraftData => ({
  ...getDefaultFormData(),
  category: "",
});

export function useFileCreator() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [previewHtml, setPreviewHtml] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Use localStorage hook for automatic syncing
  const [draftData, setDraftData] = useLocalStorage<DraftData>(
    AUTOSAVE_KEY,
    getDefaultDraftData()
  );

  // Local state for form data and category
  const [formData, setFormData] = useState<EditorFormData>({
    title: draftData.title,
    description: draftData.description,
    tags: draftData.tags,
    author: draftData.author,
    date: draftData.date || new Date().toISOString().split("T")[0],
    draft: draftData.draft,
    content: draftData.content,
  });

  const [category, setCategory] = useState<string>(draftData.category);

  // Track if user is actively editing to prevent sync conflicts
  const isEditingRef = useRef(false);
  const editTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync from draftData when it changes (from other tabs or storage)
  useEffect(() => {
    // Don't sync if user is actively editing (within 3 seconds of last edit)
    if (isEditingRef.current) {
      return;
    }

    setFormData((prev) => {
      // Only update if content actually changed
      const hasChanged =
        prev.title !== draftData.title ||
        prev.description !== draftData.description ||
        prev.content !== draftData.content ||
        prev.author !== draftData.author ||
        prev.date !== draftData.date ||
        prev.draft !== draftData.draft ||
        JSON.stringify(prev.tags) !== JSON.stringify(draftData.tags);

      if (!hasChanged) {
        return prev;
      }

      return {
        title: draftData.title,
        description: draftData.description,
        tags: draftData.tags,
        author: draftData.author,
        date: draftData.date || new Date().toISOString().split("T")[0],
        draft: draftData.draft,
        content: draftData.content,
      };
    });

    setCategory((prev) => (prev !== draftData.category ? draftData.category : prev));
  }, [draftData]);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    // Mark as editing
    isEditingRef.current = true;

    // Clear previous edit timeout
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }

    // Reset editing flag after 3 seconds
    editTimeoutRef.current = setTimeout(() => {
      isEditingRef.current = false;
    }, 3000);

    const timer = setTimeout(() => {
      setDraftData({
        ...formData,
        category,
      });
      setLastSavedAt(new Date());
    }, 2000); // Save after 2 seconds of inactivity

    return () => {
      clearTimeout(timer);
    };
  }, [formData, category, setDraftData]);

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

  // Auto-preview with debounce when content changes
  useEffect(() => {
    if (!formData.content) {
      setPreviewHtml("");
      return;
    }

    const timer = setTimeout(() => {
      previewMutation.mutate(formData.content);
    }, 500); // 500ms debounce for preview

    return () => clearTimeout(timer);
  }, [formData.content]);

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
      // Clear autosave
      clearDraft();

      // 파일 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });

      // 생성된 파일로 이동
      router.push(`/dashboard/files/view?pathname=${encodeURIComponent(result.pathname!)}`);
    },
  });

  const clearDraft = () => {
    const defaultData = getDefaultFormData();

    // Clear via useLocalStorage setter
    setDraftData(getDefaultDraftData());

    // Update local state
    setFormData(defaultData);
    setCategory("");
    setLastSavedAt(null);
  };

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

    // Autosave
    lastSavedAt,
    clearDraft,
  };
}
