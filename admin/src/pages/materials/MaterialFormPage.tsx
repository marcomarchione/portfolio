/**
 * Material Form Page
 *
 * Create or edit a material (placeholder).
 */
import { useParams } from 'react-router-dom';
import { Page, ComingSoon } from '@/components/common/Page';

export default function MaterialFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  return (
    <Page
      title={isEditing ? 'Edit Material' : 'New Material'}
      subtitle={isEditing ? `Editing material ID: ${id}` : 'Create a new learning material'}
    >
      <ComingSoon description="Material editor will be available soon. You will be able to add material details, attachments, and translations." />
    </Page>
  );
}
