/**
 * Project Form Page
 *
 * Create or edit a project (placeholder).
 */
import { useParams } from 'react-router-dom';
import { Page, ComingSoon } from '@/components/common/Page';

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  return (
    <Page
      title={isEditing ? 'Edit Project' : 'New Project'}
      subtitle={isEditing ? `Editing project ID: ${id}` : 'Create a new portfolio project'}
    >
      <ComingSoon description="Project editor will be available soon. You will be able to add project details, technologies, images, and translations." />
    </Page>
  );
}
