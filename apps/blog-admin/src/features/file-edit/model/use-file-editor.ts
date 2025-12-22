/**
 * File Edit Feature - File Editor Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { parseFrontMatter, type EditorFormData } from '@/entities/frontmatter';
import {
  getFileContent,
  updateFile,
  previewMarkdown,
} from '@/app/actions/files';
import { fileKeys } from '@/entities/file';

export function useFileEditor(pathname: string | null) {
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<EditorFormData>({
    title: '',
    description: '',
    tags: [],
    author: '',
    date: '',
    draft: false,
    content: '',
  });

  // Track initial data for change detection
  const [initialFormData, setInitialFormData] = useState<EditorFormData | null>(null);

  // Fetch file data
  const {
    data: fileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['file', pathname],
    queryFn: async () => {
      const result = await getFileContent(pathname!);
      if (!result.success) {
        throw new Error(result.error || '파일을 불러올 수 없습니다.');
      }
      // Type guard: check if result has rawContent (success case)
      if (!('rawContent' in result)) {
        throw new Error('파일을 불러올 수 없습니다.');
      }
      return {
        rawContent: result.rawContent,
        htmlContent: result.htmlContent,
        frontMatter: result.frontMatter,
        metadata: result.metadata,
      };
    },
    enabled: !!pathname,
  });

  // Initialize form when file data is loaded
  useEffect(() => {
    if (fileData?.rawContent) {
      const { frontMatter, body } = parseFrontMatter(fileData.rawContent);

      const initialData = {
        title: frontMatter?.title || '',
        description: frontMatter?.description || '',
        tags: Array.isArray(frontMatter?.tags) ? frontMatter.tags : [],
        author: frontMatter?.author || '',
        date: frontMatter?.date || '',
        draft: frontMatter?.draft || false,
        series: frontMatter?.series,
        seriesOrder: frontMatter?.seriesOrder,
        content: body,
      };

      setFormData(initialData);
      setInitialFormData(initialData);
    }
  }, [fileData]);

  // Preview query with debouncing
  const { data: previewResult } = useQuery({
    queryKey: ['preview', formData.content],
    queryFn: async () => {
      const result = await previewMarkdown(formData.content);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { htmlContent: result.htmlContent };
    },
    enabled: formData.content.length > 0,
    staleTime: 500,
  });

  // Parse tags from string to array
  const parseTags = (tags: string[]): string[] => {
    // If already an array, join and re-parse to normalize
    const tagString = Array.isArray(tags) ? tags.join(', ') : String(tags);
    return tagString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = initialFormData
    ? JSON.stringify(formData) !== JSON.stringify(initialFormData)
    : false;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pathname) throw new Error('No pathname');

      // Parse tags only on submission
      const parsedTags = parseTags(formData.tags);

      const result = await updateFile({
        pathname,
        title: formData.title,
        description: formData.description,
        tags: parsedTags,
        author: formData.author,
        date: formData.date,
        draft: formData.draft,
        content: formData.content,
      });

      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      // Update initial data after successful save
      setInitialFormData(formData);

      // Invalidate current file query to refetch
      queryClient.invalidateQueries({ queryKey: ['file', pathname] });
      // Invalidate all file lists to show updated metadata
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
    },
  });

  return {
    fileData,
    isLoading,
    error,
    formData,
    setFormData,
    previewHtml: previewResult?.htmlContent || fileData?.htmlContent || '',
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    hasUnsavedChanges,
  };
}
