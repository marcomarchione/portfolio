/**
 * NewsFilterable Component
 *
 * Complete filterable news section with smooth transitions.
 * Handles tag filter, sort, and "Load More" pagination.
 */
import { useState, useCallback, useEffect, useTransition } from 'react';
import { FilterDropdown, type FilterOption } from '../ui/FilterDropdown';
import { calculateReadingTime } from '../../lib/utils/readingTime';

// Types
interface NewsArticle {
  id: number;
  slug: string;
  featured: boolean;
  publishedAt: string;
  coverImage: string | null;
  translation?: {
    title: string;
    description: string;
    body: string;
  };
  tags: {
    id: number;
    slug: string;
    name: string;
  }[];
}

interface Pagination {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

interface NewsResponse {
  data: NewsArticle[];
  pagination: Pagination;
}

interface Labels {
  title: string;
  filterByTag: string;
  sortBy: string;
  sortNewest: string;
  sortOldest: string;
  sortTitle: string;
  loadMore: string;
  noResults: string;
  all: string;
  readingTime: string;
  featured: string;
}

interface NewsFilterableProps {
  lang: string;
  initialNews: NewsArticle[];
  initialPagination: Pagination | null;
  initialTag: string;
  initialSort: string;
  labels: Labels;
  apiBaseUrl: string;
}

export function NewsFilterable({
  lang,
  initialNews,
  initialPagination,
  initialTag,
  initialSort,
  labels,
  apiBaseUrl,
}: NewsFilterableProps) {
  const [news, setNews] = useState<NewsArticle[]>(initialNews);
  const [pagination, setPagination] = useState<Pagination | null>(initialPagination);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedSort, setSelectedSort] = useState(initialSort || 'newest');
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasFetchedInitial, setHasFetchedInitial] = useState(initialNews.length > 0);

  const ITEMS_PER_LOAD = 10;

  // Extract unique tags from loaded news articles
  const allTags = news.reduce((acc, article) => {
    article.tags.forEach(tag => {
      if (!acc.find(t => t.slug === tag.slug)) {
        acc.push(tag);
      }
    });
    return acc;
  }, [] as { slug: string; name: string }[]);

  // Sort options
  const sortOptions: FilterOption[] = [
    { value: 'newest', label: labels.sortNewest },
    { value: 'oldest', label: labels.sortOldest },
    { value: 'title', label: labels.sortTitle },
  ];

  // Build URL for API call
  const buildApiUrl = useCallback(
    (tag: string, sort: string, offset: number, isLoadMore: boolean = false) => {
      const params = new URLSearchParams();
      params.set('lang', lang);
      if (tag) params.set('tag', tag);
      if (sort && sort !== 'newest') params.set('sortBy', sort);
      params.set('limit', String(ITEMS_PER_LOAD));
      params.set('offset', String(offset));
      return `${apiBaseUrl}/news?${params.toString()}`;
    },
    [lang, apiBaseUrl]
  );

  // Build URL for browser history
  const buildBrowserUrl = useCallback(
    (tag: string, sort: string) => {
      const params = new URLSearchParams();
      if (tag) params.set('tag', tag);
      if (sort && sort !== 'newest') params.set('sortBy', sort);
      const queryString = params.toString();
      return `/${lang}/news/${queryString ? '?' + queryString : ''}`;
    },
    [lang]
  );

  // Fetch news from API
  const fetchNews = useCallback(
    async (tag: string, sort: string, offset: number, isLoadMore: boolean = false) => {
      setIsLoading(true);
      try {
        const url = buildApiUrl(tag, sort, offset, isLoadMore);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const data: NewsResponse = await response.json();

        startTransition(() => {
          if (isLoadMore) {
            // Append new items to existing list
            setNews(prev => [...prev, ...data.data]);
          } else {
            // Replace list with new data
            setNews(data.data);
          }
          setPagination(data.pagination);
        });
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [buildApiUrl]
  );

  // Fetch initial data if SSR failed to provide it
  useEffect(() => {
    if (!hasFetchedInitial && news.length === 0) {
      setHasFetchedInitial(true);
      fetchNews(selectedTag, selectedSort, 0, false);
    }
  }, [hasFetchedInitial, news.length, selectedTag, selectedSort, fetchNews]);

  // Handle filter changes (resets to offset 0)
  const handleFilterChange = useCallback(
    (tag: string, sort: string) => {
      // Update URL without page reload
      const newUrl = buildBrowserUrl(tag, sort);
      window.history.pushState({}, '', newUrl);

      // Reset offset and fetch new data
      setCurrentOffset(0);
      fetchNews(tag, sort, 0, false);
    },
    [buildBrowserUrl, fetchNews]
  );

  // Tag filter change
  const handleTagChange = useCallback(
    (tag: string) => {
      setSelectedTag(tag);
      handleFilterChange(tag, selectedSort);
    },
    [selectedSort, handleFilterChange]
  );

  // Sort change
  const handleSortChange = useCallback(
    (sort: string) => {
      setSelectedSort(sort);
      handleFilterChange(selectedTag, sort);
    },
    [selectedTag, handleFilterChange]
  );

  // Load More button click
  const handleLoadMore = useCallback(() => {
    const newOffset = currentOffset + ITEMS_PER_LOAD;
    setCurrentOffset(newOffset);
    fetchNews(selectedTag, selectedSort, newOffset, true);
  }, [currentOffset, selectedTag, selectedSort, fetchNews]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tag = params.get('tag') || '';
      const sort = params.get('sortBy') || 'newest';

      setSelectedTag(tag);
      setSelectedSort(sort);
      setCurrentOffset(0);
      fetchNews(tag, sort, 0, false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchNews]);

  // Format publication date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Show relative time for recent articles (within 7 days)
    if (diffDays <= 7) {
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    }

    // Otherwise show formatted date
    return date.toLocaleDateString(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="space-y-6">
        {/* Tag Filter */}
        <div>
          <h2 className="text-sm font-medium text-neutral-400 [.light_&]:text-neutral-600 mb-3">
            {labels.filterByTag}
          </h2>
          <div data-testid="tag-filter" className="flex flex-wrap gap-2">
            {/* "All" pill */}
            <button
              type="button"
              data-testid="tag-all"
              onClick={() => handleTagChange('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedTag === ''
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 [.light_&]:!bg-terra-500 [.light_&]:!shadow-terra-500/25'
                  : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-cream-300'
              }`}
            >
              {labels.all}
            </button>

            {/* Tag pills */}
            {allTags.map((tag) => (
              <button
                key={tag.slug}
                type="button"
                data-testid={`tag-${tag.slug}`}
                onClick={() => handleTagChange(tag.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTag === tag.slug
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 [.light_&]:!bg-terra-500 [.light_&]:!shadow-terra-500/25'
                    : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-cream-300'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Filter */}
        <div className="flex flex-wrap gap-4">
          <FilterDropdown
            label={labels.sortBy}
            options={sortOptions}
            value={selectedSort}
            onChange={handleSortChange}
          />
        </div>
      </div>

      {/* News List with smooth transition */}
      <div
        data-testid="news-list"
        className={`transition-opacity duration-300 ${
          isLoading || isPending ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {news.length > 0 ? (
          <div className="space-y-6">
            {news.map((article) => {
              const readingTime = calculateReadingTime(article.translation?.body);
              const readingTimeText = labels.readingTime.replace('{minutes}', String(readingTime));

              return (
                <article
                  key={article.id}
                  data-testid="news-card"
                  className="group bg-neutral-800/30 backdrop-blur-sm rounded-xl overflow-hidden border border-neutral-700/50 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 [.light_&]:bg-white/80 [.light_&]:border-neutral-200 [.light_&]:hover:border-terra-500 [.light_&]:hover:shadow-terra-500/10"
                >
                  <a href={`/${lang}/news/${article.slug}/`} className="block">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Cover Image or Fallback */}
                      <div className="md:w-64 md:flex-shrink-0">
                        {article.coverImage ? (
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={article.coverImage}
                              alt={article.translation?.title || article.slug}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-full aspect-video flex items-center justify-center bg-neutral-800 text-neutral-400 border border-neutral-700/50 [.light_&]:bg-neutral-200 [.light_&]:text-neutral-600 [.light_&]:border-neutral-300"
                            role="img"
                            aria-label="Default cover image"
                          >
                            <span className="font-heading font-bold text-4xl select-none">
                              MM
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        {/* Featured Badge */}
                        {article.featured && (
                          <span className="inline-block mb-3 text-xs text-accent-500 [.light_&]:text-terra-600 font-semibold uppercase tracking-wider">
                            {labels.featured}
                          </span>
                        )}

                        {/* Title */}
                        <h2
                          data-testid="news-title"
                          className="font-heading text-2xl font-semibold mb-3 text-white [.light_&]:text-neutral-900 group-hover:text-primary-400 [.light_&]:group-hover:text-terra-600 transition-colors line-clamp-2"
                        >
                          {article.translation?.title ?? article.slug}
                        </h2>

                        {/* Description */}
                        {article.translation?.description && (
                          <p
                            data-testid="news-description"
                            className="text-neutral-400 [.light_&]:text-neutral-600 text-base line-clamp-3 mb-4"
                          >
                            {article.translation.description}
                          </p>
                        )}

                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <span className="text-sm text-neutral-500 [.light_&]:text-neutral-400">
                            {formatDate(article.publishedAt)}
                          </span>
                          <span className="text-sm text-neutral-500 [.light_&]:text-neutral-400">
                            •
                          </span>
                          <span
                            data-testid="reading-time"
                            className="text-sm text-neutral-500 [.light_&]:text-neutral-400"
                          >
                            {readingTimeText}
                          </span>
                        </div>

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {article.tags.slice(0, 3).map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleTagChange(tag.slug);
                                }}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-colors [.light_&]:bg-terra-100 [.light_&]:text-terra-700 [.light_&]:border-terra-200 [.light_&]:hover:bg-terra-200"
                              >
                                {tag.name}
                              </button>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-xs text-neutral-500 [.light_&]:text-neutral-400">
                                +{article.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-neutral-400 [.light_&]:text-neutral-600 text-lg">
              {labels.noResults}
            </p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {pagination && pagination.hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            data-testid="load-more"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-8 py-3 rounded-lg text-base font-medium bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-neutral-300 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {labels.loadMore}
              </span>
            ) : (
              labels.loadMore
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default NewsFilterable;
