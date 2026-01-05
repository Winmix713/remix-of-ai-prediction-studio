// src/components/PropertyInspector/sections/AppearanceSection.tsx
// Appearance Section - Visual styling controls with modern design

import React, { memo, useCallback, useMemo, useState } from 'react';
import { 
  Palette, Circle, Eye, Droplet, Sun, Contrast, FlipHorizontal,
  RotateCcw, Sparkles, ChevronDown
} from 'lucide-react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { InspectorColorPicker } from '../ui/InspectorColorPicker';
import { SliderControl, StyledSelect, LabeledInput } from '../components';
import { SHADOW_OPTIONS, BORDER_STYLE_OPTIONS } from '../constants';
import type { InspectorState, BorderRadiusTab } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * State típusok (ha még nincs definiálva a types-ban)
 */
export interface AppearanceState {
  backgroundColor: string;
}

export interface TypographyState {
  textColor: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
}

export interface BorderState {
  color: string;
  ringColor: string;
  width: string;
  style: string;
  radius: {
    all: number;
    tl: number;
    tr: number;
    br: number;
    bl: number;
  };
}

export interface EffectsState {
  shadow: string;
  opacity: number;
  blur: number;
  backdropBlur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  grayscale: number;
}

/**
 * AppearanceSection props interfész
 */
interface AppearanceSectionProps {
  state: InspectorState;
  borderRadiusTab: BorderRadiusTab;
  onBorderRadiusTabChange: (tab: BorderRadiusTab) => void;
  updateNestedState: <K extends keyof InspectorState>(
    key: K,
    nestedKey: string,
    value: string | number | null,
    breakpoint?: string
  ) => void;
  updateDeepNestedState: <K extends keyof InspectorState>(
    key: K,
    nestedKey: string,
    deepKey: string,
    value: string | number,
    breakpoint?: string
  ) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Szín preset-ek gyors kiválasztáshoz
 */
const COLOR_PRESETS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
] as const;

/**
 * Border radius preset-ek
 */
const RADIUS_PRESETS = [
  { name: 'None', value: 0 },
  { name: 'SM', value: 4 },
  { name: 'MD', value: 8 },
  { name: 'LG', value: 16 },
  { name: 'XL', value: 24 },
  { name: 'Full', value: 9999 },
] as const;

/**
 * Alapértelmezett filter értékek
 */
