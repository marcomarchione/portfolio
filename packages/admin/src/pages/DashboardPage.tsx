/**
 * Dashboard Page
 *
 * Main dashboard with content statistics and recent activity.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderOpen, FileText, Newspaper, ArrowRight } from 'lucide-react';
import { Page } from '@/components/common/Page';
import { StatsCard, StatusBadge } from '@/components/dashboard';
import { get } from '@/lib/api/client';
import { dashboardKeys } from '@/lib/query/keys';
import type { ContentStatus, ContentType } from '@marcomarchione/shared';

/** Statistics response from API */
interface DashboardStats {
  projects: { type: string; total: number; draft: number; published: number; archived: number };
  materials: { type: string; total: number; draft: number; published: number; archived: number };
  news: { type: string; total: number; draft: number; published: number; archived: number };
}

/** Recent item from API */
interface RecentItem {
  id: number;
  type: ContentType;
  slug: string;
  status: ContentStatus;
  featured: boolean;
  title: string | null;
  updatedAt: string;
}

/** Maps content type to route */
const TYPE_ROUTES: Record<ContentType, string> = {
  project: '/projects',
  material: '/materials',
  news: '/news',
};

/** Maps content type to icon */
const TYPE_ICONS: Record<ContentType, React.FC<{ className?: string }>> = {
  project: FolderOpen,
  material: FileText,
  news: Newspaper,
};

/**
 * Formats a date string for display.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Status breakdown for a content type.
 */
function StatusBreakdown({
  draft,
  published,
  archived,
}: {
  draft: number;
  published: number;
  archived: number;
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-neutral-400">
          {draft} draft{draft !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-neutral-400">
          {published} published
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-neutral-500" />
        <span className="text-neutral-400">
          {archived} archived
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Fetch statistics
  const statsQuery = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const response = await get<{ data: DashboardStats }>(
        '/admin/dashboard/stats'
      );
      return response.data;
    },
  });

  // Fetch recent items
  const recentQuery = useQuery({
    queryKey: dashboardKeys.recent(10),
    queryFn: async () => {
      const response = await get<{ data: RecentItem[] }>(
        '/admin/dashboard/recent?limit=10'
      );
      return response.data;
    },
  });

  const isLoading = statsQuery.isLoading || recentQuery.isLoading;

  return (
    <Page title="Dashboard" subtitle="Overview of your content and activity">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          label="Total Projects"
          value={isLoading ? '...' : statsQuery.data?.projects.total ?? 0}
          icon={FolderOpen}
        >
          {statsQuery.data && (
            <StatusBreakdown
              draft={statsQuery.data.projects.draft}
              published={statsQuery.data.projects.published}
              archived={statsQuery.data.projects.archived}
            />
          )}
        </StatsCard>

        <StatsCard
          label="Total Materials"
          value={isLoading ? '...' : statsQuery.data?.materials.total ?? 0}
          icon={FileText}
        >
          {statsQuery.data && (
            <StatusBreakdown
              draft={statsQuery.data.materials.draft}
              published={statsQuery.data.materials.published}
              archived={statsQuery.data.materials.archived}
            />
          )}
        </StatsCard>

        <StatsCard
          label="Total News"
          value={isLoading ? '...' : statsQuery.data?.news.total ?? 0}
          icon={Newspaper}
        >
          {statsQuery.data && (
            <StatusBreakdown
              draft={statsQuery.data.news.draft}
              published={statsQuery.data.news.published}
              archived={statsQuery.data.news.archived}
            />
          )}
        </StatsCard>
      </div>

      {/* Recent Activity */}
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-neutral-100">Recent Activity</h2>
          <p className="text-sm text-neutral-400">Latest content updates</p>
        </div>

        {recentQuery.isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto" />
            <p className="text-neutral-400 mt-4">Loading recent items...</p>
          </div>
        ) : recentQuery.data?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-400">No content yet. Start creating!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {recentQuery.data?.map((item) => {
              const Icon = TYPE_ICONS[item.type];
              const route = TYPE_ROUTES[item.type];

              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={`${route}/${item.id}/edit`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-neutral-800/50">
                    <Icon className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100 truncate">
                      {item.title ?? item.slug}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {item.type} - {formatDate(item.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                  <ArrowRight className="w-4 h-4 text-neutral-500" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}
