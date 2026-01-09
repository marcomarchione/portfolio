/**
 * ProjectsFilterable Component
 *
 * Complete filterable projects section with smooth transitions.
 * Handles technology filter, status filter, sort, and pagination.
 */
import { useState, useCallback, useEffect, useTransition } from 'react';
import { TechnologyFilter, type Technology } from '../filters/TechnologyFilter';
import { FilterDropdown, type FilterOption } from '../ui/FilterDropdown';

// Types
interface Project {
  id: number;
  slug: string;
  featured: boolean;
  projectStatus: string;
  translation?: {
    title: string;
    description: string;
  };
  technologies?: Technology[];
}

interface Pagination {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

interface ProjectsResponse {
  data: Project[];
  pagination: Pagination;
}

interface Labels {
  filterByTechnology: string;
  filterByStatus: string;
  sortBy: string;
  all: string;
  statusInProgress: string;
  statusCompleted: string;
  statusArchived: string;
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

interface ProjectsFilterableProps {
  lang: string;
  technologies: Technology[];
  initialProjects: Project[];
  initialPagination: Pagination | null;
  initialTechnology: string;
  initialStatus: string;
  initialSort: string;
  initialPage: number;
  labels: Labels;
  apiBaseUrl: string;
}

export function ProjectsFilterable({
  lang,
  technologies,
  initialProjects,
  initialPagination,
  initialTechnology,
  initialStatus,
  initialSort,
  initialPage,
  labels,
  apiBaseUrl,
}: ProjectsFilterableProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [pagination, setPagination] = useState<Pagination | null>(initialPagination);
  const [selectedTech, setSelectedTech] = useState(initialTechnology);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedSort, setSelectedSort] = useState(initialSort || 'newest');
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const ITEMS_PER_PAGE = 9;

  // Status options
  const statusOptions: FilterOption[] = [
    { value: '', label: labels.all },
    { value: 'in-progress', label: labels.statusInProgress },
    { value: 'completed', label: labels.statusCompleted },
    { value: 'archived', label: labels.statusArchived },
  ];

  // Sort options
  const sortOptions: FilterOption[] = [
    { value: 'newest', label: labels.sortNewest },
    { value: 'oldest', label: labels.sortOldest },
    { value: 'title', label: labels.sortTitle },
  ];

  // Build URL for API call
  const buildApiUrl = useCallback((tech: string, status: string, sort: string, page: number) => {
    const params = new URLSearchParams();
    params.set('lang', lang);
    if (tech) params.set('technology', tech);
    if (status) params.set('projectStatus', status);
    if (sort && sort !== 'newest') params.set('sortBy', sort);
    params.set('limit', String(ITEMS_PER_PAGE));
    params.set('offset', String((page - 1) * ITEMS_PER_PAGE));
    return `${apiBaseUrl}/projects?${params.toString()}`;
  }, [lang, apiBaseUrl]);

  // Build URL for browser history
  const buildBrowserUrl = useCallback((tech: string, status: string, sort: string, page: number) => {
    const params = new URLSearchParams();
    if (tech) params.set('technology', tech);
    if (status) params.set('status', status);
    if (sort && sort !== 'newest') params.set('sortBy', sort);
    if (page > 1) params.set('page', String(page));
    const queryString = params.toString();
    return `/${lang}/projects/${queryString ? '?' + queryString : ''}`;
  }, [lang]);

