/**
 * Project Form Page
 *
 * Create or edit a project with full editing capabilities including:
 * - Shared fields (slug, status, featured)
 * - Project-specific fields (GitHub URL, Demo URL, project status, dates)
 * - Technologies selector
 * - Multilingual translations with markdown editor
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ArrowLeft, ExternalLink, Github } from 'lucide-react';
import { Page } from '@/components/common/Page';
import {
  LanguageTabs,
  MarkdownEditor,
  PublishToggle,
  ItemSelector,
  SlugInput,
  ToggleField,
  FormField,
  SelectField,
  DateField,
} from '@/components/forms';
import { useContentForm } from '@/hooks/useContentForm';
import { get, put, post, patch } from '@/lib/api/client';
import { projectKeys, settingsKeys } from '@/lib/query/keys';
import { showSuccess, showApiError } from '@/components/common/Toast';
import { validateUrl } from '@/lib/validation/content';
import type { Project, ContentStatus, Language, ProjectStatus as ProjectStatusType } from '@marcomarchione/shared';
import { LANGUAGES, PROJECT_STATUSES } from '@marcomarchione/shared';
import type { ApiResponse } from '@/types/api';

/**
 * Project-specific fields.
 */
interface ProjectSpecificFields {
  githubUrl: string | null;
  demoUrl: string | null;
  projectStatus: ProjectStatusType;
  startDate: string | null;
  endDate: string | null;
  technologyIds: number[];
}

const DEFAULT_PROJECT_FIELDS: ProjectSpecificFields = {
  githubUrl: null,
  demoUrl: null,
  projectStatus: 'in-progress',
  startDate: null,
  endDate: null,
  technologyIds: [],
};

/**
 * Project status labels for dropdown.
 */
const PROJECT_STATUS_LABELS: Record<ProjectStatusType, string> = {
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'archived': 'Archived',
};

/**
 * Project status options for SelectField.
 */
const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status],
}));

/**
 * Validates project-specific fields.
 */
