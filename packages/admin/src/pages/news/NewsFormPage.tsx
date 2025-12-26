/**
 * News Form Page
 *
 * Create or edit a news article with full editing capabilities including:
 * - Shared fields (slug, status, featured)
 * - News-specific fields (coverImage, readingTime)
 * - Tags selector
 * - Cover image picker with preview
 * - Multilingual translations with markdown editor
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ArrowLeft, Clock, Image as ImageIcon, X } from 'lucide-react';
import { Page } from '@/components/common/Page';
import {
  LanguageTabs,
  MarkdownEditor,
  PublishToggle,
  ItemSelector,
  MediaPicker,
  SlugInput,
  ToggleField,
  FormField,
} from '@/components/forms';
import type { SelectedMedia } from '@/components/forms';
import { useContentForm } from '@/hooks/useContentForm';
import { get, put, post, patch } from '@/lib/api/client';
import { newsKeys, settingsKeys } from '@/lib/query/keys';
import { showSuccess, showApiError } from '@/components/common/Toast';
import type { News, ContentStatus, Language } from '@marcomarchione/shared';
import { LANGUAGES } from '@marcomarchione/shared';
import type { ApiResponse } from '@/types/api';

/**
 * News-specific fields.
 */
interface NewsSpecificFields {
  coverImage: string | null;
  readingTime: number | null;
  tagIds: number[];
}

const DEFAULT_NEWS_FIELDS: NewsSpecificFields = {
  coverImage: null,
  readingTime: null,
  tagIds: [],
};

/**
 * Calculates reading time based on word count.
 * Assumes average reading speed of 200 words per minute.
 */
function calculateReadingTime(text: string): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}

