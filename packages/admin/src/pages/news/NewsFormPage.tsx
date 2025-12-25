/**
 * News Form Page
 *
 * Create or edit a news article (placeholder).
 */
import { useParams } from 'react-router-dom';
import { Page, ComingSoon } from '@/components/common/Page';

export default function NewsFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  return (
    <Page
      title={isEditing ? 'Edit Article' : 'New Article'}
      subtitle={isEditing ? `Editing article ID: ${id}` : 'Create a new news article'}
    >
      <ComingSoon description="News editor will be available soon. You will be able to write and publish news articles with translations." />
    </Page>
  );
}
