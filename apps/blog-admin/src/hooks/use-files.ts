import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export function useFiles() {
  const queryClient = useQueryClient();

  // Fetch files
  const { data: files = [], isLoading, error, refetch } = useQuery({
    queryKey: ["files"],
    queryFn: () => apiClient.listFiles(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (pathname: string) => apiClient.deleteFile(pathname),
    onSuccess: () => {
      // Invalidate files query to refetch
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  return {
    files,
    isLoading,
    error,
    refetch,
    deleteFile: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
