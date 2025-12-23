/**
 * Content Schemas Validation Tests
 *
 * Tests for TypeBox validation schemas used in content CRUD operations.
 */
import { describe, test, expect } from 'bun:test';
import { Value } from '@sinclair/typebox/value';
import {
  ContentStatusSchema,
  MaterialCategorySchema,
  ProjectQuerySchema,
  AdminIdParamSchema,
  TranslationBodySchema,
  CreateProjectBodySchema,
  CreateTechnologyBodySchema,
  CreateTagBodySchema,
} from '../types/content-schemas';

describe('Content Schemas Validation', () => {
  describe('ContentStatusSchema', () => {
    test('validates draft, published, archived status values', () => {
      expect(Value.Check(ContentStatusSchema, 'draft')).toBe(true);
      expect(Value.Check(ContentStatusSchema, 'published')).toBe(true);
      expect(Value.Check(ContentStatusSchema, 'archived')).toBe(true);
    });

    test('rejects invalid status values', () => {
      expect(Value.Check(ContentStatusSchema, 'pending')).toBe(false);
      expect(Value.Check(ContentStatusSchema, 'active')).toBe(false);
      expect(Value.Check(ContentStatusSchema, '')).toBe(false);
      expect(Value.Check(ContentStatusSchema, 123)).toBe(false);
    });
  });

  describe('MaterialCategorySchema', () => {
    test('validates guide, template, resource, tool categories', () => {
      expect(Value.Check(MaterialCategorySchema, 'guide')).toBe(true);
      expect(Value.Check(MaterialCategorySchema, 'template')).toBe(true);
      expect(Value.Check(MaterialCategorySchema, 'resource')).toBe(true);
      expect(Value.Check(MaterialCategorySchema, 'tool')).toBe(true);
    });

    test('rejects invalid category values', () => {
      expect(Value.Check(MaterialCategorySchema, 'document')).toBe(false);
      expect(Value.Check(MaterialCategorySchema, 'other')).toBe(false);
    });
  });

  describe('ProjectQuerySchema', () => {
    test('validates technology filter parameter', () => {
      const query = {
        lang: 'it',
        limit: 10,
        offset: 0,
        technology: 'react',
      };
      expect(Value.Check(ProjectQuerySchema, query)).toBe(true);
    });

    test('accepts query without optional technology filter', () => {
      const query = {
        lang: 'en',
        limit: 20,
      };
      expect(Value.Check(ProjectQuerySchema, query)).toBe(true);
    });
  });

  describe('AdminIdParamSchema', () => {
    test('validates numeric string ID', () => {
      expect(Value.Check(AdminIdParamSchema, { id: '123' })).toBe(true);
      expect(Value.Check(AdminIdParamSchema, { id: '1' })).toBe(true);
    });

    test('rejects non-numeric ID values', () => {
      expect(Value.Check(AdminIdParamSchema, { id: 'abc' })).toBe(false);
      expect(Value.Check(AdminIdParamSchema, { id: '12a' })).toBe(false);
      expect(Value.Check(AdminIdParamSchema, { id: '' })).toBe(false);
    });
  });

  describe('TranslationBodySchema', () => {
    test('validates translation with required title field', () => {
      const translation = {
        title: 'Project Title',
        description: 'A description',
        body: 'Full content body',
      };
      expect(Value.Check(TranslationBodySchema, translation)).toBe(true);
    });

    test('validates translation with all optional fields', () => {
      const translation = {
        title: 'Title',
        description: 'Description',
        body: 'Body content',
        metaTitle: 'SEO Title',
        metaDescription: 'SEO Description',
      };
      expect(Value.Check(TranslationBodySchema, translation)).toBe(true);
    });

    test('rejects translation without title', () => {
      const translation = {
        description: 'A description',
      };
      expect(Value.Check(TranslationBodySchema, translation)).toBe(false);
    });

    test('rejects empty title', () => {
      const translation = {
        title: '',
      };
      expect(Value.Check(TranslationBodySchema, translation)).toBe(false);
    });
  });

  describe('CreateProjectBodySchema', () => {
    test('validates project with required slug', () => {
      const project = {
        slug: 'my-project',
      };
      expect(Value.Check(CreateProjectBodySchema, project)).toBe(true);
    });

    test('validates project with all optional fields', () => {
      const project = {
        slug: 'my-project',
        status: 'draft',
        featured: true,
        githubUrl: 'https://github.com/user/repo',
        demoUrl: 'https://demo.example.com',
        projectStatus: 'in-progress',
      };
      expect(Value.Check(CreateProjectBodySchema, project)).toBe(true);
    });

    test('rejects invalid slug format', () => {
      const project = {
        slug: 'Invalid Slug With Spaces',
      };
      expect(Value.Check(CreateProjectBodySchema, project)).toBe(false);
    });
  });

  describe('CreateTechnologyBodySchema', () => {
    test('validates technology with required name', () => {
      const tech = {
        name: 'React',
      };
      expect(Value.Check(CreateTechnologyBodySchema, tech)).toBe(true);
    });

    test('validates technology with optional icon and color', () => {
      const tech = {
        name: 'React',
        icon: 'react-icon',
        color: '#61dafb',
      };
      expect(Value.Check(CreateTechnologyBodySchema, tech)).toBe(true);
    });

    test('rejects invalid hex color format', () => {
      const tech = {
        name: 'React',
        color: 'blue',
      };
      expect(Value.Check(CreateTechnologyBodySchema, tech)).toBe(false);
    });
  });

  describe('CreateTagBodySchema', () => {
    test('validates tag with required name and slug', () => {
      const tag = {
        name: 'Web Development',
        slug: 'web-development',
      };
      expect(Value.Check(CreateTagBodySchema, tag)).toBe(true);
    });

    test('rejects tag without name', () => {
      const tag = {
        slug: 'web-development',
      };
      expect(Value.Check(CreateTagBodySchema, tag)).toBe(false);
    });

    test('rejects tag without slug', () => {
      const tag = {
        name: 'Web Development',
      };
      expect(Value.Check(CreateTagBodySchema, tag)).toBe(false);
    });
  });
});
