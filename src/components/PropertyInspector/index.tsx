// src/components/PropertyInspector/index.tsx
// PropertyInspector - Main Component
// Component-centric props editor with real-time preview

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Eye, Save, Laptop, Send, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Accordion } from '../ui/accordion';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCodePreview } from '@/contexts/CodePreviewContext';
import type { TabMode, Breakpoint, BorderRadiusTab, InspectorState } from './types';
import { DEFAULT_OPEN_SECTIONS, BREAKPOINTS } from './constants';
import { useInspectorState, useGeneratedClasses, useGeneratedStyles, useGeneratedCode } from './hooks';
import { useAIStyler } from './useAIStyler';
import { BreakpointSelector } from './components';
import { ComponentTemplates } from './ComponentTemplates';
import { StylePresets } from './StylePresets';
import { ExportComponent } from './ExportComponent';
import { InspectorToolbar } from './InspectorToolbar';

// Import modular sections
import { AppearanceSection, LayoutSection, TypographySection, CodeSection } from './sections';

/**
 * Gyors prompt javaslatok konstans lista
 */
const QUICK_SUGGESTIONS = ['Rounder corners', 'Larger shadow', 'Blue background', 'Center align', 'Bold text'] as const;

/**
 * Szerkesztési kategória típus
 */
type EditCategory = 'appearance' | 'layout' | 'typography' | 'code';

/**
 * Kód tab mód típus
 */
type CodeTabMode = 'html' | 'css';

/**
 * AI státusz üzenet props
 */
interface AIStatusMessageProps {
  message: string | null;
  error: string | null;
}

/**
 * AI státusz üzenet komponens
 */
const AIStatusMessage = memo<AIStatusMessageProps>(({
  message,
  error
}) => {
  if (!message && !error) return null;
  const isError = !!error;
  const displayMessage = error || message;
  return (
    <div 
      className={`
        flex items-start gap-3 p-3.5 rounded-2xl text-xs
        backdrop-blur-sm border animate-fade-in
        ${isError 
          ? 'bg-red-500/10 text-red-400 border-red-500/20' 
          : 'bg-inspector-active/10 text-inspector-accent border-inspector-active/20'
        }
      `} 
      role="alert" 
      aria-live="polite"
    >
      <div className={`p-1.5 rounded-lg ${isError ? 'bg-red-500/20' : 'bg-inspector-active/20'}`}>
        {isError 
          ? <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" /> 
          : <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        }
      </div>
      <span className="leading-relaxed pt-0.5">{displayMessage}</span>
    </div>
  );
});
AIStatusMessage.displayName = 'AIStatusMessage';

/**
 * Kiválasztott elem információ props
 */
interface SelectedElementInfoProps {
  tag: string;
  elementId: string;
  generatedClasses: string;
}

/**
 * Kiválasztott elem információ komponens
 */
const SelectedElementInfo = memo<SelectedElementInfoProps>(({
  tag,
  elementId,
  generatedClasses
}) => {
  return <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div>
          Selected: <span className="font-medium font-mono text-xs uppercase text-foreground">{tag}</span>
        </div>
        <span className="text-[10px]">#{elementId || 'element'}</span>
      </div>
      <div className="font-mono text-[10px] bg-secondary/50 border border-border rounded-lg px-2 py-2 break-all" role="status" aria-label="Generated CSS classes">
        {generatedClasses || 'No classes'}
      </div>
    </div>;
});
SelectedElementInfo.displayName = 'SelectedElementInfo';

/**
 * Gyors javaslatok props
 */
interface QuickSuggestionsProps {
  onSelect: (suggestion: string) => void;
  disabled: boolean;
}

/**
 * Gyors javaslatok komponens
 */
