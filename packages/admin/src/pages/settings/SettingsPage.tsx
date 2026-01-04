/**
 * Settings Page
 *
 * Technologies and tags management with tab navigation.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cpu, Tags } from 'lucide-react';
import { Page } from '@/components/common/Page';
import { TechnologiesTable } from './components/TechnologiesTable';
import { TagsTable } from './components/TagsTable';

type SettingsTab = 'technologies' | 'tags';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

const TABS: TabConfig[] = [
  {
    id: 'technologies',
    label: 'Technologies',
    icon: Cpu,
    component: TechnologiesTable,
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: Tags,
    component: TagsTable,
  },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'technologies'
  );

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component ?? TechnologiesTable;

  return (
    <Page
      title="Settings"
      subtitle="Manage technologies, tags, and other settings"
    >
      <div className="glass-card p-6">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 border-b border-white/10 pb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <ActiveComponent />
      </div>
    </Page>
  );
}
