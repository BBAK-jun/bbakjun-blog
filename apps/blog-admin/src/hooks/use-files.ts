import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listFiles, deleteFile as deleteFileAction } from "@/app/actions/files";

export function useFiles() {
  const queryClient = useQueryClient();

  // Fetch files
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const result = await listFiles();
      return result;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (pathname: string) => {
      const result = await deleteFileAction(pathname);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      // Invalidate files query to refetch
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  return {
    files: data?.files || [],
    isLoading,
    error,
    refetch,
    deleteFile: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
