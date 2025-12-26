/**
 * useContentForm Hook Tests
 *
 * Tests for the content form state management hook.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContentForm, DEFAULT_SHARED_FIELDS, DEFAULT_TRANSLATION } from './useContentForm';

// Default specific fields for testing
const defaultProjectFields = {
  githubUrl: '',
  demoUrl: '',
  projectStatus: 'in-progress' as const,
  startDate: null,
  endDate: null,
  technologyIds: [] as number[],
};

describe('useContentForm', () => {
  it('initializes with default values when no initial data provided', () => {
    const { result } = renderHook(() =>
      useContentForm({
        defaultSpecificFields: defaultProjectFields,
      })
    );

    // Check shared fields
    expect(result.current.sharedFields.slug).toBe('');
    expect(result.current.sharedFields.status).toBe('draft');
    expect(result.current.sharedFields.featured).toBe(false);

    // Check translations
    expect(result.current.translations.it.title).toBe('');
    expect(result.current.translations.en.title).toBe('');

    // Check specific fields
    expect(result.current.specificFields.githubUrl).toBe('');
    expect(result.current.specificFields.projectStatus).toBe('in-progress');

    // Check initial state
    expect(result.current.activeTab).toBe('it');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.hasErrors).toBe(false);
  });

  it('validates form and catches required field errors', () => {
    const { result } = renderHook(() =>
      useContentForm({
        defaultSpecificFields: defaultProjectFields,
      })
    );

    // Validate form without any data
    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm();
    });

    // Should fail validation
    expect(isValid!).toBe(false);
    expect(result.current.hasErrors).toBe(true);
    expect(result.current.errors['slug']).toBe('Slug is required');
    expect(result.current.errors['translations.it.title']).toBe('Italian title is required');
  });

  it('formats data correctly for API submission', () => {
    const { result } = renderHook(() =>
      useContentForm({
        defaultSpecificFields: defaultProjectFields,
        initialSharedFields: {
          slug: 'test-project',
          status: 'draft',
          featured: true,
        },
        initialTranslations: {
          it: { title: 'Progetto Test', description: 'Descrizione' },
          en: { title: 'Test Project', description: 'Description' },
        },
        initialSpecificFields: {
          githubUrl: 'https://github.com/test',
          technologyIds: [1, 2],
        },
      })
    );

    const formData = result.current.getFormData();

    // Verify shared fields
    expect(formData.sharedFields.slug).toBe('test-project');
    expect(formData.sharedFields.status).toBe('draft');
    expect(formData.sharedFields.featured).toBe(true);

    // Verify translations
    expect(formData.translations.it.title).toBe('Progetto Test');
    expect(formData.translations.en.title).toBe('Test Project');

    // Verify specific fields
    expect(formData.specificFields.githubUrl).toBe('https://github.com/test');
    expect(formData.specificFields.technologyIds).toEqual([1, 2]);
  });
});
