import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  combineContent,
  parseFrontMatter,
  type EditorFormData,
} from "@/entities/frontmatter";
import { getFileContent, updateFile, previewMarkdown } from "@/app/actions/files";
import { useState, useEffect } from "react";

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
    queryFn: async () => {
      const result = await getFileContent(pathname!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    enabled: !!pathname,
  });

  // Initialize form when file data is loaded
  useEffect(() => {
    if (fileData?.rawContent) {
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
  const { data: previewResult } = useQuery({
    queryKey: ["preview", formData.content],
    queryFn: async () => {
      const result = await previewMarkdown(formData.content);
      return result;
    },
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

      const result = await updateFile(pathname, fullContent);
      if (!result.success) {
        throw new Error(result.error);
      }
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
    previewHtml: previewResult?.htmlContent || fileData?.htmlContent || "",
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
  };
}
