/**
 * useMediaUpload Hook
 *
 * Manages multi-file upload queue with progress tracking and validation.
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mediaKeys } from '@/lib/query/keys';
import { getAccessToken } from '@/lib/auth/storage';
import type { UploadQueueItem, MediaItem } from '@/types/media';

/** Allowed MIME types for upload */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
];

/** Max file sizes in bytes */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Validates a file for upload.
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported`,
    };
  }

  const maxSize = file.type === 'application/pdf' ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Generates a unique ID for upload queue items.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook for managing media file uploads.
 */
export function useMediaUpload() {
  const queryClient = useQueryClient();
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Uploads a single file.
   */
  const uploadFile = useCallback(
    async (item: UploadQueueItem): Promise<MediaItem | null> => {
      // Update status to uploading
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'uploading' as const, progress: 0 } : i
        )
      );

      try {
        const formData = new FormData();
        formData.append('file', item.file);

        const token = getAccessToken();

        // Use XMLHttpRequest for progress tracking
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadQueue((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, progress } : i))
              );
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              resolve(response.data as MediaItem);
            } else {
              let errorMessage = 'Upload failed';
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMessage = errorResponse.message || errorMessage;
              } catch {
                // Use default message
              }
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.open('POST', '/api/v1/admin/media');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          xhr.send(formData);
        });
      } catch (error) {
        throw error;
      }
    },
    []
  );

  /**
   * Processes the upload queue.
   */
  const processQueue = useCallback(async () => {
    setIsUploading(true);

    try {
      const pendingItems = uploadQueue.filter((item) => item.status === 'pending');

      for (const item of pendingItems) {
        try {
          const result = await uploadFile(item);

          // Update status to complete
          setUploadQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'complete' as const, progress: 100, result: result ?? undefined }
                : i
            )
          );
        } catch (error) {
          // Update status to error
          setUploadQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : i
            )
          );
        }
      }

      // Invalidate media queries to refresh list
      await queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    } finally {
      setIsUploading(false);
    }
  }, [uploadQueue, uploadFile, queryClient]);

  /**
   * Adds files to the upload queue and starts processing.
   */
  const addFiles = useCallback(
    (files: File[]) => {
      const newItems: UploadQueueItem[] = files.map((file) => {
        const validation = validateFile(file);
        return {
          id: generateId(),
          file,
          status: validation.valid ? ('pending' as const) : ('error' as const),
          progress: 0,
          error: validation.error,
        };
      });

      setUploadQueue((prev) => [...prev, ...newItems]);

      // Start processing if not already uploading
      if (!isUploading) {
        // Use setTimeout to allow state to update first
        setTimeout(() => {
          processQueue();
        }, 0);
      }
    },
    [isUploading, processQueue]
  );

  /**
   * Removes an item from the upload queue.
   */
  const removeFromQueue = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * Clears completed and errored items from the queue.
   */
  const clearCompleted = useCallback(() => {
    setUploadQueue((prev) =>
      prev.filter((item) => item.status === 'pending' || item.status === 'uploading')
    );
  }, []);

  return {
    uploadQueue,
    isUploading,
    addFiles,
    removeFromQueue,
    clearCompleted,
  };
}

export default useMediaUpload;
