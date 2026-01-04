/**
 * TechnologiesTable Component
 *
 * Displays technologies in a table with inline editing.
 * Supports CRUD operations with optimistic updates.
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { get, post, put, del } from '@/lib/api/client';
import { settingsKeys } from '@/lib/query/keys';
import { IconPicker } from '@/components/forms/IconPicker';
import { ColorPicker } from '@/components/forms/ColorPicker';
import type { ApiResponse } from '@/types/api';
import type { Technology } from '@marcomarchione/shared';
import { getIconBySlug } from '@/lib/icons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface TechnologyFormData {
  name: string;
  icon: string | null;
  color: string | null;
}

/**
 * Table for managing technologies with inline editing.
 */
export function TechnologiesTable() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Technology | null>(null);
  const [isForceDelete, setIsForceDelete] = useState(false);
  const [formData, setFormData] = useState<TechnologyFormData>({
    name: '',
    icon: null,
    color: null,
  });

  const queryClient = useQueryClient();

  // Fetch technologies
  const { data: response, isLoading, error } = useQuery({
    queryKey: settingsKeys.technologies(),
    queryFn: () => get<ApiResponse<Technology[]>>('/admin/technologies'),
  });

  const technologies = response?.data ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TechnologyFormData) =>
      post<ApiResponse<Technology>>('/admin/technologies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.technologies() });
      setIsCreating(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TechnologyFormData }) =>
      put<ApiResponse<Technology>>(`/admin/technologies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.technologies() });
      setEditingId(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: number; force: boolean }) =>
      del<ApiResponse<{ message: string }>>(`/admin/technologies/${id}${force ? '?force=true' : ''}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.technologies() });
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
    setFormData({ name: '', icon: null, color: null });
  }, []);

  const handleStartEdit = useCallback((tech: Technology) => {
    setEditingId(tech.id);
    setFormData({
      name: tech.name,
      icon: tech.icon,
      color: tech.color?.replace('#', '') ?? null,
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

  const handleSave = useCallback(() => {
    if (!formData.name.trim()) return;

    // Prepare color with # prefix if present
    const colorValue = formData.color ? (formData.color.startsWith('#') ? formData.color : `#${formData.color}`) : null;

    if (isCreating) {
      createMutation.mutate({
        ...formData,
        color: colorValue,
      });
    } else if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        data: {
          ...formData,
          color: colorValue,
        },
      });
    }
  }, [formData, isCreating, editingId, createMutation, updateMutation]);

  const handleDelete = useCallback((tech: Technology) => {
    setDeleteTarget(tech);
    setIsForceDelete(false);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate({ id: deleteTarget.id, force: isForceDelete });
    }
  }, [deleteTarget, isForceDelete, deleteMutation]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Render icon preview
  const renderIcon = (iconSlug: string | null) => {
    if (!iconSlug) return null;
    const icon = getIconBySlug(iconSlug);
    if (!icon) return null;
    return (
      <div
        className="w-5 h-5"
        dangerouslySetInnerHTML={{
          __html: `<svg role="img" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${icon.path}"/></svg>`,
        }}
      />
    );
  };

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
        Failed to load technologies. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">Technologies</h3>
          <p className="text-sm text-neutral-500">{technologies.length} technologies</p>
        </div>
        <button
          type="button"
          onClick={handleStartCreate}
          disabled={isCreating || editingId !== null}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Technology
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Icon
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Color
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
                  <IconPicker
                    label=""
                    value={formData.icon}
                    onChange={(v) => setFormData((prev) => ({ ...prev, icon: v }))}
                    placeholder="Select icon"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Technology name"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-600 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                    autoFocus
                  />
                </td>
                <td className="px-4 py-3">
                  <ColorPicker
                    label=""
                    value={formData.color}
                    onChange={(v) => setFormData((prev) => ({ ...prev, color: v }))}
                    iconSlug={formData.icon}
                    placeholder="Color"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!formData.name.trim() || isPending}
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
            {technologies.map((tech) => (
              <tr key={tech.id} className="hover:bg-neutral-800/30 transition-colors">
                {editingId === tech.id ? (
                  <>
                    <td className="px-4 py-3">
                      <IconPicker
                        label=""
                        value={formData.icon}
                        onChange={(v) => setFormData((prev) => ({ ...prev, icon: v }))}
                        placeholder="Select icon"
                      />
                    </td>
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
                      <ColorPicker
                        label=""
                        value={formData.color}
                        onChange={(v) => setFormData((prev) => ({ ...prev, color: v }))}
                        iconSlug={formData.icon}
                        placeholder="Color"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={!formData.name.trim() || isPending}
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
                      <div className="text-neutral-300">
                        {renderIcon(tech.icon)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-neutral-200 font-medium">{tech.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      {tech.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded border border-neutral-600"
                            style={{ backgroundColor: tech.color }}
                          />
                          <span className="text-sm text-neutral-400 font-mono">{tech.color}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tech)}
                          disabled={editingId !== null || isCreating}
                          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tech)}
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
            {technologies.length === 0 && !isCreating && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-neutral-500">
                  No technologies yet. Click "Add Technology" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={isForceDelete ? 'Force Delete Technology?' : 'Delete Technology?'}
        message={
          isForceDelete ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">This technology is used by projects</span>
              </div>
              <p>
                Are you sure you want to delete "{deleteTarget?.name}"? This will also remove it from all projects that use it.
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

export default TechnologiesTable;
