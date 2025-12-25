/**
 * Dashboard Page
 *
 * Main dashboard with overview and analytics (placeholder).
 */
import { Page, ComingSoon } from '@/components/common/Page';

export default function DashboardPage() {
  return (
    <Page
      title="Dashboard"
      subtitle="Overview of your content and activity"
    >
      <ComingSoon description="Dashboard analytics and content overview will be available soon. This will include statistics, recent activity, and quick actions." />
    </Page>
  );
}
