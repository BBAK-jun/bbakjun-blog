/**
 * File Create Feature - File Creator Hook
 */

import { fileKeys } from '@/entities/file';
import { createFile as createFileAction, previewMarkdown } from '@/app/actions/files';
import type { CreateFileInput } from '@/shared/api/file-service';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface EditorFormData {
  title: string;
  slug?: string; // Custom filename (optional, auto-generated from title if not provided)
  description: string;
  tags: string[]; // Stored as array internally, but input uses string
  author: string;
  date: string;
  draft: boolean;
  series?: string;
  seriesOrder?: number;
  content: string;
}

interface DraftData extends EditorFormData {
  category: string;
}

const AUTOSAVE_KEY = 'blog-admin-draft-autosave';

const getDefaultFormData = (): EditorFormData => ({
  title: '',
  description: '',
  tags: [],
  author: 'bbakjun',
  date: new Date().toISOString().split('T')[0],
  draft: false,
  content: '',
});

const getDefaultDraftData = (): DraftData => ({
  ...getDefaultFormData(),
  category: '',
});

export function useFileCreator() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [previewHtml, setPreviewHtml] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Use localStorage hook for automatic syncing
  const [draftData, setDraftData] = useLocalStorage<DraftData>(AUTOSAVE_KEY, getDefaultDraftData());

  // Local state for form data and category
  const [formData, setFormData] = useState<EditorFormData>({
    title: draftData.title,
    description: draftData.description,
    tags: draftData.tags,
    author: draftData.author,
    date: draftData.date || new Date().toISOString().split('T')[0],
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

    setFormData(prev => {
      // Only update if content actually changed
      const hasChanged =
        prev.title !== draftData.title ||
        prev.slug !== draftData.slug ||
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
        slug: draftData.slug,
        description: draftData.description,
        tags: draftData.tags,
        author: draftData.author,
        date: draftData.date || new Date().toISOString().split('T')[0],
        draft: draftData.draft,
        content: draftData.content,
      };
    });

    setCategory(prev => (prev !== draftData.category ? draftData.category : prev));
  }, [draftData]);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    // Mark as editing
    isEditingRef.current = true;
    setIsSaving(true);

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
      setIsSaving(false);
    }, 2000); // Save after 2 seconds of inactivity

    return () => {
      clearTimeout(timer);
      // Don't setIsSaving(false) here — it causes the "저장 중..." indicator
      // to flicker on every keystroke. isSaving is set to false when the
      // timer fires (autosave completes) or on unmount via clearDraft.
    };
  }, [formData, category, setDraftData]);

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (content: string) => {
      const result = await previewMarkdown(content);
      if (!result.success) throw new Error(result.error);
      return result.htmlContent;
    },
    onSuccess: html => {
      setPreviewHtml(html || '');
    },
  });

  // Auto-preview with debounce when content changes
  useEffect(() => {
    if (!formData.content) {
      setPreviewHtml('');
      return;
    }

    const timer = setTimeout(() => {
      previewMutation.mutate(formData.content);
    }, 500); // 500ms debounce for preview

    return () => clearTimeout(timer);
  }, [formData.content]);

  // Parse tags from string to array
  const parseTags = (tags: string[]): string[] => {
    // If already an array, join and re-parse to normalize
    const tagString = Array.isArray(tags) ? tags.join(', ') : String(tags);
    return tagString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!category.trim()) throw new Error('카테고리를 선택해주세요');
      if (!formData.title.trim()) throw new Error('제목을 입력해주세요');
      if (!formData.content.trim()) throw new Error('내용을 입력해주세요');

      // Use custom slug if provided, otherwise auto-generate from title
      const slug = formData.slug?.trim()
        ? formData.slug.trim()
        : formData.title
            .toLowerCase()
            .replace(/[^a-z0-9가-힣]+/g, '-')
            .replace(/^-|-$/g, '');

      const pathname = `${category.trim()}/${slug}`;

      // Parse tags only on submission
      const parsedTags = parseTags(formData.tags);

      const input: CreateFileInput = {
        pathname,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        tags: parsedTags,
        author: formData.author,
        draft: formData.draft,
        content: formData.content,
      };

      const result = await createFileAction(input);
      if (!result.success) throw new Error(result.error);

      return result;
    },
    onSuccess: result => {
      // Clear autosave
      clearDraft();

      // 파일 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });

      // Toast 알림
      toast.success('파일 생성 완료', {
        description: '새 파일이 성공적으로 생성되었습니다',
      });

      // 생성된 파일로 이동
      router.push(`/dashboard/files/view?pathname=${encodeURIComponent(result?.pathname || '')}`);
    },
    onError: error => {
      toast.error('파일 생성 실패', {
        description: error instanceof Error ? error.message : '파일 생성에 실패했습니다',
      });
    },
  });

  const clearDraft = () => {
    const defaultData = getDefaultFormData();

    // Clear via useLocalStorage setter
    setDraftData(getDefaultDraftData());

    // Update local state
    setFormData(defaultData);
    setCategory('');
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
    isSaving,
    clearDraft,
  };
}