function validateProjectFields(fields: ProjectSpecificFields): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate GitHub URL if provided
  if (fields.githubUrl) {
    const result = validateUrl(fields.githubUrl);
    if (!result.valid) {
      errors.githubUrl = result.error || 'Invalid URL';
    }
  }

  // Validate Demo URL if provided
  if (fields.demoUrl) {
    const result = validateUrl(fields.demoUrl);
    if (!result.valid) {
      errors.demoUrl = result.error || 'Invalid URL';
    }
  }

  return errors;
}

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  // Fetch existing project data if editing
  const { data: projectResponse, isLoading: isLoadingProject } = useQuery({
    queryKey: projectKeys.detail(id || ''),
    queryFn: () => get<ApiResponse<Project>>(`/admin/projects/${id}`),
    enabled: isEditing,
  });

  const project = projectResponse?.data;

  // Transform API translations to form format
  const initialTranslations = project?.translations?.reduce((acc, t) => {
    acc[t.lang] = {
      title: t.title || '',
      description: t.description || '',
      body: t.body || '',
      metaTitle: t.metaTitle || '',
      metaDescription: t.metaDescription || '',
    };
    return acc;
  }, {} as Record<Language, { title: string; description: string; body: string; metaTitle: string; metaDescription: string }>);

  // Initialize form with project data or defaults
  const form = useContentForm<ProjectSpecificFields>({
    defaultSpecificFields: DEFAULT_PROJECT_FIELDS,
    initialSharedFields: project ? {
      slug: project.slug,
      status: project.status,
      featured: project.featured,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      publishedAt: project.publishedAt,
    } : undefined,
    initialTranslations,
    initialSpecificFields: project ? {
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      projectStatus: project.projectStatus,
      startDate: project.startDate,
      endDate: project.endDate,
      technologyIds: project.technologies?.map(t => t.id) || [],
    } : undefined,
    validateSpecificFields: validateProjectFields,
  });

  // Update mutation for shared + project fields
  const updateProjectMutation = useMutation({
    mutationFn: (data: {
      slug: string;
      status?: ContentStatus;
      featured?: boolean;
      githubUrl?: string | null;
      demoUrl?: string | null;
      projectStatus?: ProjectStatusType;
      startDate?: string | null;
      endDate?: string | null;
    }) => put<ApiResponse<Project>>(`/admin/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
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
    }) => put<ApiResponse<unknown>>(`/admin/projects/${id}/translations/${lang}`, data),
  });

  // Assign technologies mutation
  const assignTechnologiesMutation = useMutation({
    mutationFn: (technologyIds: number[]) =>
      post<ApiResponse<Project>>(`/admin/projects/${id}/technologies`, { technologyIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id || '') });
      queryClient.invalidateQueries({ queryKey: settingsKeys.technologies() });
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: ContentStatus) =>
      patch<ApiResponse<Project>>(`/admin/projects/${id}/publish`, { status }),
    onSuccess: (response) => {
      // Update form state with new status
      if (response.data) {
        form.updateSharedFields({
          status: response.data.status,
          publishedAt: response.data.publishedAt,
        });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });

  // Handle save
  const handleSave = async () => {
    // Validate form
    if (!form.validateForm()) {
      showApiError(new Error('Please fix validation errors'));
      return;
    }

    form.setIsSubmitting(true);

    try {
      // 1. Update shared + project fields
      await updateProjectMutation.mutateAsync({
        slug: form.sharedFields.slug,
        featured: form.sharedFields.featured,
        githubUrl: form.specificFields.githubUrl,
        demoUrl: form.specificFields.demoUrl,
        projectStatus: form.specificFields.projectStatus,
        startDate: form.specificFields.startDate,
        endDate: form.specificFields.endDate,
      });

      // 2. Update translations for each language that has content
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

      // 3. Update technologies
      await assignTechnologiesMutation.mutateAsync(form.specificFields.technologyIds);

      showSuccess('Project saved successfully');
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id || '') });
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
      showSuccess(`Project ${newStatus === 'published' ? 'published' : newStatus === 'archived' ? 'archived' : 'unpublished'} successfully`);
    } catch (error) {
      showApiError(error);
    }
  };

  // Loading state
  if (isEditing && isLoadingProject) {
    return (
      <Page title="Loading..." subtitle="Fetching project data">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Page>
    );
  }

  // Not found state
  if (isEditing && !project && !isLoadingProject) {
    return (
      <Page title="Project Not Found" subtitle="The requested project could not be found">
        <div className="text-center py-12">
          <button
            onClick={() => navigate('/projects')}
            className="text-primary-400 hover:text-primary-300"
          >
            Return to Projects
          </button>
        </div>
      </Page>
    );
  }

  const currentTranslation = form.getCurrentTranslation();

  return (
    <Page
      title={isEditing ? 'Edit Project' : 'New Project'}
      subtitle={isEditing ? `Editing: ${project?.translations?.[0]?.title || project?.slug}` : 'Create a new portfolio project'}
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
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
            {/* Slug */}
            <SlugInput
              value={form.sharedFields.slug}
              onChange={(value) => form.setSharedField('slug', value)}
              error={form.errors.slug}
              disabled={!isEditing ? false : undefined}
            />

            {/* Featured */}
            <div className="flex items-end pb-1.5">
              <ToggleField
                id="featured"
                checked={form.sharedFields.featured}
                onChange={(checked) => form.setSharedField('featured', checked)}
                label="Featured Project"
                description="Highlight this project on the homepage"
              />
            </div>
          </div>

          {/* Timestamps (read-only) */}
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

        {/* Project-Specific Fields */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-display font-semibold text-neutral-100 mb-4">
            Project Details
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* GitHub URL */}
            <FormField
              label="GitHub URL"
              htmlFor="githubUrl"
              error={form.errors.githubUrl}
              helpText="Link to the source code repository"
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <Github className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  id="githubUrl"
                  value={form.specificFields.githubUrl || ''}
                  onChange={(e) => form.setSpecificField('githubUrl', e.target.value || null)}
                  placeholder="https://github.com/username/repo"
                  className={`
                    w-full px-4 py-2 pl-10 rounded-lg
                    bg-neutral-800/50 border text-neutral-200 placeholder-neutral-500
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                    ${form.errors.githubUrl ? 'border-red-500/50' : 'border-neutral-700'}
                  `}
                />
              </div>
            </FormField>

            {/* Demo URL */}
            <FormField
              label="Demo URL"
              htmlFor="demoUrl"
              error={form.errors.demoUrl}
              helpText="Link to the live demo or website"
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  id="demoUrl"
                  value={form.specificFields.demoUrl || ''}
                  onChange={(e) => form.setSpecificField('demoUrl', e.target.value || null)}
                  placeholder="https://example.com"
                  className={`
                    w-full px-4 py-2 pl-10 rounded-lg
                    bg-neutral-800/50 border text-neutral-200 placeholder-neutral-500
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                    ${form.errors.demoUrl ? 'border-red-500/50' : 'border-neutral-700'}
                  `}
                />
              </div>
            </FormField>

            {/* Project Status */}
            <SelectField
              id="projectStatus"
              label="Project Status"
              options={PROJECT_STATUS_OPTIONS}
              value={form.specificFields.projectStatus}
              onChange={(value) => form.setSpecificField('projectStatus', value as ProjectStatusType)}
            />

            {/* Start Date */}
            <DateField
              id="startDate"
              label="Start Date"
              value={form.specificFields.startDate}
              onChange={(value) => form.setSpecificField('startDate', value)}
              placeholder="dd/mm/yyyy"
            />

            {/* End Date */}
            <DateField
              id="endDate"
              label="End Date"
              value={form.specificFields.endDate}
              onChange={(value) => form.setSpecificField('endDate', value)}
              placeholder="dd/mm/yyyy"
              minDate={form.specificFields.startDate || undefined}
            />
          </div>
        </div>

        {/* Technologies */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-display font-semibold text-neutral-100 mb-4">
            Technologies
          </h2>
          <ItemSelector
            type="technology"
            label="Project Technologies"
            selectedIds={form.specificFields.technologyIds}
            onChange={(ids) => form.setSpecificField('technologyIds', ids)}
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
            {/* Title */}
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
                placeholder={form.activeTab === 'it' ? 'Project title (required)' : 'Project title (optional)'}
                className={`
                  w-full px-4 py-2 rounded-lg
                  bg-neutral-800/50 border text-neutral-200 placeholder-neutral-500
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                  ${form.errors[`translations.${form.activeTab}.title`] ? 'border-red-500/50' : 'border-neutral-700'}
                `}
              />
            </FormField>

            {/* Description */}
            <FormField
              label="Description"
              htmlFor={`description-${form.activeTab}`}
              helpText="Short description for listings and previews"
            >
              <textarea
                id={`description-${form.activeTab}`}
                value={currentTranslation.description || ''}
                onChange={(e) => form.setTranslationField(form.activeTab, 'description', e.target.value)}
                placeholder="Brief project description..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 resize-y"
              />
            </FormField>

            {/* Body (Markdown) */}
            <FormField
              label="Body"
              htmlFor={`body-${form.activeTab}`}
              helpText="Full project description in markdown format"
            >
              <MarkdownEditor
                value={currentTranslation.body || ''}
                onChange={(value) => form.setTranslationField(form.activeTab, 'body', value)}
                placeholder="Write detailed project description..."
                minHeight={400}
              />
            </FormField>

            {/* SEO Fields */}
            <div className="pt-6 border-t border-white/10 space-y-6">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                SEO Settings
              </h3>

              {/* Meta Title */}
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

              {/* Meta Description */}
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
    </Page>
  );
}