const QuickSuggestions = memo<QuickSuggestionsProps>(({
  onSelect,
  disabled
}) => {
  return (
    <div className="space-y-2.5 pt-2 border-t border-inspector-border/30">
      <span className="text-[0.68rem] text-inspector-text-muted font-medium tracking-wide">
        Quick suggestions
      </span>
      <div className="flex flex-wrap gap-2" role="list">
        {QUICK_SUGGESTIONS.map(suggestion => (
          <button 
            key={suggestion} 
            type="button" 
            onClick={() => onSelect(suggestion)} 
            disabled={disabled} 
            className="inspector-suggestion-pill disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none" 
            role="listitem"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
});
QuickSuggestions.displayName = 'QuickSuggestions';

/**
 * AI prompt form props
 */
interface AIPromptFormProps {
  promptValue: string;
  onPromptChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  statusMessage: string | null;
  error: string | null;
  state: InspectorState;
  generatedClasses: string;
}

/**
 * AI prompt form komponens
 */
const AIPromptForm = memo<AIPromptFormProps>(({
  promptValue,
  onPromptChange,
  onSubmit,
  onCancel,
  isLoading,
  statusMessage,
  error,
  state,
  generatedClasses
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="inspector-card p-4 space-y-3">
        <label 
          htmlFor="ai-prompt-textarea" 
          className="text-[0.72rem] font-semibold text-inspector-text flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-inspector-accent" aria-hidden="true" />
          Describe your styling changes
        </label>
        <div className="relative">
          <Textarea 
            id="ai-prompt-textarea" 
            placeholder="e.g. Make corners rounder and add a subtle blue glow..." 
            value={promptValue} 
            onChange={e => onPromptChange(e.target.value)} 
            className="
              w-full resize-none min-h-[140px] text-xs rounded-xl pb-14
              bg-inspector-input-bg border-inspector-input-border
              text-inspector-text placeholder:text-inspector-text-disabled
              focus:border-inspector-input-focus focus:ring-2 focus:ring-inspector-active/25
              transition-all duration-200
            " 
            disabled={isLoading} 
            aria-label="AI prompt input" 
          />
          <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-center">
            <div className="flex items-center gap-1.5 rounded-lg bg-inspector-section/80 border border-inspector-border/40 px-2.5 py-1.5 text-[0.65rem] text-inspector-text-muted backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-inspector-accent" aria-hidden="true" />
              <span className="font-medium">Gemini Flash</span>
            </div>
          </div>
        </div>
      </div>
      
      <AIStatusMessage message={statusMessage} error={error} />
      
      <SelectedElementInfo tag={state.tag} elementId={state.elementId} generatedClasses={generatedClasses} />

      <div className="flex gap-3">
        <button 
          type="submit" 
          disabled={!promptValue.trim() || isLoading} 
          className="
            flex-1 h-11 rounded-xl font-semibold text-[0.75rem]
            inline-flex items-center justify-center gap-2
            bg-gradient-to-r from-inspector-active to-inspector-accent-soft
            text-inspector-bg
            hover:shadow-lg hover:shadow-inspector-active/30
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            transition-all duration-200
          "
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" aria-hidden="true" />
              Apply with AI
            </>
          )}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={isLoading}
          className="
            h-11 px-5 rounded-xl font-medium text-[0.75rem]
            border border-inspector-border/60 bg-inspector-section/60
            text-inspector-text-secondary
            hover:bg-inspector-hover hover:text-inspector-text
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          Cancel
        </button>
      </div>
      
      <QuickSuggestions onSelect={onPromptChange} disabled={isLoading} />
    </form>
  );
});
AIPromptForm.displayName = 'AIPromptForm';

/**
 * Kód szerkesztő props
 */
interface CodeEditorProps {
  mode: CodeTabMode;
  onModeChange: (mode: CodeTabMode) => void;
  htmlValue: string;
  cssValue: string;
  onHtmlChange: (value: string) => void;
  onCssChange: (value: string) => void;
  onClear: () => void;
  onCopy: () => void;
  onSave: () => void;
}

/**
 * Kód szerkesztő komponens
 */
const CodeEditor = memo<CodeEditorProps>(({
  mode,
  onModeChange,
  htmlValue,
  cssValue,
  onHtmlChange,
  onCssChange,
  onClear,
  onCopy,
  onSave
}) => {
  const isHtmlMode = mode === 'html';
  const currentValue = isHtmlMode ? htmlValue : cssValue;
  const handleChange = isHtmlMode ? onHtmlChange : onCssChange;
  const placeholder = isHtmlMode ? "<div class='my-element'>Text...</div>" : ".my-element { color: red; }";
  const textColorClass = isHtmlMode ? 'text-orange-400' : 'text-cyan-400';
  return <div className="flex flex-col h-full gap-3">
      <Tabs value={mode} onValueChange={v => onModeChange(v as CodeTabMode)} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-7">
          <TabsTrigger value="html" className="text-[10px]">HTML</TabsTrigger>
          <TabsTrigger value="css" className="text-[10px]">CSS</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Textarea value={currentValue} onChange={e => handleChange(e.target.value)} placeholder={placeholder} className={`flex-1 font-mono text-[11px] bg-neutral-950 p-3 rounded-lg min-h-[140px] resize-none ${textColorClass}`} spellCheck={false} aria-label={`Edit custom ${mode} code`} />
      
      <div className="text-[10px] text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2 flex items-center gap-2">
        <Eye className="w-3 h-3" aria-hidden="true" />
        Result visible in Preview panel on the right
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Custom code mode
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onClear}>
            Clear
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onCopy}>
            Copy
          </Button>
          <Button size="sm" className="h-7 text-[10px] gap-1" onClick={onSave}>
            <Save className="w-3 h-3" aria-hidden="true" />
            Save
          </Button>
        </div>
      </div>
    </div>;
});
CodeEditor.displayName = 'CodeEditor';

