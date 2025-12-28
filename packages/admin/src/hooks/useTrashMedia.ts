/**
 * useTrashMedia Hook
 *
 * Manages trash operations including restore and permanent delete.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, del } from '@/lib/api/client';
import { mediaKeys } from '@/lib/query/keys';
import type { ApiResponse } from '@/types/api';
import type { MediaItem } from '@/types/media';

/**
 * Hook for trash media operations.
 */
export function useTrashMedia() {
  const queryClient = useQueryClient();

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (id: number) =>
      post<ApiResponse<MediaItem>>(`/admin/media/${id}/restore`),
    onSuccess: () => {
      // Invalidate both library and trash queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.trash() });
    },
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: (id: number) =>
      del<ApiResponse<{ message: string; id: number }>>(`/admin/media/${id}/permanent`),
    onSuccess: () => {
      // Invalidate trash queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.trash() });
    },
  });

  return {
    // Restore
    restoreMedia: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
    restoreError: restoreMutation.error,

    // Permanent delete
    permanentDeleteMedia: permanentDeleteMutation.mutateAsync,
    isPermanentDeleting: permanentDeleteMutation.isPending,
    permanentDeleteError: permanentDeleteMutation.error,
  };
}

export default useTrashMedia;