const DEFAULT_FILTER_VALUES = {
  blur: 0,
  backdropBlur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  grayscale: 0,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ellenőrzi, hogy van-e aktív filter
 */
function hasActiveFilters(effects: EffectsState): boolean {
  return effects.blur !== 0 ||
         effects.backdropBlur !== 0 ||
         effects.brightness !== 100 ||
         effects.contrast !== 100 ||
         effects.saturation !== 100 ||
         effects.hueRotate !== 0 ||
         effects.grayscale !== 0;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Accordion szekció header komponens - Premium design
 */
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  badge?: string | number;
}

const SectionHeader = memo<SectionHeaderProps>(({ icon, title, badge }) => (
  <div className="flex items-center gap-2.5 w-full py-0.5">
    <span className="flex items-center gap-2.5 flex-1">
      <span className="text-inspector-accent/90 p-1 rounded-lg bg-inspector-active/10">
        {icon}
      </span>
      <span className="text-inspector-text font-semibold text-[0.78rem] tracking-tight">
        {title}
      </span>
    </span>
    {badge !== undefined && badge !== null && (
      <span className="text-[0.6rem] bg-inspector-active/15 text-inspector-active px-2.5 py-1 rounded-full font-bold tracking-wide uppercase">
        {badge}
      </span>
    )}
  </div>
));

SectionHeader.displayName = 'SectionHeader';

/**
 * Színek szekció
 */
interface ColorsSectionProps {
  appearance: AppearanceState;
  typography: TypographyState;
  border: BorderState;
  onColorChange: (key: string, nestedKey: string, value: string) => void;
}

const ColorsSection = memo<ColorsSectionProps>(({
  appearance,
  typography,
  border,
  onColorChange
}) => {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <AccordionItem 
      value="colors-background-section" 
      className="inspector-card overflow-hidden border-0"
    >
      <AccordionTrigger 
        className="
          py-3.5 px-4 text-xs font-medium text-inspector-text-muted 
          hover:no-underline inspector-accordion-trigger
          data-[state=open]:bg-inspector-section/60
          transition-all duration-200
        "
        aria-label="Colors settings"
      >
        <SectionHeader 
          icon={<Palette className="w-4 h-4" aria-hidden="true" />} 
          title="Colors"
        />
      </AccordionTrigger>
      <AccordionContent className="pb-4 px-4 space-y-4 animate-accordion-down">
        {/* Color Pickers Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3" aria-label="Color pickers">
            <InspectorColorPicker
              value={appearance.backgroundColor}
              onChange={(c) => {
                const colorValue = typeof c === 'string' ? c : c?.solid || '';
                onColorChange('appearance', 'backgroundColor', colorValue);
              }}
              label="Background"
              showGradient={true}
            />
            <InspectorColorPicker
              value={typography.textColor}
              onChange={(c) => {
                const colorValue = typeof c === 'string' ? c : c?.solid || '';
                onColorChange('typography', 'textColor', colorValue);
              }}
              label="Text"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InspectorColorPicker
              value={border.color}
              onChange={(c) => {
                const colorValue = typeof c === 'string' ? c : c?.solid || '';
                onColorChange('border', 'color', colorValue);
              }}
              label="Border"
            />
            <InspectorColorPicker
              value={border.ringColor}
              onChange={(c) => {
                const colorValue = typeof c === 'string' ? c : c?.solid || '';
                onColorChange('border', 'ringColor', colorValue);
              }}
              label="Focus Ring"
            />
          </div>

          {/* Presets Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="
              inline-flex items-center justify-center w-full h-9 
              text-[0.72rem] gap-2 rounded-xl 
              border border-inspector-border/30 
              bg-inspector-section/60 hover:bg-inspector-hover 
              text-inspector-text font-semibold 
              transition-all duration-200
              hover:shadow-sm
              active:scale-[0.98]
            "
          >
            <Sparkles className="w-3.5 h-3.5 text-inspector-accent" aria-hidden="true" />
            {showPresets ? 'Hide' : 'Show'} Presets
          </button>

          {/* Color Presets */}
          {showPresets && (
            <div className="space-y-2.5 pt-3 border-t border-inspector-border/30 animate-fade-in">
              <span className="text-[0.65rem] text-inspector-text-muted block font-semibold uppercase tracking-wider">
                Quick Colors
              </span>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => onColorChange('appearance', 'backgroundColor', preset.value)}
                    className="
                      h-9 rounded-xl border border-inspector-border/40 
                      hover:scale-110 hover:shadow-lg hover:z-10
                      active:scale-105
                      transition-all duration-200
                      relative group
                    "
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    aria-label={`Set background to ${preset.name}`}
                  >
                    <span className="
                      absolute -bottom-6 left-1/2 -translate-x-1/2
                      text-[0.6rem] text-inspector-text-muted
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200
                      whitespace-nowrap
                    ">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

ColorsSection.displayName = 'ColorsSection';

/**
 * Border és Radius szekció
 */
interface BorderRadiusSectionProps {
  border: BorderState;
  borderRadiusTab: BorderRadiusTab;
  onBorderRadiusTabChange: (tab: BorderRadiusTab) => void;
  onBorderChange: (key: string, value: any) => void;
  onRadiusChange: (corner: string, value: number) => void;
}

const BorderRadiusSection = memo<BorderRadiusSectionProps>(({
  border,
  borderRadiusTab,
  onBorderRadiusTabChange,
  onBorderChange,
  onRadiusChange
}) => {
  const handlePresetRadius = useCallback((value: number) => {
    if (borderRadiusTab === 'all') {
      onRadiusChange('all', value);
      onRadiusChange('tl', value);
      onRadiusChange('tr', value);
      onRadiusChange('br', value);
      onRadiusChange('bl', value);
    } else {
      onRadiusChange(borderRadiusTab, value);
    }
  }, [borderRadiusTab, onRadiusChange]);

  return (
    <AccordionItem 
      value="border-radius-section" 
      className="inspector-card overflow-hidden border-0"
    >
      <AccordionTrigger 
        className="
          py-3.5 px-4 text-xs font-medium text-inspector-text-muted 
          hover:no-underline inspector-accordion-trigger
          data-[state=open]:bg-inspector-section/60
          transition-all duration-200
        "
        aria-label="Border and radius settings"
      >
        <SectionHeader 
          icon={<Circle className="w-4 h-4" aria-hidden="true" />} 
          title="Border & Radius"
        />
      </AccordionTrigger>
      <AccordionContent className="pb-4 px-4 space-y-4 animate-accordion-down">
        {/* Border Width & Style */}
        <div className="space-y-2">
          <label className="text-[0.72rem] text-inspector-text-muted block font-semibold">
            Border
          </label>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput 
              label="Width" 
              value={border.width} 
              onChange={(v) => onBorderChange('width', v)} 
              placeholder="0px"
              aria-label="Border width"
            />
            <StyledSelect 
              value={border.style} 
              onChange={(v) => onBorderChange('style', v)} 
              options={BORDER_STYLE_OPTIONS} 
              aria-label="Border style"
            />
          </div>
        </div>

        {/* Border Radius - Modern Tab Selector */}
        <div className="space-y-2.5">
          <label 
            className="text-[0.72rem] text-inspector-text-muted block font-semibold" 
            id="border-radius-label"
          >
            Corner Radius
          </label>
          <div className="flex bg-inspector-section/70 rounded-xl overflow-hidden h-9 border border-inspector-border/25 p-1 gap-0.5">
            {(['all', 'tl', 'tr', 'br', 'bl'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => onBorderRadiusTabChange(tab)}
                className={`
                  flex-1 flex items-center justify-center text-[0.68rem] font-semibold rounded-lg
                  transition-all duration-200
                  ${borderRadiusTab === tab
                    ? 'bg-inspector-text text-inspector-bg shadow-sm'
                    : 'text-inspector-text-muted hover:text-inspector-text hover:bg-inspector-hover/60'
                  }
                `}
                title={tab === 'all' ? 'All Sides' : `${tab.toUpperCase()} corner`}
              >
                {tab === 'all' ? 'All' : tab.toUpperCase()}
              </button>
            ))}
          </div>
          <SliderControl
            icon={<Circle className="w-3 h-3" aria-hidden="true" />}
            label={borderRadiusTab === 'all' ? 'All Corners' : borderRadiusTab.toUpperCase()}
            value={border.radius[borderRadiusTab]}
            onChange={(v) => onRadiusChange(borderRadiusTab, v)}
            min={0}
            max={100}
            unit="px"
            aria-label={`Border radius for ${borderRadiusTab}`}
          />
        </div>

        {/* Radius Presets */}
        <div className="space-y-2.5 pt-3 border-t border-inspector-border/30">
          <span className="text-[0.65rem] text-inspector-text-muted block uppercase tracking-wider font-semibold">
            Quick Radius
          </span>
          <div className="flex flex-wrap gap-2">
            {RADIUS_PRESETS.map(preset => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetRadius(preset.value)}
                className="
                  px-3 py-2 text-[0.68rem] rounded-xl 
                  bg-inspector-section/70 hover:bg-inspector-hover 
                  border border-inspector-border/25 
                  text-inspector-text font-semibold 
                  transition-all duration-200
                  hover:shadow-sm hover:-translate-y-0.5
                  active:scale-[0.98]
                "
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

BorderRadiusSection.displayName = 'BorderRadiusSection';

/**
 * Shadow és Opacity szekció
 */
interface ShadowOpacitySectionProps {
  effects: EffectsState;
  onEffectChange: (key: string, value: any) => void;
}

const ShadowOpacitySection = memo<ShadowOpacitySectionProps>(({
  effects,
  onEffectChange
}) => {
  return (
    <AccordionItem 
      value="shadow-opacity-section" 
      className="inspector-card overflow-hidden border-0"
    >
      <AccordionTrigger 
        className="
          py-3.5 px-4 text-xs font-medium text-inspector-text-muted 
          hover:no-underline inspector-accordion-trigger
          data-[state=open]:bg-inspector-section/60
          transition-all duration-200
        "
        aria-label="Shadow and opacity settings"
      >
        <SectionHeader 
          icon={<Eye className="w-4 h-4" aria-hidden="true" />} 
          title="Shadow & Opacity"
        />
      </AccordionTrigger>
      <AccordionContent className="pb-4 px-4 space-y-4 animate-accordion-down">
        <div>
          <label 
            htmlFor="shadow-select" 
            className="text-[0.72rem] text-inspector-text-muted block mb-2 font-semibold"
          >
            Drop Shadow
          </label>
          <div className="relative">
            <select 
              id="shadow-select"
              value={effects.shadow}
              onChange={(e) => onEffectChange('shadow', e.target.value)}
              className="
                appearance-none cursor-pointer 
                hover:bg-inspector-hover transition-all duration-200 
                focus:outline-none focus:ring-2 focus:ring-inspector-active/40
                text-[0.75rem] text-inspector-text bg-inspector-section/70 
                w-full h-10 border-inspector-border/30 border rounded-xl 
                pr-10 pl-4 font-medium
              "
            >
              {SHADOW_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-inspector-text-muted pointer-events-none" />
          </div>
        </div>
        
        {/* Opacity Slider */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[0.72rem]">
            <div className="flex items-center gap-2 text-inspector-text-muted">
              <div className="p-1 rounded-lg bg-inspector-active/10">
                <Eye className="w-3.5 h-3.5 text-inspector-accent" aria-hidden="true" />
              </div>
              <span className="font-semibold">Opacity</span>
            </div>
            <span className="text-[0.75rem] font-mono text-inspector-text tabular-nums bg-inspector-section/50 px-2 py-0.5 rounded-lg">
              {effects.opacity}%
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="1" 
            value={effects.opacity}
            onChange={(e) => onEffectChange('opacity', Number(e.target.value))}
            className="inspector-slider w-full"
            style={{ '--slider-progress': `${effects.opacity}%` } as React.CSSProperties}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

ShadowOpacitySection.displayName = 'ShadowOpacitySection';

/**
 * Filters szekció
 */
interface FiltersSectionProps {
  effects: EffectsState;
  onEffectChange: (key: string, value: number) => void;
  onResetFilters: () => void;
}

const FiltersSection = memo<FiltersSectionProps>(({
  effects,
  onEffectChange,
  onResetFilters
}) => {
  const hasFilters = useMemo(() => hasActiveFilters(effects), [effects]);

  return (
    <AccordionItem 
      value="filters-section" 
      className="inspector-card overflow-hidden border-0"
    >
      <AccordionTrigger 
        className="
          py-3.5 px-4 text-xs font-medium text-inspector-text-muted 
          hover:no-underline inspector-accordion-trigger
          data-[state=open]:bg-inspector-section/60
          transition-all duration-200
        "
        aria-label="Filter effects settings"
      >
        <SectionHeader 
          icon={<Contrast className="w-4 h-4" aria-hidden="true" />} 
          title="Filters"
          badge={hasFilters ? '✓' : undefined}
        />
      </AccordionTrigger>
      <AccordionContent className="pb-4 px-4 space-y-4 animate-accordion-down">
        {/* Blur Filters */}
        <div className="space-y-2.5">
          <label className="text-[0.72rem] text-inspector-text-muted block font-semibold">
            Blur
          </label>
          <div className="space-y-3">
            <SliderControl 
              icon={<Droplet className="w-3 h-3 text-inspector-accent" aria-hidden="true" />} 
              label="Blur" 
              value={effects.blur} 
              onChange={(v) => onEffectChange('blur', v)} 
              min={0} 
              max={50} 
              unit="px" 
              aria-label="Blur filter strength"
            />
            <SliderControl 
              icon={<Droplet className="w-3 h-3 text-inspector-accent" aria-hidden="true" />} 
              label="Backdrop" 
              value={effects.backdropBlur} 
              onChange={(v) => onEffectChange('backdropBlur', v)} 
              min={0} 
              max={50} 
              unit="px" 
              aria-label="Backdrop blur filter strength"
            />
          </div>
        </div>

        {/* Color Adjustments */}
        <div className="space-y-2.5 pt-3 border-t border-inspector-border/30">
          <label className="text-[0.72rem] text-inspector-text-muted block font-semibold">
            Color Adjustments
          </label>
          <div className="space-y-3">
            <SliderControl 
              icon={<Sun className="w-3 h-3 text-inspector-accent" aria-hidden="true" />} 
              label="Brightness" 
              value={effects.brightness} 
              onChange={(v) => onEffectChange('brightness', v)} 
              min={0} 
              max={300} 
              unit="%" 
              aria-label="Brightness level"
            />
            <SliderControl 
              icon={<Contrast className="w-3 h-3 text-inspector-accent" aria-hidden="true" />} 
              label="Contrast" 
              value={effects.contrast} 
              onChange={(v) => onEffectChange('contrast', v)} 
              min={0} 
              max={300} 
              unit="%" 
              aria-label="Contrast level"
            />
            <SliderControl 
              icon={<Sun className="w-3 h-3 text-inspector-accent" aria-hidden="true" />} 
              label="Saturation" 
              value={effects.saturation} 
              onChange={(v) => onEffectChange('saturation', v)} 
              min={0} 
              max={300} 
              unit="%" 
              aria-label="Saturation level"
            />
          </div>
        </div>

        {/* Special Effects */}
        <div className="space-y-2.5 pt-3 border-t border-inspector-border/30">
          <label className="text-[0.72rem] text-inspector-text-muted block font-semibold">
            Special Effects
          </label>
          <div className="space-y-3">
            <SliderControl 
              icon={<Contrast className="w-3 h-3 text-inspector-accent" aria-hidden="true" />} 
              label="Hue Rotate" 
              value={effects.hueRotate} 
              onChange={(v) => onEffectChange('hueRotate', v)} 
              min={0} 
              max={360} 
              unit="°" 
              showGradient 
              gradientColors="linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" 
              aria-label="Hue rotation angle"
            />
            <SliderControl 
              icon={<FlipHorizontal className="w-3 h-3 text-inspector-accent" aria-hidden="true" />} 
              label="Grayscale" 
              value={effects.grayscale} 
              onChange={(v) => onEffectChange('grayscale', v)} 
              min={0} 
              max={100} 
              unit="%" 
              aria-label="Grayscale level"
            />
          </div>
        </div>

        {/* Reset Button */}
        {hasFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="
              w-full h-9 text-[0.72rem] gap-2 
              inline-flex items-center justify-center 
              rounded-xl border border-inspector-border/30 
              bg-inspector-section/60 hover:bg-red-500/15 
              text-inspector-text hover:text-red-400
              hover:border-red-500/30
              transition-all duration-200
              font-semibold
              active:scale-[0.98]
            "
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset All Filters
          </button>
        )}
      </AccordionContent>
    </AccordionItem>
  );
});

FiltersSection.displayName = 'FiltersSection';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Appearance szekció komponens
 * Vizuális stílusbeállítások kezelése
 */
export const AppearanceSection = memo<AppearanceSectionProps>(({
  state,
  borderRadiusTab,
  onBorderRadiusTabChange,
  updateNestedState,
  updateDeepNestedState,
}) => {
  // Destrukturáljuk a szükséges state részeket
  const { appearance, typography, border, effects } = state;

  // Memoizált callback-ek
  const handleColorChange = useCallback((
    key: string,
    nestedKey: string,
    value: string
  ) => {
    updateNestedState(key as any, nestedKey as any, value);
  }, [updateNestedState]);

  const handleBorderChange = useCallback((key: string, value: any) => {
    updateNestedState('border', key as any, value);
  }, [updateNestedState]);

  const handleRadiusChange = useCallback((corner: string, value: number) => {
    updateDeepNestedState('border', 'radius', corner as any, value);
  }, [updateDeepNestedState]);

  const handleEffectChange = useCallback((key: string, value: any) => {
    updateNestedState('effects', key as any, value);
  }, [updateNestedState]);

  const handleResetFilters = useCallback(() => {
    Object.entries(DEFAULT_FILTER_VALUES).forEach(([key, value]) => {
      updateNestedState('effects', key as any, value);
    });
  }, [updateNestedState]);

  // Memoizáljuk a state objektumokat
  const memoizedAppearance = useMemo(() => appearance, [appearance]);
  const memoizedTypography = useMemo(() => typography, [typography]);
  const memoizedBorder = useMemo(() => border, [border]);
  const memoizedEffects = useMemo(() => effects, [effects]);

  return (
    <>
      <ColorsSection
        appearance={memoizedAppearance}
        typography={memoizedTypography}
        border={memoizedBorder}
        onColorChange={handleColorChange}
      />

      <BorderRadiusSection
        border={memoizedBorder}
        borderRadiusTab={borderRadiusTab}
        onBorderRadiusTabChange={onBorderRadiusTabChange}
        onBorderChange={handleBorderChange}
        onRadiusChange={handleRadiusChange}
      />

      <ShadowOpacitySection
        effects={memoizedEffects}
        onEffectChange={handleEffectChange}
      />

      <FiltersSection
        effects={memoizedEffects}
        onEffectChange={handleEffectChange}
        onResetFilters={handleResetFilters}
      />
    </>
  );
});

AppearanceSection.displayName = 'AppearanceSection';

export default AppearanceSection;
