/**
 * File Edit Feature - File Editor Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { parseFrontMatter, type EditorFormData } from '@/entities/frontmatter';
import { getFileContent, updateFile, previewMarkdown } from '@/app/actions/files';
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

  // Prevents formData overwrite when the query refetches after save.
  // Without this, save → invalidateQueries → refetch → fileData changes →
  // useEffect fires → setFormData(server data) overwrites any concurrent edits.
  const hasInitializedRef = useRef(false);

  // Reset initialization flag when pathname changes (navigating to a different file)
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [pathname]);

  // Fetch file data — uses fileKeys.detail() to share cache with the view page,
  // so invalidation after save refreshes both pages
  const {
    data: fileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: fileKeys.detail(pathname || ''),
    queryFn: async () => {
      const result = await getFileContent(pathname!);
      if (!result.success) {
        throw new Error(result.error || '파일을 불러올 수 없습니다.');
      }
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

  // Initialize form ONLY on first load, not on subsequent refetches after save
  useEffect(() => {
    if (fileData?.rawContent && !hasInitializedRef.current) {
      hasInitializedRef.current = true;

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

      // Invalidate shared detail query (refreshes both edit and view pages)
      queryClient.invalidateQueries({ queryKey: fileKeys.detail(pathname!) });
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
