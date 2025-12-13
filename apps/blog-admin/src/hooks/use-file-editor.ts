import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, type FileData } from "@/shared/api";
import {
  combineContent,
  parseFrontMatter,
  type FrontMatter,
} from "@/entities/frontmatter";
import { useState, useEffect } from "react";

export interface EditorFormData extends Partial<FrontMatter> {
  content: string;
}

export function useFileEditor(pathname: string | null) {
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<EditorFormData>({
    title: "",
    description: "",
    tags: [],
    author: "",
    date: "",
    draft: false,
    content: "",
  });

  // Fetch file data
  const {
    data: fileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["file", pathname],
    queryFn: () => apiClient.getFile(pathname!),
    enabled: !!pathname,
  });

  // Initialize form when file data is loaded
  useEffect(() => {
    if (fileData) {
      const { frontMatter, body } = parseFrontMatter(fileData.rawContent);

      setFormData({
        title: frontMatter?.title || "",
        description: frontMatter?.description || "",
        tags: frontMatter?.tags || [],
        author: frontMatter?.author || "",
        date: frontMatter?.date || "",
        draft: frontMatter?.draft || false,
        content: body,
      });
    }
  }, [fileData]);

  // Preview query with debouncing
  const { data: previewHtml } = useQuery({
    queryKey: ["preview", formData.content],
    queryFn: () => apiClient.previewMarkdown(formData.content),
    enabled: formData.content.length > 0,
    staleTime: 500,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pathname) throw new Error("No pathname");

      const fullContent = combineContent(
        {
          title: formData.title,
          description: formData.description,
          tags: formData.tags,
          author: formData.author,
          date: formData.date,
          draft: formData.draft || undefined,
        },
        formData.content
      );

      await apiClient.updateFile(pathname, fullContent);
    },
    onSuccess: () => {
      // Invalidate file query to refetch
      queryClient.invalidateQueries({ queryKey: ["file", pathname] });
    },
  });

  return {
    fileData,
    isLoading,
    error,
    formData,
    setFormData,
    previewHtml: previewHtml || fileData?.htmlContent || "",
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
  };
}
