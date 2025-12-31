/**
 * ContentTable Component
 *
 * Reusable data table for content lists with status badges and translation indicators.
 * Supports sorting, row selection, and action buttons.
 */
import { Link } from 'react-router-dom';
import { Edit, Archive } from 'lucide-react';
import type { ContentStatus, Language } from '@marcomarchione/shared';
import { StatusBadge } from './StatusBadge';
import { TranslationIndicator } from './TranslationIndicator';

/**
 * Base content item structure.
 */
export interface ContentItem {
  id: number;
  slug: string;
  status: ContentStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  translations: Array<{
    lang: Language;
    title: string;
  }>;
}

interface ContentTableProps<T extends ContentItem> {
  /** Array of content items to display */
  items: T[];
  /** Content type for routing (projects, materials, news) */
  contentType: 'projects' | 'materials' | 'news';
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional callback when archive is clicked */
  onArchive?: (id: number) => void;
  /** Optional additional columns to render */
  renderExtraColumns?: (item: T) => React.ReactNode;
  /** Optional extra column headers */
  extraColumnHeaders?: string[];
}

/**
 * Gets the Italian title from translations, falling back to first available.
 */
function getDisplayTitle(translations: ContentItem['translations']): string {
  const italian = translations.find((t) => t.lang === 'it');
  if (italian) return italian.title;
  const first = translations[0];
  return first?.title ?? 'Untitled';
}

/**
 * Gets the list of completed language codes from translations.
 */
function getCompletedLanguages(translations: ContentItem['translations']): Language[] {
  return translations.filter((t) => t.title).map((t) => t.lang);
}

/**
 * Formats a date string for display.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Reusable content table with sorting, status badges, and translation indicators.
 */
export function ContentTable<T extends ContentItem>({
  items,
  contentType,
  isLoading = false,
  onArchive,
  renderExtraColumns,
  extraColumnHeaders = [],
}: ContentTableProps<T>) {
  if (isLoading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto" />
        <p className="text-neutral-400 mt-4">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-neutral-400">No items found</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Translations
              </th>
              {extraColumnHeaders.map((header) => (
                <th
                  key={header}
                  className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-100">
                        {getDisplayTitle(item.translations)}
                      </p>
                      <p className="text-xs text-neutral-500">{item.slug}</p>
                    </div>
                    {item.featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-500/20 text-accent-400 border border-accent-500/30">
                        Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4">
                  <TranslationIndicator
                    completedLanguages={getCompletedLanguages(item.translations)}
                  />
                </td>
                {renderExtraColumns && (
                  <>{renderExtraColumns(item)}</>
                )}
                <td className="px-6 py-4 text-sm text-neutral-400">
                  {formatDate(item.updatedAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/${contentType}/${item.id}/edit`}
                      className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {onArchive && item.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => onArchive(item.id)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ContentTable;
