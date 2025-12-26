/**
 * Material Form Page
 *
 * Create or edit a material with full editing capabilities including:
 * - Shared fields (slug, status, featured)
 * - Material-specific fields (category, downloadUrl, fileSize)
 * - Media picker integration for download URL
 * - Multilingual translations with markdown editor
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ArrowLeft, Download, FileText, HardDrive, FolderOpen } from 'lucide-react';
import { Page } from '@/components/common/Page';
import {
  LanguageTabs,
  MarkdownEditor,
  PublishToggle,
  MediaPicker,
  SlugInput,
  ToggleField,
  FormField,
} from '@/components/forms';
import type { SelectedMedia } from '@/components/forms';
import { useContentForm } from '@/hooks/useContentForm';
import { get, put, patch } from '@/lib/api/client';
import { materialKeys } from '@/lib/query/keys';
import { showSuccess, showApiError } from '@/components/common/Toast';
import { validateUrl } from '@/lib/validation/content';
import type { Material, ContentStatus, Language, MaterialCategory } from '@marcomarchione/shared';
import { LANGUAGES, MATERIAL_CATEGORIES } from '@marcomarchione/shared';
import type { ApiResponse } from '@/types/api';

/**
 * Material-specific fields.
 */
interface MaterialSpecificFields {
  category: MaterialCategory;
  downloadUrl: string;
  fileSize: number | null;
}

const DEFAULT_MATERIAL_FIELDS: MaterialSpecificFields = {
  category: 'resource',
  downloadUrl: '',
  fileSize: null,
};

/**
 * Category labels for dropdown.
 */
const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  'guide': 'Guide',
  'template': 'Template',
  'resource': 'Resource',
  'tool': 'Tool',
};

/**
 * Validates material-specific fields.
 */
function validateMaterialFields(fields: MaterialSpecificFields): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate download URL is required
  if (!fields.downloadUrl) {
    errors.downloadUrl = 'Download URL is required';
  } else {
    const result = validateUrl(fields.downloadUrl);
    if (!result.valid) {
      errors.downloadUrl = result.error || 'Invalid URL';
    }
  }

  return errors;
}