/**
 * Szerkesztő nézet props
 */
interface EditorViewProps {
  category: EditCategory;
  onCategoryChange: (category: EditCategory) => void;
  currentBreakpoint: Breakpoint;
  onBreakpointChange: (breakpoint: Breakpoint) => void;
  hasBreakpointOverrides: (breakpoint: Breakpoint) => boolean;
  openSections: string[];
  onOpenSectionsChange: (sections: string[]) => void;
  state: InspectorState;
  borderRadiusTab: BorderRadiusTab;
  onBorderRadiusTabChange: (tab: BorderRadiusTab) => void;
  updateState: <K extends keyof InspectorState>(key: K, value: InspectorState[K], breakpoint?: Breakpoint) => void;
  updateNestedState: <K extends keyof InspectorState>(key: K, nestedKey: string, value: string | number | null, breakpoint?: Breakpoint) => void;
  updateDeepNestedState: <K extends keyof InspectorState>(key: K, nestedKey: string, deepKey: string, value: string | number, breakpoint?: Breakpoint) => void;
}

/**
 * Szerkesztő nézet komponens
 */
const EditorView = memo<EditorViewProps>(({
  category,
  onCategoryChange,
  currentBreakpoint,
  onBreakpointChange,
  hasBreakpointOverrides,
  openSections,
  onOpenSectionsChange,
  state,
  borderRadiusTab,
  onBorderRadiusTabChange,
  updateState,
  updateNestedState,
  updateDeepNestedState
}) => {
  return (
    <div className="space-y-4">
      {/* Breakpoint Selector - Premium Design */}
      <div className="flex items-center justify-between">
        <div className="flex bg-inspector-section/70 rounded-2xl p-1 border border-inspector-border/30 shadow-sm">
          {BREAKPOINTS.map(bp => (
            <button 
              key={bp.value} 
              type="button" 
              onClick={() => onBreakpointChange(bp.value as Breakpoint)} 
              className={`
                px-3 py-1.5 text-[0.68rem] font-semibold rounded-xl
                transition-all duration-200 ease-out
                ${currentBreakpoint === bp.value 
                  ? 'bg-inspector-text text-inspector-bg shadow-md' 
                  : 'text-inspector-text-muted hover:text-inspector-text hover:bg-inspector-hover/60'
                }
              `}
            >
              {bp.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[0.68rem] text-inspector-text-muted bg-inspector-section/50 px-3 py-1.5 rounded-xl border border-inspector-border/25">
          <Laptop className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-semibold">{currentBreakpoint === 'base' ? 'All' : currentBreakpoint.toUpperCase()}</span>
          {hasBreakpointOverrides(currentBreakpoint) && (
            <span 
              className="w-2 h-2 rounded-full bg-inspector-accent inspector-status-active" 
              title="Has overrides" 
              aria-label="Has breakpoint overrides" 
            />
          )}
        </div>
      </div>

      {/* Category Tabs - Premium Segmented Control */}
      <div className="w-full">
        <div 
          role="tablist" 
          aria-orientation="horizontal" 
          className="grid grid-cols-4 h-10 w-full rounded-2xl bg-inspector-section/70 border border-inspector-border/30 p-1 gap-1 shadow-sm"
        >
          {(['appearance', 'layout', 'typography', 'code'] as const).map(tab => (
            <button 
              key={tab} 
              type="button" 
              role="tab" 
              aria-selected={category === tab} 
              onClick={() => onCategoryChange(tab)} 
              className={`
                inline-flex items-center justify-center whitespace-nowrap rounded-xl 
                font-semibold text-[0.72rem] tracking-tight
                transition-all duration-200 ease-out
                ${category === tab 
                  ? 'bg-inspector-text text-inspector-bg shadow-md scale-[1.02]' 
                  : 'text-inspector-text-muted hover:text-inspector-text hover:bg-inspector-hover/60'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Sections */}
      <Accordion 
        type="multiple" 
        value={openSections} 
        onValueChange={onOpenSectionsChange} 
        className="space-y-3"
      >
        {category === 'appearance' && (
          <AppearanceSection 
            state={state} 
            borderRadiusTab={borderRadiusTab} 
            onBorderRadiusTabChange={onBorderRadiusTabChange} 
            updateNestedState={updateNestedState} 
            updateDeepNestedState={updateDeepNestedState} 
          />
        )}
        
        {category === 'layout' && (
          <LayoutSection state={state} updateNestedState={updateNestedState} />
        )}
        
        {category === 'typography' && (
          <TypographySection state={state} updateState={updateState} updateNestedState={updateNestedState} />
        )}
        
        {category === 'code' && (
          <CodeSection state={state} updateState={updateState} />
        )}
      </Accordion>
    </div>
  );
});
EditorView.displayName = 'EditorView';

/**
 * Inspector footer props
 */
interface InspectorFooterProps {
  elementId: string;
  onReset: () => void;
  onApply?: () => void;
  className?: string;
}

/**
 * Inspector footer komponens
 */
const InspectorFooter = memo<InspectorFooterProps>(({
  elementId,
  onReset,
  onApply
}) => {
  return (
    <footer 
      className="
        px-5 py-4 
        border-t border-inspector-border/40 
        bg-gradient-to-b from-inspector-panel/95 to-inspector-bg
        flex justify-between items-center
        backdrop-blur-sm
      "
    >
      <span 
        className="
          text-[0.7rem] text-inspector-text-muted font-mono tracking-tight 
          bg-inspector-section/50 px-3 py-1.5 rounded-lg 
          border border-inspector-border/25
          shadow-sm
        "
      >
        #{elementId || 'element'}
      </span>
      <div className="flex gap-3">
        <button 
          type="button" 
          className="
            inline-flex items-center justify-center rounded-xl h-9 px-5 
            text-[0.72rem] font-semibold 
            border border-inspector-border/40 bg-inspector-section/60 
            text-inspector-text-secondary 
            hover:bg-inspector-hover hover:text-inspector-text hover:border-inspector-border/60
            active:scale-[0.98]
            inspector-btn-reset
            transition-all duration-200
          " 
          onClick={onReset}
        >
          Reset
        </button>
        {onApply && (
          <button 
            type="button" 
            className="
              inline-flex items-center justify-center rounded-xl h-9 px-5 
              text-[0.72rem] font-bold 
              bg-gradient-to-r from-inspector-active to-inspector-accent-soft
              text-inspector-bg 
              hover:shadow-lg hover:shadow-inspector-active/40
              active:scale-[0.98]
              transition-all duration-200
            " 
            onClick={onApply}
          >
            Apply
          </button>
        )}
      </div>
    </footer>
  );
});
InspectorFooter.displayName = 'InspectorFooter';

/**
 * Fő PropertyInspector komponens
 */
export const PropertyInspector: React.FC = () => {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState<TabMode>('EDIT');
  const [editCategory, setEditCategory] = useState<EditCategory>('appearance');
  const [borderRadiusTab, setBorderRadiusTab] = useState<BorderRadiusTab>('all');
  const [openSections, setOpenSections] = useState<string[]>(DEFAULT_OPEN_SECTIONS);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [codeTabMode, setCodeTabMode] = useState<CodeTabMode>('html');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // --- Hooks ---
  const {
    toast
  } = useToast();
  const {
    customHtml,
    setCustomHtml,
    customCss,
    setCustomCss,
    setIsCodeMode,
    saveCode,
    setInspectorState,
    setGeneratedClasses
  } = useCodePreview();
  const {
    state,
    currentBreakpoint,
    setCurrentBreakpoint,
    updateState,
    updateNestedState,
    updateDeepNestedState,
    applyStateChanges,
    resetTransforms,
    hasBreakpointOverrides
  } = useInspectorState();
  const {
    applyPrompt,
    isLoading: isAILoading,
    error: aiError
  } = useAIStyler();
  const generatedClasses = useGeneratedClasses(state, currentBreakpoint);
  const generatedStyles = useGeneratedStyles(state);
  const generatedCode = useGeneratedCode(state, generatedClasses, generatedStyles);

  // --- Effects ---

  // Szinkronizálja a kód módot a kontextussal
  useEffect(() => {
    setIsCodeMode(activeTab === 'CODE');
  }, [activeTab, setIsCodeMode]);

  // Szinkronizálja az inspector state-et a preview kontextussal
  useEffect(() => {
    setInspectorState(state);
    setGeneratedClasses(generatedClasses);
  }, [state, generatedClasses, setInspectorState, setGeneratedClasses]);

  // --- Event Handlers (memoizált) ---

  const handleApplyPrompt = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim() || isAILoading) return;
    setAiStatusMessage(null);
    const result = await applyPrompt(aiPromptInput, state);
    if (result.success && Object.keys(result.changes).length > 0) {
      applyStateChanges(result.changes);
      setAiStatusMessage(result.message || 'Styles applied successfully!');
      toast({
        title: "AI Styles Applied",
        description: result.message || "Changes have been applied."
      });
      setAiPromptInput('');
    } else if (!result.success) {
      setAiStatusMessage(result.message || 'An error occurred');
      toast({
        title: "Error",
        description: result.message || "Could not process AI request.",
        variant: "destructive"
      });
    }
  }, [aiPromptInput, isAILoading, applyPrompt, state, applyStateChanges, toast]);
  const handleCancelPrompt = useCallback(() => {
    setAiPromptInput('');
    setAiStatusMessage(null);
  }, []);
  const handleApplyTemplate = useCallback((templateState: Partial<InspectorState>) => {
    applyStateChanges(templateState);
    setShowTemplates(false);
    toast({
      title: "Template Applied",
      description: "Template loaded successfully."
    });
  }, [applyStateChanges, toast]);
  const handleLoadPreset = useCallback((presetState: InspectorState) => {
    applyStateChanges(presetState);
    setShowPresets(false);
    toast({
      title: "Preset Loaded",
      description: "Style preset applied successfully."
    });
  }, [applyStateChanges, toast]);
  const handleClearCode = useCallback(() => {
    setCustomHtml('');
    setCustomCss('');
    toast({
      title: "Cleared",
      description: "Custom code has been cleared."
    });
  }, [setCustomHtml, setCustomCss, toast]);
  const handleCopyCode = useCallback(() => {
    const codeContent = `<!-- HTML -->\n${customHtml}\n\n/* CSS */\n${customCss}`;
    navigator.clipboard.writeText(codeContent);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard."
    });
  }, [customHtml, customCss, toast]);
  const handleSaveCode = useCallback(() => {
    saveCode();
    toast({
      title: "Saved!",
      description: "Custom code is now active in the preview."
    });
  }, [saveCode, toast]);

  // --- Floating Panels (Early Return) ---
  if (showTemplates) {
    return <ComponentTemplates onApplyTemplate={handleApplyTemplate} onClose={() => setShowTemplates(false)} />;
  }
  if (showPresets) {
    return <StylePresets currentState={state} onLoadPreset={handleLoadPreset} onClose={() => setShowPresets(false)} />;
  }
  if (showExport) {
    return <ExportComponent state={state} generatedClasses={generatedClasses} onClose={() => setShowExport(false)} />;
  }

  // --- Main Render ---
  return (
    <section className="lg:w-auto lg:flex-shrink-0 w-full" aria-label="Property inspector panel">
      <div 
        className="
          inspector-glass
          border border-inspector-border/40 
          rounded-3xl 
          shadow-[var(--inspector-shadow-xl)]
          max-h-[90vh] 
          flex flex-col 
          overflow-hidden 
          ring-1 ring-inset ring-white/[0.04]
          ring-offset-0
        " 
        style={{
          boxShadow: 'var(--inspector-shadow-xl), var(--inspector-glow)'
        }}
        role="region" 
        aria-label="Property Inspector"
      >
        {/* Header Toolbar */}
        <InspectorToolbar 
          activeTab={activeTab} 
          onActiveTabChange={setActiveTab} 
          currentTag={state.tag} 
          onResetTransforms={resetTransforms} 
          onShowTemplates={() => setShowTemplates(true)} 
          onShowPresets={() => setShowPresets(true)} 
          onShowExport={() => setShowExport(true)} 
        />

        {/* Main Content */}
        <div className="p-5 overflow-y-auto flex-1 inspector-scrollbar">
          {activeTab === 'PROMPT' && (
            <AIPromptForm 
              promptValue={aiPromptInput} 
              onPromptChange={setAiPromptInput} 
              onSubmit={handleApplyPrompt} 
              onCancel={handleCancelPrompt} 
              isLoading={isAILoading} 
              statusMessage={aiStatusMessage} 
              error={aiError} 
              state={state} 
              generatedClasses={generatedClasses} 
            />
          )}
          
          {activeTab === 'CODE' && (
            <CodeEditor 
              mode={codeTabMode} 
              onModeChange={setCodeTabMode} 
              htmlValue={customHtml} 
              cssValue={customCss} 
              onHtmlChange={setCustomHtml} 
              onCssChange={setCustomCss} 
              onClear={handleClearCode} 
              onCopy={handleCopyCode} 
              onSave={handleSaveCode} 
            />
          )}
          
          {activeTab === 'EDIT' && (
            <EditorView 
              category={editCategory} 
              onCategoryChange={setEditCategory} 
              currentBreakpoint={currentBreakpoint} 
              onBreakpointChange={setCurrentBreakpoint} 
              hasBreakpointOverrides={hasBreakpointOverrides} 
              openSections={openSections} 
              onOpenSectionsChange={setOpenSections} 
              state={state} 
              borderRadiusTab={borderRadiusTab} 
              onBorderRadiusTabChange={setBorderRadiusTab} 
              updateState={updateState} 
              updateNestedState={updateNestedState} 
              updateDeepNestedState={updateDeepNestedState} 
            />
          )}
        </div>

        {/* Footer */}
        <InspectorFooter elementId={state.elementId} onReset={resetTransforms} />
      </div>
    </section>
  );
};

// Re-export types and utilities
export * from './types';
export * from './constants';
export * from './hooks';
export * from './components';
export { PreviewBox } from './PreviewBox';
export default PropertyInspector;