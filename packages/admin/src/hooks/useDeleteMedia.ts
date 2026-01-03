/**
 * useDeleteMedia Hook
 *
 * Manages soft delete operations for media items.
 * Moves items to trash (soft delete) rather than permanent deletion.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { del } from '@/lib/api/client';
import { mediaKeys } from '@/lib/query/keys';
import type { ApiResponse } from '@/types/api';

interface DeleteMediaResponse {
  message: string;
  id: number;
  deletedAt: string;
}

/**
 * Hook for soft delete media operations.
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  // Single item soft delete
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      del<ApiResponse<DeleteMediaResponse>>(`/admin/media/${id}`),
    onSuccess: () => {
      // Invalidate both library and trash queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.trash() });
    },
  });

  // Bulk soft delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      // Delete items sequentially to avoid overwhelming the server
      const results = [];
      for (const id of ids) {
        const result = await del<ApiResponse<DeleteMediaResponse>>(`/admin/media/${id}`);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      // Invalidate both library and trash queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.trash() });
    },
  });

  return {
    // Single delete
    deleteMedia: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Bulk delete
    bulkDeleteMedia: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
    bulkDeleteError: bulkDeleteMutation.error,
  };
}

export default useDeleteMedia;
