/**
 * Tests for Materials API Client
 *
 * These tests verify that:
 * 1. getMaterials includes search parameter in URL when provided
 * 2. getMaterials includes sortBy parameter in URL when provided
 * 3. Parameter combinations generate correct query strings
 */

import { describe, test, expect, mock } from 'bun:test';
import { getMaterials } from './materials';

describe('Materials API Client', () => {
  describe('Test 1: search parameter is included in URL', () => {
    test('includes search parameter when provided', async () => {
      // Mock the global fetch
      const fetchMock = mock(async (url: string) => {
        return new Response(JSON.stringify({ data: [], pagination: { total: 0, limit: 10, offset: 0 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      global.fetch = fetchMock as any;

      await getMaterials('it', { search: 'template guide' });

      expect(fetchMock).toHaveBeenCalled();
      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('search=template+guide');
      expect(callUrl).toContain('lang=it');
    });

    test('does not include search parameter when not provided', async () => {
      const fetchMock = mock(async (url: string) => {
        return new Response(JSON.stringify({ data: [], pagination: { total: 0, limit: 10, offset: 0 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      global.fetch = fetchMock as any;

      await getMaterials('en', {});

      expect(fetchMock).toHaveBeenCalled();
      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).not.toContain('search=');
      expect(callUrl).toContain('lang=en');
    });
  });

  describe('Test 2: sortBy parameter is included in URL', () => {
    test('includes sortBy parameter when provided', async () => {
      const fetchMock = mock(async (url: string) => {
        return new Response(JSON.stringify({ data: [], pagination: { total: 0, limit: 10, offset: 0 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      global.fetch = fetchMock as any;

      await getMaterials('es', { sortBy: 'title' });

      expect(fetchMock).toHaveBeenCalled();
      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('sortBy=title');
      expect(callUrl).toContain('lang=es');
    });

    test('supports all sortBy options (newest, oldest, title)', async () => {
      const fetchMock = mock(async (url: string) => {
        return new Response(JSON.stringify({ data: [], pagination: { total: 0, limit: 10, offset: 0 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      global.fetch = fetchMock as any;

      // Test 'newest'
      await getMaterials('de', { sortBy: 'newest' });
      expect(fetchMock.mock.calls[0][0]).toContain('sortBy=newest');

      // Test 'oldest'
      await getMaterials('de', { sortBy: 'oldest' });
      expect(fetchMock.mock.calls[1][0]).toContain('sortBy=oldest');

      // Test 'title'
      await getMaterials('de', { sortBy: 'title' });
      expect(fetchMock.mock.calls[2][0]).toContain('sortBy=title');
    });
  });

  describe('Test 3: parameter combinations generate correct query strings', () => {
    test('combines category, search, and sortBy parameters', async () => {
      const fetchMock = mock(async (url: string) => {
        return new Response(JSON.stringify({ data: [], pagination: { total: 0, limit: 10, offset: 0 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      global.fetch = fetchMock as any;

      await getMaterials('it', {
        category: 'guide',
        search: 'typescript',
        sortBy: 'newest',
        limit: 9,
        offset: 18,
      });

      expect(fetchMock).toHaveBeenCalled();
      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('lang=it');
      expect(callUrl).toContain('category=guide');
      expect(callUrl).toContain('search=typescript');
      expect(callUrl).toContain('sortBy=newest');
      expect(callUrl).toContain('limit=9');
      expect(callUrl).toContain('offset=18');
    });

    test('handles pagination with search and sort', async () => {
      const fetchMock = mock(async (url: string) => {
        return new Response(JSON.stringify({ data: [], pagination: { total: 0, limit: 10, offset: 0 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      global.fetch = fetchMock as any;

      await getMaterials('en', {
        search: 'pdf template',
        sortBy: 'title',
        limit: 9,
        offset: 0,
      });

      expect(fetchMock).toHaveBeenCalled();
      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('search=pdf+template');
      expect(callUrl).toContain('sortBy=title');
      expect(callUrl).toContain('limit=9');
      expect(callUrl).toContain('offset=0');
    });
  });
});
