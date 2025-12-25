/**
 * Settings Page
 *
 * Technologies and tags management (placeholder).
 */
import { Page, ComingSoon } from '@/components/common/Page';

export default function SettingsPage() {
  return (
    <Page
      title="Settings"
      subtitle="Manage technologies, tags, and other settings"
    >
      <div className="glass-card p-6">
        {/* Tabs placeholder */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
          <button className="px-4 py-2 text-sm font-medium text-primary-400 border-b-2 border-primary-500">
            Technologies
          </button>
          <button className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors">
            Tags
          </button>
        </div>

        <ComingSoon description="Settings management will be available soon. You will be able to manage technologies, tags, and other configuration options." />
      </div>
    </Page>
  );
}