/**
 * Formats file size for display.
 */
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MaterialFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  // Media picker state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Fetch existing material data if editing
  const { data: materialResponse, isLoading: isLoadingMaterial } = useQuery({
    queryKey: materialKeys.detail(id || ''),
    queryFn: () => get<ApiResponse<Material>>(`/admin/materials/${id}`),
    enabled: isEditing,
  });

  const material = materialResponse?.data;

  // Transform API translations to form format
  const initialTranslations = material?.translations?.reduce((acc, t) => {
    acc[t.lang] = {
      title: t.title || '',
      description: t.description || '',
      body: t.body || '',
      metaTitle: t.metaTitle || '',
      metaDescription: t.metaDescription || '',
    };
    return acc;
  }, {} as Record<Language, { title: string; description: string; body: string; metaTitle: string; metaDescription: string }>);

  // Initialize form with material data or defaults
  const form = useContentForm<MaterialSpecificFields>({
    defaultSpecificFields: DEFAULT_MATERIAL_FIELDS,
    initialSharedFields: material ? {
      slug: material.slug,
      status: material.status,
      featured: material.featured,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
      publishedAt: material.publishedAt,
    } : undefined,
    initialTranslations,
    initialSpecificFields: material ? {
      category: material.category,
      downloadUrl: material.downloadUrl,
      fileSize: material.fileSize,
    } : undefined,
    validateSpecificFields: validateMaterialFields,
  });

  // Update mutation for shared + material fields
  const updateMaterialMutation = useMutation({
    mutationFn: (data: {
      slug: string;
      status?: ContentStatus;
      featured?: boolean;
      category?: MaterialCategory;
      downloadUrl?: string;
      fileSize?: number | null;
    }) => put<ApiResponse<Material>>(`/admin/materials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });

  // Update translation mutation
  const updateTranslationMutation = useMutation({
    mutationFn: ({ lang, data }: {
      lang: Language;
      data: {
        title: string;
        description?: string | null;
        body?: string | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
      };
    }) => put<ApiResponse<unknown>>(`/admin/materials/${id}/translations/${lang}`, data),
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: ContentStatus) =>
      patch<ApiResponse<Material>>(`/admin/materials/${id}/publish`, { status }),
    onSuccess: (response) => {
      if (response.data) {
        form.updateSharedFields({
          status: response.data.status,
          publishedAt: response.data.publishedAt,
        });
      }
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });

  // Handle media selection
  const handleMediaSelect = (media: SelectedMedia) => {
    form.setSpecificField('downloadUrl', media.url);
    setIsMediaPickerOpen(false);
  };

  // Handle save
  const handleSave = async () => {
    if (!form.validateForm()) {
      showApiError(new Error('Please fix validation errors'));
      return;
    }

    form.setIsSubmitting(true);

    try {
      // 1. Update shared + material fields
      await updateMaterialMutation.mutateAsync({
        slug: form.sharedFields.slug,
        featured: form.sharedFields.featured,
        category: form.specificFields.category,
        downloadUrl: form.specificFields.downloadUrl,
        fileSize: form.specificFields.fileSize,
      });

      // 2. Update translations
      const translationPromises = LANGUAGES.map(async (lang) => {
        const translation = form.translations[lang];
        if (translation?.title) {
          await updateTranslationMutation.mutateAsync({
            lang,
            data: {
              title: translation.title,
              description: translation.description || null,
              body: translation.body || null,
              metaTitle: translation.metaTitle || null,
              metaDescription: translation.metaDescription || null,
            },
          });
        }
      });

      await Promise.all(translationPromises);

      showSuccess('Material saved successfully');
      queryClient.invalidateQueries({ queryKey: materialKeys.detail(id || '') });
    } catch (error) {
      showApiError(error);
    } finally {
      form.setIsSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: ContentStatus) => {
    try {
      await updateStatusMutation.mutateAsync(newStatus);
      showSuccess(`Material ${newStatus === 'published' ? 'published' : newStatus === 'archived' ? 'archived' : 'unpublished'} successfully`);
    } catch (error) {
      showApiError(error);
    }
  };

  // Loading state
  if (isEditing && isLoadingMaterial) {
    return (
      <Page title="Loading..." subtitle="Fetching material data">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Page>
    );
  }

  // Not found state
  if (isEditing && !material && !isLoadingMaterial) {
    return (
      <Page title="Material Not Found" subtitle="The requested material could not be found">
        <div className="text-center py-12">
          <button
            onClick={() => navigate('/materials')}
            className="text-primary-400 hover:text-primary-300"
          >
            Return to Materials
          </button>
        </div>
      </Page>
    );
  }

  const currentTranslation = form.getCurrentTranslation();

  return (
    <Page
      title={isEditing ? 'Edit Material' : 'New Material'}
      subtitle={isEditing ? `Editing: ${material?.translations?.[0]?.title || material?.slug}` : 'Create a new learning material'}
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/materials')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-300 hover:text-neutral-100 hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={form.isSubmitting || !form.isDirty}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {form.isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Status and Publish Toggle */}
        {isEditing && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-semibold text-neutral-100 mb-4">
              Publication Status
            </h2>
            <PublishToggle
              status={form.sharedFields.status}
              onStatusChange={handleStatusChange}
              isLoading={updateStatusMutation.isPending}
            />
            {form.sharedFields.publishedAt && (
              <p className="text-sm text-neutral-500 mt-3">
                First published: {new Date(form.sharedFields.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Shared Fields */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-display font-semibold text-neutral-100 mb-4">
            Basic Information
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <SlugInput
              value={form.sharedFields.slug}
              onChange={(value) => form.setSharedField('slug', value)}
              error={form.errors.slug}
            />

            <div className="flex items-end pb-1.5">
              <ToggleField
                id="featured"
                checked={form.sharedFields.featured}
                onChange={(checked) => form.setSharedField('featured', checked)}
                label="Featured Material"
                description="Highlight this material on the resources page"
              />
            </div>
          </div>

          {isEditing && form.sharedFields.createdAt && (
            <div className="grid gap-4 md:grid-cols-2 mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-neutral-500">
                Created: {new Date(form.sharedFields.createdAt).toLocaleString()}
              </p>
              {form.sharedFields.updatedAt && (
                <p className="text-sm text-neutral-500">
                  Updated: {new Date(form.sharedFields.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Material-Specific Fields */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-display font-semibold text-neutral-100 mb-4">
            Material Details
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category */}
            <FormField
              label="Category"
              htmlFor="category"
              required
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <FolderOpen className="w-4 h-4" />
                </span>
                <select
                  id="category"
                  value={form.specificFields.category}
                  onChange={(e) => form.setSpecificField('category', e.target.value as MaterialCategory)}
                  className="w-full px-4 py-2 pl-10 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* File Size */}
            <FormField
              label="File Size (bytes)"
              htmlFor="fileSize"
              helpText={form.specificFields.fileSize ? `Display: ${formatFileSize(form.specificFields.fileSize)}` : 'Optional'}
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <HardDrive className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  id="fileSize"
                  value={form.specificFields.fileSize || ''}
                  onChange={(e) => form.setSpecificField('fileSize', e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder="e.g., 1048576 (1 MB)"
                  min={0}
                  className="w-full px-4 py-2 pl-10 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </div>
            </FormField>

            {/* Download URL */}
            <div className="md:col-span-2">
              <FormField
                label="Download URL"
                htmlFor="downloadUrl"
                error={form.errors.downloadUrl}
                required
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      <Download className="w-4 h-4" />
                    </span>
                    <input
                      type="url"
                      id="downloadUrl"
                      value={form.specificFields.downloadUrl}
                      onChange={(e) => form.setSpecificField('downloadUrl', e.target.value)}
                      placeholder="https://example.com/file.pdf"
                      className={`
                        w-full px-4 py-2 pl-10 rounded-lg
                        bg-neutral-800/50 border text-neutral-200 placeholder-neutral-500
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                        ${form.errors.downloadUrl ? 'border-red-500/50' : 'border-neutral-700'}
                      `}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:text-neutral-100 hover:bg-white/10 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Browse Media
                  </button>
                </div>
              </FormField>
            </div>
          </div>
        </div>

        {/* Translations */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-neutral-100">
              Content & Translations
            </h2>
            <LanguageTabs
              activeTab={form.activeTab}
              onChange={form.setActiveTab}
              completionStatus={form.completionStatus}
            />
          </div>

          <div className="space-y-6">
            <FormField
              label="Title"
              htmlFor={`title-${form.activeTab}`}
              error={form.errors[`translations.${form.activeTab}.title`]}
              required={form.activeTab === 'it'}
            >
              <input
                type="text"
                id={`title-${form.activeTab}`}
                value={currentTranslation.title || ''}
                onChange={(e) => form.setTranslationField(form.activeTab, 'title', e.target.value)}
                placeholder={form.activeTab === 'it' ? 'Material title (required)' : 'Material title (optional)'}
                className={`
                  w-full px-4 py-2 rounded-lg
                  bg-neutral-800/50 border text-neutral-200 placeholder-neutral-500
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                  ${form.errors[`translations.${form.activeTab}.title`] ? 'border-red-500/50' : 'border-neutral-700'}
                `}
              />
            </FormField>

            <FormField
              label="Description"
              htmlFor={`description-${form.activeTab}`}
              helpText="Short description for listings and previews"
            >
              <textarea
                id={`description-${form.activeTab}`}
                value={currentTranslation.description || ''}
                onChange={(e) => form.setTranslationField(form.activeTab, 'description', e.target.value)}
                placeholder="Brief material description..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 resize-y"
              />
            </FormField>

            <FormField
              label="Body"
              htmlFor={`body-${form.activeTab}`}
              helpText="Full material description in markdown format"
            >
              <MarkdownEditor
                value={currentTranslation.body || ''}
                onChange={(value) => form.setTranslationField(form.activeTab, 'body', value)}
                placeholder="Write detailed material description..."
                minHeight={400}
              />
            </FormField>

            {/* SEO Fields */}
            <div className="pt-6 border-t border-white/10 space-y-6">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                SEO Settings
              </h3>

              <FormField
                label="Meta Title"
                htmlFor={`metaTitle-${form.activeTab}`}
                helpText="Title for search engines (50-60 characters recommended)"
              >
                <input
                  type="text"
                  id={`metaTitle-${form.activeTab}`}
                  value={currentTranslation.metaTitle || ''}
                  onChange={(e) => form.setTranslationField(form.activeTab, 'metaTitle', e.target.value)}
                  placeholder="SEO title..."
                  maxLength={70}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </FormField>

              <FormField
                label="Meta Description"
                htmlFor={`metaDescription-${form.activeTab}`}
                helpText="Description for search engines (150-160 characters recommended)"
              >
                <textarea
                  id={`metaDescription-${form.activeTab}`}
                  value={currentTranslation.metaDescription || ''}
                  onChange={(e) => form.setTranslationField(form.activeTab, 'metaDescription', e.target.value)}
                  placeholder="SEO description..."
                  rows={2}
                  maxLength={170}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 resize-y"
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </Page>
  );
}
