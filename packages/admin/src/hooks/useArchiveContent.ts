/**
 * useArchiveContent Hook
 *
 * Mutation hook for archiving content items with optimistic updates.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { del } from '../lib/api/client';
import toast from 'react-hot-toast';
import { projectKeys, materialKeys, newsKeys } from '../lib/query/keys';

type ContentType = 'projects' | 'materials' | 'news';

interface ArchiveOptions {
  /** Content type for determining endpoint and query keys */
  contentType: ContentType;
  /** Optional callback on success */
  onSuccess?: () => void;
}

/**
 * Maps content type to its query keys.
 */
const getQueryKeys = (contentType: ContentType) => {
  switch (contentType) {
    case 'projects':
      return projectKeys;
    case 'materials':
      return materialKeys;
    case 'news':
      return newsKeys;
  }
};

/**
 * Hook for archiving content items.
 */
export function useArchiveContent({ contentType, onSuccess }: ArchiveOptions) {
  const queryClient = useQueryClient();
  const queryKeys = getQueryKeys(contentType);

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      // DELETE request archives the content
      const response = await del<{ data: unknown }>(
        `/admin/${contentType}/${id}`
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });

      toast.success('Content archived successfully');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Archive error:', error);
      toast.error('Failed to archive content');
    },
  });

  return {
    archive: mutation.mutate,
    archiveAsync: mutation.mutateAsync,
    isArchiving: mutation.isPending,
    error: mutation.error,
  };
}

export default useArchiveContent;
