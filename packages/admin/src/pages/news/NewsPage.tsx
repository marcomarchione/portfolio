/**
 * News Page
 *
 * News list with management options (placeholder).
 */
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Page, ComingSoon } from '@/components/common/Page';
import { ROUTES } from '@/routes';

export default function NewsPage() {
  return (
    <Page
      title="News"
      subtitle="Manage news articles and announcements"
      actions={
        <Link
          to={ROUTES.NEWS_NEW}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-ring"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Link>
      }
    >
      <ComingSoon description="News management will be available soon. You will be able to create, edit, and publish news articles." />
    </Page>
  );
}
