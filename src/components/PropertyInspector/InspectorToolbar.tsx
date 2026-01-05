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

interface InspectorToolbarProps {
  activeTab: TabMode;
  onActiveTabChange: (tab: TabMode) => void;
  currentTag: string;
  onResetTransforms: () => void;
  onShowTemplates: () => void;
  onShowPresets: () => void;
  onShowExport: () => void;
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
    <div className="flex rounded-full bg-inspector-section/80 p-[3px] border border-inspector-border/40">
      {TAB_OPTIONS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`
            relative px-3 py-1.5 text-[0.65rem] font-medium tracking-wide rounded-full
            transition-all duration-200 ease-out
            ${value === tab 
              ? 'bg-inspector-text text-inspector-bg shadow-sm' 
              : 'text-inspector-text-muted hover:text-inspector-text'
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
      inline-flex items-center justify-center rounded-lg
      h-7 w-7 
      text-inspector-text-muted hover:text-inspector-accent
      hover:bg-inspector-hover 
      active:scale-95
      transition-all duration-150 ease-out
    "
  >
    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
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
        border-b border-inspector-border/60
        py-2.5 px-4
        bg-gradient-to-b from-inspector-panel/90 to-inspector-bg/80
        backdrop-blur-sm
        flex-shrink-0
      "
      role="toolbar"
      aria-label="Property Inspector toolbar"
    >
      {/* Left side: Tag name and Mode selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-inspector-section/50 border border-inspector-border/30">
          <span 
            className="
              text-[0.7rem] uppercase font-bold 
              tracking-[0.12em] 
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
        className="flex items-center gap-0.5" 
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
