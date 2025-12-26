/**
 * useContentForm Hook
 *
 * Generic hook for managing content editor form state including
 * shared fields, translations, validation, and submission.
 */
import { useState, useCallback, useMemo } from 'react';
import type { Language, ContentStatus } from '@marcomarchione/shared';
import { LANGUAGES } from '@marcomarchione/shared';
import type { TranslationCompletionStatus, LanguageTab } from '@/types/forms';
import {
  validateSlug,
  validateUrl,
  type TranslationData,
  type TranslationsData,
} from '@/lib/validation/content';

/**
 * Shared fields present in all content types.
 */
export interface SharedFields {
  slug: string;
  status: ContentStatus;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

/**
 * Form error state.
 */
export interface FormErrors {
  [key: string]: string | undefined;
}

/**
 * Default shared fields for new content.
 */
export const DEFAULT_SHARED_FIELDS: SharedFields = {
  slug: '',
  status: 'draft',
  featured: false,
};

/**
 * Default translation for a single language.
 */
export const DEFAULT_TRANSLATION: TranslationData = {
  title: '',
  description: '',
  body: '',
  metaTitle: '',
  metaDescription: '',
};

/**
 * Default translations for all languages.
 */
export const DEFAULT_TRANSLATIONS: TranslationsData = {
  it: { ...DEFAULT_TRANSLATION },
  en: { ...DEFAULT_TRANSLATION },
  es: { ...DEFAULT_TRANSLATION },
  de: { ...DEFAULT_TRANSLATION },
};

/**
 * Hook options.
 */
export interface UseContentFormOptions<TSpecific> {
  /** Initial shared fields values */
  initialSharedFields?: Partial<SharedFields>;
  /** Initial translations values */
  initialTranslations?: Partial<TranslationsData>;
  /** Initial type-specific fields */
  initialSpecificFields?: TSpecific;
  /** Default type-specific fields */
  defaultSpecificFields: TSpecific;
  /** Validate type-specific fields */
  validateSpecificFields?: (fields: TSpecific) => FormErrors;
}

/**
 * Hook return type.
 */
export interface UseContentFormReturn<TSpecific> {
  // Shared fields
  sharedFields: SharedFields;
  setSharedField: <K extends keyof SharedFields>(key: K, value: SharedFields[K]) => void;
  updateSharedFields: (updates: Partial<SharedFields>) => void;

  // Translations
  translations: TranslationsData;
  activeTab: LanguageTab;
  setActiveTab: (tab: LanguageTab) => void;
  completionStatus: TranslationCompletionStatus;
  setTranslationField: (lang: Language, key: keyof TranslationData, value: string) => void;
  getCurrentTranslation: () => TranslationData;
  updateTranslation: (lang: Language, data: Partial<TranslationData>) => void;

  // Type-specific fields
  specificFields: TSpecific;
  setSpecificField: <K extends keyof TSpecific>(key: K, value: TSpecific[K]) => void;
  updateSpecificFields: (updates: Partial<TSpecific>) => void;

