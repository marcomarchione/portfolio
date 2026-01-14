/**
 * MaterialsFilterable Component
 *
 * Complete filterable materials section with smooth transitions.
 * Handles category filter, search, sort, and pagination.
 */
import { useState, useCallback, useEffect, useTransition } from 'react';
import { CategoryFilter, type CategoryLabels } from '../filters/CategoryFilter';
import { FilterDropdown, type FilterOption } from '../ui/FilterDropdown';
import { SearchInput } from '../ui/SearchInput';

// Types
interface Material {
  id: number;
  slug: string;
  featured: boolean;
  category: string;
  downloadUrl: string;
  fileSize: number | null;
  translation?: {
    title: string;
    description: string;
  };
}

interface Pagination {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

interface MaterialsResponse {
  data: Material[];
  pagination: Pagination;
}

interface Labels {
  filterByCategory: string;
  search: string;
  searchPlaceholder: string;
  sortBy: string;
  all: string;
  categoryGuide: string;
  categoryTemplate: string;
  categoryResource: string;
  categoryTool: string;
  sortNewest: string;
  sortOldest: string;
  sortTitle: string;
  featured: string;
  noResults: string;
  previous: string;
  next: string;
  page: string;
  of: string;
}

interface MaterialsFilterableProps {
  lang: string;
  initialMaterials: Material[];
  initialPagination: Pagination | null;
  initialCategory: string;
  initialSearch: string;
  initialSort: string;
  initialPage: number;
  labels: Labels;
  apiBaseUrl: string;
}

export function MaterialsFilterable({
  lang,
  initialMaterials,
  initialPagination,
  initialCategory,
  initialSearch,
  initialSort,
  initialPage,
  labels,
  apiBaseUrl,
}: MaterialsFilterableProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [pagination, setPagination] = useState<Pagination | null>(initialPagination);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSort, setSelectedSort] = useState(initialSort || 'newest');
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const ITEMS_PER_PAGE = 9;

  // Category labels for CategoryFilter
  const categoryLabels: CategoryLabels = {
    guide: labels.categoryGuide,
    template: labels.categoryTemplate,
    resource: labels.categoryResource,
    tool: labels.categoryTool,
  };

  // Sort options
  const sortOptions: FilterOption[] = [
    { value: 'newest', label: labels.sortNewest },
    { value: 'oldest', label: labels.sortOldest },
    { value: 'title', label: labels.sortTitle },
  ];

  // Build URL for API call
  const buildApiUrl = useCallback(
    (category: string, search: string, sort: string, page: number) => {
      const params = new URLSearchParams();
      params.set('lang', lang);
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (sort && sort !== 'newest') params.set('sortBy', sort);
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('offset', String((page - 1) * ITEMS_PER_PAGE));
      return `${apiBaseUrl}/materials?${params.toString()}`;
    },
    [lang, apiBaseUrl]
  );