export default function NewsFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  // Media picker state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Auto-calculate reading time flag
  const [autoCalculateReadingTime, setAutoCalculateReadingTime] = useState(true);

  // Fetch existing news data if editing
  const { data: newsResponse, isLoading: isLoadingNews } = useQuery({
    queryKey: newsKeys.detail(id || ''),
    queryFn: () => get<ApiResponse<News>>(`/admin/news/${id}`),
    enabled: isEditing,
  });

  const news = newsResponse?.data;

  // Transform API translations to form format
  const initialTranslations = news?.translations?.reduce((acc, t) => {
    acc[t.lang] = {
      title: t.title || '',
      description: t.description || '',
      body: t.body || '',
      metaTitle: t.metaTitle || '',
      metaDescription: t.metaDescription || '',
    };
    return acc;
  }, {} as Record<Language, { title: string; description: string; body: string; metaTitle: string; metaDescription: string }>);

  // Initialize form with news data or defaults
  const form = useContentForm<NewsSpecificFields>({
    defaultSpecificFields: DEFAULT_NEWS_FIELDS,
    initialSharedFields: news ? {
      slug: news.slug,
      status: news.status,
      featured: news.featured,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      publishedAt: news.publishedAt,
    } : undefined,
    initialTranslations,
    initialSpecificFields: news ? {
      coverImage: news.coverImage,
      readingTime: news.readingTime,
      tagIds: news.tags?.map(t => t.id) || [],
    } : undefined,
  });

  // Auto-calculate reading time when Italian body changes
  useEffect(() => {
    if (autoCalculateReadingTime && form.translations.it?.body) {
      const calculatedTime = calculateReadingTime(form.translations.it.body);
      if (calculatedTime !== form.specificFields.readingTime) {
        form.setSpecificField('readingTime', calculatedTime);
      }
    }
  }, [form.translations.it?.body, autoCalculateReadingTime]);

  // Update mutation for shared + news fields
  const updateNewsMutation = useMutation({
    mutationFn: (data: {
      slug: string;
      status?: ContentStatus;
      featured?: boolean;
      coverImage?: string | null;
      readingTime?: number | null;
    }) => put<ApiResponse<News>>(`/admin/news/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
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
    }) => put<ApiResponse<unknown>>(`/admin/news/${id}/translations/${lang}`, data),
  });

  // Assign tags mutation
  const assignTagsMutation = useMutation({
    mutationFn: (tagIds: number[]) =>
      post<ApiResponse<News>>(`/admin/news/${id}/tags`, { tagIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.detail(id || '') });
      queryClient.invalidateQueries({ queryKey: settingsKeys.tags() });
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: ContentStatus) =>
      patch<ApiResponse<News>>(`/admin/news/${id}/publish`, { status }),
    onSuccess: (response) => {
      if (response.data) {
        form.updateSharedFields({
          status: response.data.status,
          publishedAt: response.data.publishedAt,
        });
      }
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
    },
  });

  // Handle cover image selection
  const handleCoverImageSelect = (media: SelectedMedia) => {
    form.setSpecificField('coverImage', media.url);
    setIsMediaPickerOpen(false);
  };

  // Handle cover image removal
  const handleRemoveCoverImage = () => {
    form.setSpecificField('coverImage', null);
  };

  // Handle reading time change
  const handleReadingTimeChange = (value: string) => {
    setAutoCalculateReadingTime(false);
    form.setSpecificField('readingTime', value ? parseInt(value, 10) : null);
  };

  // Handle save
  const handleSave = async () => {
    if (!form.validateForm()) {
      showApiError(new Error('Please fix validation errors'));
      return;
    }

    form.setIsSubmitting(true);

    try {
      // 1. Update shared + news fields
      await updateNewsMutation.mutateAsync({
        slug: form.sharedFields.slug,
        featured: form.sharedFields.featured,
        coverImage: form.specificFields.coverImage,
        readingTime: form.specificFields.readingTime,
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

      // 3. Update tags
      await assignTagsMutation.mutateAsync(form.specificFields.tagIds);

      showSuccess('Article saved successfully');
      queryClient.invalidateQueries({ queryKey: newsKeys.detail(id || '') });
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
      showSuccess(`Article ${newStatus === 'published' ? 'published' : newStatus === 'archived' ? 'archived' : 'unpublished'} successfully`);
    } catch (error) {
      showApiError(error);
    }
  };

  // Loading state
  if (isEditing && isLoadingNews) {
    return (
      <Page title="Loading..." subtitle="Fetching article data">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Page>
    );
  }

  // Not found state
  if (isEditing && !news && !isLoadingNews) {
    return (
      <Page title="Article Not Found" subtitle="The requested article could not be found">
        <div className="text-center py-12">
          <button
            onClick={() => navigate('/news')}
            className="text-primary-400 hover:text-primary-300"
          >
            Return to News
          </button>
        </div>
      </Page>
    );
  }

  const currentTranslation = form.getCurrentTranslation();

  return (
    <Page
      title={isEditing ? 'Edit Article' : 'New Article'}
      subtitle={isEditing ? `Editing: ${news?.translations?.[0]?.title || news?.slug}` : 'Create a new news article'}
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/news')}
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
                label="Featured Article"
                description="Highlight this article on the blog homepage"
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

        {/* News-Specific Fields */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-display font-semibold text-neutral-100 mb-4">
            Article Details
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cover Image */}
            <div className="md:col-span-2">
              <FormField
                label="Cover Image"
                htmlFor="coverImage"
              >
                {form.specificFields.coverImage ? (
                  <div className="relative w-full max-w-md">
                    <img
                      src={form.specificFields.coverImage}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg border border-white/10"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="p-2 rounded-lg bg-neutral-900/80 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        className="p-2 rounded-lg bg-neutral-900/80 text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="flex items-center justify-center gap-3 w-full max-w-md h-48 rounded-lg border-2 border-dashed border-neutral-700 hover:border-primary-500/50 text-neutral-400 hover:text-neutral-300 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span>Select Cover Image</span>
                  </button>
                )}
              </FormField>
            </div>

            {/* Reading Time */}
            <FormField
              label="Reading Time (minutes)"
              htmlFor="readingTime"
              helpText={autoCalculateReadingTime ? 'Auto-calculated from Italian body' : 'Manual override'}
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <Clock className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  id="readingTime"
                  value={form.specificFields.readingTime || ''}
                  onChange={(e) => handleReadingTimeChange(e.target.value)}
                  placeholder="e.g., 5"
                  min={1}
                  className="w-full px-4 py-2 pl-10 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Tags */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-display font-semibold text-neutral-100 mb-4">
            Tags
          </h2>
          <ItemSelector
            type="tag"
            label="Article Tags"
            selectedIds={form.specificFields.tagIds}
            onChange={(ids) => form.setSpecificField('tagIds', ids)}
          />
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
                placeholder={form.activeTab === 'it' ? 'Article title (required)' : 'Article title (optional)'}
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
                placeholder="Brief article description..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 resize-y"
              />
            </FormField>

            <FormField
              label="Body"
              htmlFor={`body-${form.activeTab}`}
              helpText="Full article content in markdown format"
            >
              <MarkdownEditor
                value={currentTranslation.body || ''}
                onChange={(value) => form.setTranslationField(form.activeTab, 'body', value)}
                placeholder="Write your article..."
                minHeight={500}
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
        onSelect={handleCoverImageSelect}
        mimeTypeFilter="image/*"
      />
    </Page>
  );
}