  // Validation
  errors: FormErrors;
  setError: (key: string, message: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  validateForm: () => boolean;
  hasErrors: boolean;

  // Form state
  isDirty: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  resetForm: () => void;

  // Utilities
  getFormData: () => {
    sharedFields: SharedFields;
    translations: TranslationsData;
    specificFields: TSpecific;
  };
}

/**
 * Generic content form hook.
 * Manages shared fields, translations, and type-specific fields.
 */
export function useContentForm<TSpecific extends Record<string, unknown>>(
  options: UseContentFormOptions<TSpecific>
): UseContentFormReturn<TSpecific> {
  const {
    initialSharedFields = {},
    initialTranslations = {},
    initialSpecificFields,
    defaultSpecificFields,
    validateSpecificFields,
  } = options;

  // Shared fields state
  const [sharedFields, setSharedFields] = useState<SharedFields>(() => ({
    ...DEFAULT_SHARED_FIELDS,
    ...initialSharedFields,
  }));

  // Translations state
  const [translations, setTranslations] = useState<TranslationsData>(() => ({
    it: { ...DEFAULT_TRANSLATION, ...initialTranslations.it },
    en: { ...DEFAULT_TRANSLATION, ...initialTranslations.en },
    es: { ...DEFAULT_TRANSLATION, ...initialTranslations.es },
    de: { ...DEFAULT_TRANSLATION, ...initialTranslations.de },
  }));

  // Active language tab
  const [activeTab, setActiveTab] = useState<LanguageTab>('it');

  // Type-specific fields state
  const [specificFields, setSpecificFieldsState] = useState<TSpecific>(() => ({
    ...defaultSpecificFields,
    ...initialSpecificFields,
  }));

  // Error state
  const [errors, setErrors] = useState<FormErrors>({});

  // Form metadata
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate completion status for each language
  const completionStatus: TranslationCompletionStatus = useMemo(() => ({
    it: Boolean(translations.it?.title),
    en: Boolean(translations.en?.title),
    es: Boolean(translations.es?.title),
    de: Boolean(translations.de?.title),
  }), [translations]);

  // Shared field setters
  const setSharedField = useCallback(<K extends keyof SharedFields>(
    key: K,
    value: SharedFields[K]
  ) => {
    setSharedFields((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }, []);

  const updateSharedFields = useCallback((updates: Partial<SharedFields>) => {
    setSharedFields((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // Translation setters
  const setTranslationField = useCallback((
    lang: Language,
    key: keyof TranslationData,
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [key]: value,
      },
    }));
    setIsDirty(true);
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`translations.${lang}.${key}`];
      return next;
    });
  }, []);

  const getCurrentTranslation = useCallback(() => {
    return translations[activeTab] || DEFAULT_TRANSLATION;
  }, [translations, activeTab]);

  const updateTranslation = useCallback((lang: Language, data: Partial<TranslationData>) => {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        ...data,
      },
    }));
    setIsDirty(true);
  }, []);

  // Type-specific field setters
  const setSpecificField = useCallback(<K extends keyof TSpecific>(
    key: K,
    value: TSpecific[K]
  ) => {
    setSpecificFieldsState((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }, []);

  const updateSpecificFields = useCallback((updates: Partial<TSpecific>) => {
    setSpecificFieldsState((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // Error management
  const setError = useCallback((key: string, message: string) => {
    setErrors((prev) => ({ ...prev, [key]: message }));
  }, []);

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate slug
    const slugValidation = validateSlug(sharedFields.slug);
    if (!slugValidation.valid) {
      newErrors.slug = slugValidation.error;
    }

    // Validate Italian title is required
    if (!translations.it?.title) {
      newErrors['translations.it.title'] = 'Italian title is required';
    }

    // Validate type-specific fields
    if (validateSpecificFields) {
      const specificErrors = validateSpecificFields(specificFields);
      Object.assign(newErrors, specificErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [sharedFields, translations, specificFields, validateSpecificFields]);

  // Reset form
  const resetForm = useCallback(() => {
    setSharedFields({
      ...DEFAULT_SHARED_FIELDS,
      ...initialSharedFields,
    });
    setTranslations({
      it: { ...DEFAULT_TRANSLATION, ...initialTranslations.it },
      en: { ...DEFAULT_TRANSLATION, ...initialTranslations.en },
      es: { ...DEFAULT_TRANSLATION, ...initialTranslations.es },
      de: { ...DEFAULT_TRANSLATION, ...initialTranslations.de },
    });
    setSpecificFieldsState({
      ...defaultSpecificFields,
      ...initialSpecificFields,
    });
    setErrors({});
    setIsDirty(false);
    setActiveTab('it');
  }, [initialSharedFields, initialTranslations, defaultSpecificFields, initialSpecificFields]);

  // Get all form data
  const getFormData = useCallback(() => ({
    sharedFields,
    translations,
    specificFields,
  }), [sharedFields, translations, specificFields]);

  return {
    // Shared fields
    sharedFields,
    setSharedField,
    updateSharedFields,

    // Translations
    translations,
    activeTab,
    setActiveTab,
    completionStatus,
    setTranslationField,
    getCurrentTranslation,
    updateTranslation,

    // Type-specific fields
    specificFields,
    setSpecificField,
    updateSpecificFields,

    // Validation
    errors,
    setError,
    clearError,
    clearAllErrors,
    validateForm,
    hasErrors,

    // Form state
    isDirty,
    isSubmitting,
    setIsSubmitting,
    resetForm,

    // Utilities
    getFormData,
  };
}
