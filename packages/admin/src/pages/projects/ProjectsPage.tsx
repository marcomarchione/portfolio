/**
 * Projects Page
 *
 * Projects list with management options (placeholder).
 */
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Page, ComingSoon } from '@/components/common/Page';
import { ROUTES } from '@/routes';

export default function ProjectsPage() {
  return (
    <Page
      title="Projects"
      subtitle="Manage your portfolio projects"
      actions={
        <Link
          to={ROUTES.PROJECTS_NEW}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-ring"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      }
    >
      <ComingSoon description="Project management will be available soon. You will be able to create, edit, and organize your portfolio projects." />
    </Page>
  );
}
