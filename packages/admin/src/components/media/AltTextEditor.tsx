/**
 * Alt Text Editor Component
 *
 * Editable alt text field with auto-save functionality.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { put } from '@/lib/api/client';
import { mediaKeys } from '@/lib/query/keys';
import type { MediaItem } from '@/types/media';
import type { ApiResponse } from '@/types/api';

interface AltTextEditorProps {
  /** Media ID */
  mediaId: number;
  /** Initial alt text value */
  initialValue?: string | null;
}

/**
 * Alt text editor component with debounced auto-save.
 */
export function AltTextEditor({ mediaId, initialValue }: AltTextEditorProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initialValue || '');
  const [showSaved, setShowSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update value when initialValue changes
  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (altText: string) =>
      put<ApiResponse<MediaItem>>(`/admin/media/${mediaId}`, { altText }),
    onSuccess: () => {
      // Show saved indicator
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.detail(String(mediaId)) });
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });

  // Debounced save
  const debouncedSave = useCallback(
    (newValue: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        // Only save if value has changed from initial
        if (newValue !== (initialValue || '')) {
          saveMutation.mutate(newValue);
        }
      }, 500);
    },
    [initialValue, saveMutation]
  );

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      debouncedSave(newValue);
    },
    [debouncedSave]
  );

  // Handle blur (immediate save)
  const handleBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (value !== (initialValue || '')) {
      saveMutation.mutate(value);
    }
  }, [value, initialValue, saveMutation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <label
          htmlFor="alt-text"
          className="text-sm font-medium text-neutral-200"
        >
          Alt Text
        </label>
        {/* Status indicator */}
        <div className="h-5">
          {saveMutation.isPending && (
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {showSaved && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </div>
      <textarea
        id="alt-text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Describe this image for accessibility..."
        rows={3}
        className="
          w-full px-3 py-2 rounded-lg
          bg-neutral-800/50 border border-white/10
          text-neutral-200 placeholder-neutral-500
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
          resize-none transition-colors
        "
      />
      <p className="mt-2 text-xs text-neutral-400">
        Alt text helps screen readers describe images to visually impaired users.
      </p>
    </div>
  );
}

export default AltTextEditor;
