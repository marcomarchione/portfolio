/**
 * TagsTable Component
 *
 * Displays tags in a table with inline editing.
 * Supports CRUD operations with optimistic updates.
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { get, post, put, del } from '@/lib/api/client';
import { settingsKeys } from '@/lib/query/keys';
import type { ApiResponse } from '@/types/api';
import type { Tag } from '@marcomarchione/shared';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface TagFormData {
  name: string;
  slug: string;
}

/**
 * Generates a slug from a name string.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Table for managing tags with inline editing.
 */
export function TagsTable() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [isForceDelete, setIsForceDelete] = useState(false);
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    slug: '',
  });

  const queryClient = useQueryClient();

  // Fetch tags
  const { data: response, isLoading, error } = useQuery({
    queryKey: settingsKeys.tags(),
    queryFn: () => get<ApiResponse<Tag[]>>('/admin/tags'),
  });

  const tags = response?.data ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TagFormData) =>
      post<ApiResponse<Tag>>('/admin/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tags() });
      setIsCreating(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TagFormData }) =>
      put<ApiResponse<Tag>>(`/admin/tags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tags() });
      setEditingId(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: number; force: boolean }) =>
      del<ApiResponse<{ message: string }>>(`/admin/tags/${id}${force ? '?force=true' : ''}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tags() });
      setDeleteTarget(null);
      setIsForceDelete(false);
    },
    onError: (err: Error & { status?: number }) => {
      // If conflict error and not force, offer force delete
      if (err.status === 409 && !isForceDelete) {
        setIsForceDelete(true);
      } else {
        setDeleteTarget(null);
        setIsForceDelete(false);
      }
    },
  });

  const resetForm = useCallback(() => {
    setFormData({ name: '', slug: '' });
  }, []);

  const handleStartEdit = useCallback((tag: Tag) => {
    setEditingId(tag.id);
    setFormData({
      name: tag.name,
      slug: tag.slug,
    });
    setIsCreating(false);
  }, []);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
    setEditingId(null);
    resetForm();
  }, [resetForm]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  }, [resetForm]);

  const handleNameChange = useCallback((name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug from name if creating new
      slug: isCreating ? generateSlug(name) : prev.slug,
    }));
  }, [isCreating]);

  const handleSave = useCallback(() => {
    if (!formData.name.trim() || !formData.slug.trim()) return;

    if (isCreating) {
      createMutation.mutate(formData);
    } else if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        data: formData,
      });
    }
  }, [formData, isCreating, editingId, createMutation, updateMutation]);

  const handleDelete = useCallback((tag: Tag) => {
    setDeleteTarget(tag);
    setIsForceDelete(false);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate({ id: deleteTarget.id, force: isForceDelete });
    }
  }, [deleteTarget, isForceDelete, deleteMutation]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        Failed to load tags. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">Tags</h3>
          <p className="text-sm text-neutral-500">{tags.length} tags</p>
        </div>
        <button
          type="button"
          onClick={handleStartCreate}
          disabled={isCreating || editingId !== null}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {/* Create row */}
            {isCreating && (
              <tr className="bg-neutral-800/30">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Tag name"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-600 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                    autoFocus
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="tag-slug"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-600 text-neutral-200 placeholder-neutral-500 font-mono focus:outline-none focus:border-primary-500"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!formData.name.trim() || !formData.slug.trim() || isPending}
                      className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isPending}
                      className="p-2 rounded-lg bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Existing rows */}
            {tags.map((tag) => (
              <tr key={tag.id} className="hover:bg-neutral-800/30 transition-colors">
                {editingId === tag.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-600 text-neutral-200 focus:outline-none focus:border-primary-500"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-600 text-neutral-200 font-mono focus:outline-none focus:border-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={!formData.name.trim() || !formData.slug.trim() || isPending}
                          className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={isPending}
                          className="p-2 rounded-lg bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <span className="text-neutral-200 font-medium">{tag.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-400 font-mono">{tag.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tag)}
                          disabled={editingId !== null || isCreating}
                          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tag)}
                          disabled={editingId !== null || isCreating}
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Empty state */}
            {tags.length === 0 && !isCreating && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-neutral-500">
                  No tags yet. Click "Add Tag" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={isForceDelete ? 'Force Delete Tag?' : 'Delete Tag?'}
        message={
          isForceDelete ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">This tag is used by news items</span>
              </div>
              <p>
                Are you sure you want to delete "{deleteTarget?.name}"? This will also remove it from all news items that use it.
              </p>
            </div>
          ) : (
            `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
          )
        }
        confirmLabel={isForceDelete ? 'Force Delete' : 'Delete'}
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setIsForceDelete(false);
        }}
      />
    </div>
  );
}

export default TagsTable;