  // Fetch projects from API
  const fetchProjects = useCallback(async (tech: string, status: string, sort: string, page: number) => {
    setIsLoading(true);
    try {
      const url = buildApiUrl(tech, status, sort, page);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const data: ProjectsResponse = await response.json();

      startTransition(() => {
        setProjects(data.data);
        setPagination(data.pagination);
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [buildApiUrl]);

  // Handle filter changes
  const handleFilterChange = useCallback((tech: string, status: string, sort: string, page: number) => {
    // Update URL without page reload
    const newUrl = buildBrowserUrl(tech, status, sort, page);
    window.history.pushState({}, '', newUrl);

    // Fetch new data
    fetchProjects(tech, status, sort, page);
  }, [buildBrowserUrl, fetchProjects]);

  // Technology filter change
  const handleTechChange = useCallback((tech: string) => {
    setSelectedTech(tech);
    setCurrentPage(1);
    handleFilterChange(tech, selectedStatus, selectedSort, 1);
  }, [selectedStatus, selectedSort, handleFilterChange]);

  // Status filter change
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    handleFilterChange(selectedTech, status, selectedSort, 1);
  }, [selectedTech, selectedSort, handleFilterChange]);

  // Sort change
  const handleSortChange = useCallback((sort: string) => {
    setSelectedSort(sort);
    setCurrentPage(1);
    handleFilterChange(selectedTech, selectedStatus, sort, 1);
  }, [selectedTech, selectedStatus, handleFilterChange]);

  // Page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    handleFilterChange(selectedTech, selectedStatus, selectedSort, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedTech, selectedStatus, selectedSort, handleFilterChange]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tech = params.get('technology') || '';
      const status = params.get('status') || '';
      const sort = params.get('sortBy') || 'newest';
      const page = parseInt(params.get('page') || '1', 10);

      setSelectedTech(tech);
      setSelectedStatus(status);
      setSelectedSort(sort);
      setCurrentPage(page);
      fetchProjects(tech, status, sort, page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchProjects]);

  const totalPages = pagination ? Math.ceil(pagination.total / ITEMS_PER_PAGE) : 1;

  // Status badge styling
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 [.light_&]:bg-green-100 [.light_&]:text-green-700';
      case 'in-progress':
        return 'bg-yellow-500/20 text-yellow-400 [.light_&]:bg-yellow-100 [.light_&]:text-yellow-700';
      default:
        return 'bg-neutral-500/20 text-neutral-400 [.light_&]:bg-neutral-200 [.light_&]:text-neutral-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return labels.statusCompleted;
      case 'in-progress': return labels.statusInProgress;
      case 'archived': return labels.statusArchived;
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="space-y-6">
        {/* Technology Filter */}
        <div>
          <h2 className="text-sm font-medium text-neutral-400 [.light_&]:text-neutral-600 mb-3">
            {labels.filterByTechnology}
          </h2>
          <TechnologyFilter
            technologies={technologies}
            selectedTechnology={selectedTech}
            onFilterChange={handleTechChange}
            allLabel={labels.all}
          />
        </div>

        {/* Status and Sort Filters */}
        <div className="flex flex-wrap gap-4">
          <FilterDropdown
            label={labels.filterByStatus}
            options={statusOptions}
            value={selectedStatus}
            onChange={handleStatusChange}
          />
          <FilterDropdown
            label={labels.sortBy}
            options={sortOptions}
            value={selectedSort}
            onChange={handleSortChange}
          />
        </div>
      </div>

      {/* Projects Grid with smooth transition */}
      <div
        className={`transition-opacity duration-300 ${isLoading || isPending ? 'opacity-50' : 'opacity-100'}`}
      >
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <article
                key={project.id}
                className="group bg-neutral-800/30 backdrop-blur-sm rounded-xl overflow-hidden border border-neutral-700/50 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 [.light_&]:bg-white/80 [.light_&]:border-neutral-200 [.light_&]:hover:border-terra-500 [.light_&]:hover:shadow-terra-500/10"
              >
                <a href={`/${lang}/projects/${project.slug}/`} className="block">
                  <div className="p-6">
                    {/* Featured Badge */}
                    {project.featured && (
                      <span className="inline-block mb-3 text-xs text-accent-500 [.light_&]:text-terra-600 font-semibold uppercase tracking-wider">
                        {labels.featured}
                      </span>
                    )}

                    {/* Title */}
                    <h2 className="font-heading text-xl font-semibold mb-2 text-white [.light_&]:text-neutral-900 group-hover:text-primary-400 [.light_&]:group-hover:text-terra-600 transition-colors">
                      {project.translation?.title ?? project.slug}
                    </h2>

                    {/* Description */}
                    {project.translation?.description && (
                      <p className="text-neutral-400 [.light_&]:text-neutral-600 text-sm line-clamp-3 mb-4">
                        {project.translation.description}
                      </p>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(project.projectStatus)}`}>
                        {getStatusLabel(project.projectStatus)}
                      </span>
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
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
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

export default ProjectsFilterable;
