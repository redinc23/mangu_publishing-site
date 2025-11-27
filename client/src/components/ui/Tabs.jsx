import { useState } from 'react';
import clsx from 'clsx';

export function Tabs({ tabs, defaultTab, onChange, className }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);

  const handleTabChange = (value) => {
    setActiveTab(value);
    onChange?.(value);
  };

  const activeTabContent = tabs.find((tab) => tab.value === activeTab)?.content;

  return (
    <div className={className}>
      {/* Tab List */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex gap-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              disabled={tab.disabled}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors',
                'border-b-2 -mb-px',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                activeTab === tab.value
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              )}
              aria-current={activeTab === tab.value ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">{activeTabContent}</div>
    </div>
  );
}

export default Tabs;
