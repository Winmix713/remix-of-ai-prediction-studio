import React, { memo, useCallback } from 'react';
import { 
  RotateCcw, 
  LayoutTemplate, 
  Bookmark, 
  FileCode,
  Monitor,
  Smartphone
} from 'lucide-react';
import type { TabMode } from './types';

export interface InspectorToolbarProps {
  activeTab: TabMode;
  onActiveTabChange: (tab: TabMode) => void;
  currentTag: string;
  onResetTransforms: () => void;
  onShowTemplates: () => void;
  onShowPresets: () => void;
  onShowExport: () => void;
  className?: string;
}

interface ToolbarAction {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  title: string;
  ariaLabel: string;
}

const TAB_OPTIONS: TabMode[] = ['EDIT', 'PROMPT', 'CODE'];

/**
 * Modern pill-style tab selector with elegant styling
 */
const ModePillSelector = memo<{
  value: TabMode;
  onChange: (value: TabMode) => void;
}>(({ value, onChange }) => {
  return (
    <div className="flex rounded-2xl bg-inspector-section/70 p-1 border border-inspector-border/25 shadow-sm">
      {TAB_OPTIONS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`
            relative px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-wide rounded-xl
            transition-all duration-200 ease-out
            ${value === tab 
              ? 'bg-inspector-text text-inspector-bg shadow-md scale-[1.02]' 
              : 'text-inspector-text-muted hover:text-inspector-text hover:bg-inspector-hover/50'
            }
          `}
        >
          {tab.charAt(0) + tab.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
});

ModePillSelector.displayName = 'ModePillSelector';

/**
 * Modern action button with refined hover states
 */
const ActionButton = memo<{
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  title: string;
  ariaLabel: string;
}>(({ icon: Icon, onClick, title, ariaLabel }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={ariaLabel}
    className="
      inline-flex items-center justify-center rounded-xl
      h-8 w-8 
      text-inspector-text-muted hover:text-inspector-accent
      hover:bg-inspector-hover/70 
      active:scale-95
      transition-all duration-200 ease-out
    "
  >
    <Icon className="w-4 h-4" aria-hidden="true" />
  </button>
));

ActionButton.displayName = 'ActionButton';

/**
 * InspectorToolbar - Modern redesigned toolbar component
 * Features: Pill-style mode selector, refined action buttons, clean layout
 */
export const InspectorToolbar: React.FC<InspectorToolbarProps> = memo(({
  activeTab,
  onActiveTabChange,
  currentTag,
  onResetTransforms,
  onShowTemplates,
  onShowPresets,
  onShowExport,
  className,
}) => {
  const handleTabChange = useCallback((value: TabMode) => {
    onActiveTabChange(value);
  }, [onActiveTabChange]);

  const toolbarActions: ToolbarAction[] = [
    {
      icon: RotateCcw,
      onClick: onResetTransforms,
      title: 'Reset transforms',
      ariaLabel: 'Reset transforms',
    },
    {
      icon: LayoutTemplate,
      onClick: onShowTemplates,
      title: 'Templates',
      ariaLabel: 'Show templates',
    },
    {
      icon: Bookmark,
      onClick: onShowPresets,
      title: 'Presets',
      ariaLabel: 'Show presets',
    },
    {
      icon: FileCode,
      onClick: onShowExport,
      title: 'Export code',
      ariaLabel: 'Export code',
    },
  ];

  return (
    <div 
      className="
        flex items-center justify-between 
        border-b border-inspector-border/40
        py-3.5 px-5
        bg-gradient-to-b from-inspector-panel to-inspector-bg/95
        backdrop-blur-sm
        flex-shrink-0
      "
      role="toolbar"
      aria-label="Property Inspector toolbar"
    >
      {/* Left side: Tag name and Mode selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-inspector-section/60 border border-inspector-border/25 shadow-sm">
          <span 
            className="
              text-[0.72rem] uppercase font-bold 
              tracking-[0.1em] 
              text-inspector-accent
              select-none
            "
            aria-label={`Current element: ${currentTag}`}
          >
            {currentTag}
          </span>
        </div>
        <ModePillSelector 
          value={activeTab} 
          onChange={handleTabChange}
        />
      </div>

      {/* Right side: Action buttons */}
      <div 
        className="flex items-center gap-1" 
        role="group" 
        aria-label="Toolbar actions"
      >
        {toolbarActions.map((action) => (
          <ActionButton
            key={action.ariaLabel}
            icon={action.icon}
            onClick={action.onClick}
            title={action.title}
            ariaLabel={action.ariaLabel}
          />
        ))}
      </div>
    </div>
  );
});

InspectorToolbar.displayName = 'InspectorToolbar';