  // Build URL for browser history
  const buildBrowserUrl = useCallback(
    (category: string, search: string, sort: string, page: number) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (sort && sort !== 'newest') params.set('sortBy', sort);
      if (page > 1) params.set('page', String(page));
      const queryString = params.toString();
      return `/${lang}/materials/${queryString ? '?' + queryString : ''}`;
    },
    [lang]
  );

  // Fetch materials from API
  const fetchMaterials = useCallback(
    async (category: string, search: string, sort: string, page: number) => {
      setIsLoading(true);
      try {
        const url = buildApiUrl(category, search, sort, page);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const data: MaterialsResponse = await response.json();

        startTransition(() => {
          setMaterials(data.data);
          setPagination(data.pagination);
        });
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [buildApiUrl]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (category: string, search: string, sort: string, page: number) => {
      // Update URL without page reload
      const newUrl = buildBrowserUrl(category, search, sort, page);
      window.history.pushState({}, '', newUrl);

      // Fetch new data
      fetchMaterials(category, search, sort, page);
    },
    [buildBrowserUrl, fetchMaterials]
  );

  // Category filter change
  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      setCurrentPage(1);
      handleFilterChange(category, searchQuery, selectedSort, 1);
    },
    [searchQuery, selectedSort, handleFilterChange]
  );

  // Search change (debounced via SearchInput)
  const handleSearchChange = useCallback(
    (search: string) => {
      setSearchQuery(search);
      setCurrentPage(1);
      handleFilterChange(selectedCategory, search, selectedSort, 1);
    },
    [selectedCategory, selectedSort, handleFilterChange]
  );

  // Sort change
  const handleSortChange = useCallback(
    (sort: string) => {
      setSelectedSort(sort);
      setCurrentPage(1);
      handleFilterChange(selectedCategory, searchQuery, sort, 1);
    },
    [selectedCategory, searchQuery, handleFilterChange]
  );

  // Page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      handleFilterChange(selectedCategory, searchQuery, selectedSort, page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [selectedCategory, searchQuery, selectedSort, handleFilterChange]
  );

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const category = params.get('category') || '';
      const search = params.get('search') || '';
      const sort = params.get('sortBy') || 'newest';
      const page = parseInt(params.get('page') || '1', 10);

      setSelectedCategory(category);
      setSearchQuery(search);
      setSelectedSort(sort);
      setCurrentPage(page);
      fetchMaterials(category, search, sort, page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchMaterials]);

  const totalPages = pagination ? Math.ceil(pagination.total / ITEMS_PER_PAGE) : 1;

  // Category badge styling
  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'guide':
        return 'bg-blue-500/20 text-blue-400 [.light_&]:bg-blue-100 [.light_&]:text-blue-700';
      case 'template':
        return 'bg-green-500/20 text-green-400 [.light_&]:bg-green-100 [.light_&]:text-green-700';
      case 'resource':
        return 'bg-purple-500/20 text-purple-400 [.light_&]:bg-purple-100 [.light_&]:text-purple-700';
      case 'tool':
        return 'bg-orange-500/20 text-orange-400 [.light_&]:bg-orange-100 [.light_&]:text-orange-700';
      default:
        return 'bg-neutral-500/20 text-neutral-400 [.light_&]:bg-neutral-200 [.light_&]:text-neutral-600';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'guide':
        return labels.categoryGuide;
      case 'template':
        return labels.categoryTemplate;
      case 'resource':
        return labels.categoryResource;
      case 'tool':
        return labels.categoryTool;
      default:
        return category;
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="space-y-6">
        {/* Search Input */}
        <div>
          <h2 className="text-sm font-medium text-neutral-400 [.light_&]:text-neutral-600 mb-3">
            {labels.search}
          </h2>
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={labels.searchPlaceholder}
            ariaLabel={labels.search}
          />
        </div>

        {/* Category Filter */}
        <div>
          <h2 className="text-sm font-medium text-neutral-400 [.light_&]:text-neutral-600 mb-3">
            {labels.filterByCategory}
          </h2>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onFilterChange={handleCategoryChange}
            allLabel={labels.all}
            categoryLabels={categoryLabels}
          />
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

      {/* Materials Grid with smooth transition */}
      <div
        data-testid="materials-grid"
        className={`transition-opacity duration-300 ${
          isLoading || isPending ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <article
                key={material.id}
                data-testid="material-card"
                className="group bg-neutral-800/30 backdrop-blur-sm rounded-xl overflow-hidden border border-neutral-700/50 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 [.light_&]:bg-white/80 [.light_&]:border-neutral-200 [.light_&]:hover:border-terra-500 [.light_&]:hover:shadow-terra-500/10"
              >
                <a href={`/${lang}/materials/${material.slug}/`} className="block">
                  <div className="p-6">
                    {/* Featured Badge */}
                    {material.featured && (
                      <span className="inline-block mb-3 text-xs text-accent-500 [.light_&]:text-terra-600 font-semibold uppercase tracking-wider">
                        {labels.featured}
                      </span>
                    )}

                    {/* Title */}
                    <h2
                      data-testid="material-title"
                      className="font-heading text-xl font-semibold mb-2 text-white [.light_&]:text-neutral-900 group-hover:text-primary-400 [.light_&]:group-hover:text-terra-600 transition-colors"
                    >
                      {material.translation?.title ?? material.slug}
                    </h2>

                    {/* Description */}
                    {material.translation?.description && (
                      <p
                        data-testid="material-description"
                        className="text-neutral-400 [.light_&]:text-neutral-600 text-sm line-clamp-3 mb-4"
                      >
                        {material.translation.description}
                      </p>
                    )}

                    {/* Category Badge and File Size */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        data-testid="material-category"
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryClass(
                          material.category
                        )}`}
                      >
                        {getCategoryLabel(material.category)}
                      </span>
                      {material.fileSize && (
                        <span className="text-xs text-neutral-500 [.light_&]:text-neutral-400">
                          {formatFileSize(material.fileSize)}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-neutral-400 [.light_&]:text-neutral-600 text-lg">
              {labels.noResults}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          data-testid="pagination"
          className="flex items-center justify-center gap-2"
          aria-label="Pagination"
        >
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-neutral-300"
          >
            {labels.previous}
          </button>

          <span className="px-4 py-2 text-sm text-neutral-400 [.light_&]:text-neutral-600">
            {labels.page} {currentPage} {labels.of} {totalPages}
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-neutral-300"
          >
            {labels.next}
          </button>
        </nav>
      )}
    </div>
  );
}

export default MaterialsFilterable;
