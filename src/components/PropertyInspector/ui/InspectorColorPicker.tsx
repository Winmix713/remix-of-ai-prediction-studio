import React, { memo, useState, useCallback, useMemo } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Pipette, 
  RotateCcw, 
  Plus, 
  Trash2,
  GripVertical
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type ColorMode = 'solid' | 'gradient';
export type GradientType = 'linear' | 'radial';

export interface GradientStop {
  id: string;
  color: string;
  position: number;
}

export interface GradientValue {
  type: GradientType;
  angle: number;
  stops: GradientStop[];
}

export interface ColorPickerValue {
  mode: ColorMode;
  solid: string;
  gradient: GradientValue;
  alpha: number;
}

export interface InspectorColorPickerProps {
  value: ColorPickerValue | string | null;
  onChange: (value: ColorPickerValue | string | null) => void;
  label?: string;
  showAlpha?: boolean;
  showGradient?: boolean;
  presetColors?: string[];
  className?: string;
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PRESET_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1e293b',
];

const DEFAULT_GRADIENT: GradientValue = {
  type: 'linear',
  angle: 135,
  stops: [
    { id: '1', color: '#3b82f6', position: 0 },
    { id: '2', color: '#8b5cf6', position: 100 },
  ],
};

const DEFAULT_COLOR_VALUE: ColorPickerValue = {
  mode: 'solid',
  solid: '#3b82f6',
  gradient: DEFAULT_GRADIENT,
  alpha: 100,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parseValue(value: ColorPickerValue | string | null): ColorPickerValue {
  if (!value) return DEFAULT_COLOR_VALUE;
  if (typeof value === 'string') {
    return { ...DEFAULT_COLOR_VALUE, solid: value };
  }
  return value;
}

function generateGradientCSS(gradient: GradientValue, alpha: number): string {
  const stops = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  
  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${gradient.angle}deg, ${stops})`;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Color preview swatch
 */
const ColorSwatch = memo<{
  color: string | null;
  gradient?: GradientValue;
  mode: ColorMode;
  alpha: number;
  size?: 'sm' | 'md' | 'lg';
}>(({ color, gradient, mode, alpha, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const style: React.CSSProperties = mode === 'gradient' && gradient
    ? { background: generateGradientCSS(gradient, alpha), opacity: alpha / 100 }
    : { backgroundColor: color || 'transparent', opacity: alpha / 100 };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full border border-inspector-border 
        shadow-inner relative overflow-hidden
      `}
    >
      {/* Checkerboard pattern for transparency */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%)
          `,
          backgroundSize: '6px 6px',
          backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
        }}
      />
      <div className="absolute inset-0 rounded-full" style={style} />
    </div>
  );
});

ColorSwatch.displayName = 'ColorSwatch';

/**
 * Gradient stop editor
 */
const GradientStopEditor = memo<{
  stops: GradientStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string) => void;
  onUpdateStop: (id: string, updates: Partial<GradientStop>) => void;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  gradient: GradientValue;
}>(({ stops, selectedStopId, onSelectStop, onUpdateStop, onAddStop, onRemoveStop, gradient }) => {
  return (
    <div className="space-y-2">
      {/* Gradient preview bar */}
      <div 
        className="relative h-8 rounded-lg overflow-hidden cursor-pointer"
        style={{ background: generateGradientCSS(gradient, 100) }}
      >
        {stops.map(stop => (
          <button
            key={stop.id}
            type="button"
            onClick={() => onSelectStop(stop.id)}
            className={`
              absolute top-1/2 -translate-y-1/2 -translate-x-1/2
              w-4 h-4 rounded-full border-2 shadow-md
              transition-transform duration-100
              ${selectedStopId === stop.id 
                ? 'border-white scale-110 ring-2 ring-inspector-active' 
                : 'border-inspector-border hover:scale-105'
              }
            `}
            style={{ 
              left: `${stop.position}%`,
              backgroundColor: stop.color,
            }}
            aria-label={`Color stop at ${stop.position}%`}
          />
        ))}
      </div>

      {/* Stop controls */}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddStop}
          className="h-6 text-[0.65rem] gap-1 flex-1"
        >
          <Plus className="w-3 h-3" />
          Add Stop
        </Button>
        {stops.length > 2 && selectedStopId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemoveStop(selectedStopId)}
            className="h-6 text-[0.65rem] gap-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
});

GradientStopEditor.displayName = 'GradientStopEditor';

/**
 * Preset colors grid
 */
const PresetColorsGrid = memo<{
  colors: string[];
  onSelect: (color: string) => void;
  recentColors?: string[];
}>(({ colors, onSelect, recentColors = [] }) => (
  <div className="space-y-2">
    {recentColors.length > 0 && (
      <div className="space-y-1">
        <span className="text-[0.6rem] text-inspector-text-muted uppercase tracking-wider">
          Recent
        </span>
        <div className="flex flex-wrap gap-1">
          {recentColors.slice(0, 6).map((color, i) => (
            <button
              key={`recent-${i}`}
              type="button"
              onClick={() => onSelect(color)}
              className="
                w-5 h-5 rounded border border-inspector-border
                hover:scale-110 transition-transform duration-100
                shadow-sm
              "
              style={{ backgroundColor: color }}
              aria-label={`Select recent color ${color}`}
            />
          ))}
        </div>
      </div>
    )}
    <div className="space-y-1">
      <span className="text-[0.6rem] text-inspector-text-muted uppercase tracking-wider">
        Presets
      </span>
      <div className="grid grid-cols-6 gap-1">
        {colors.map((color, i) => (
          <button
            key={`preset-${i}`}
            type="button"
            onClick={() => onSelect(color)}
            className="
              w-5 h-5 rounded border border-inspector-border
              hover:scale-110 transition-transform duration-100
              shadow-sm
            "
            style={{ backgroundColor: color }}
            aria-label={`Select preset color ${color}`}
          />
        ))}
      </div>
    </div>
  </div>
));

PresetColorsGrid.displayName = 'PresetColorsGrid';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * InspectorColorPicker - Modern color picker with gradient support
 * Features: Solid/Gradient modes, alpha slider, preset colors, gradient editor
 */
export const InspectorColorPicker: React.FC<InspectorColorPickerProps> = memo(({
  value,
  onChange,
  label = 'Color',
  showAlpha = true,
  showGradient = true,
  presetColors = DEFAULT_PRESET_COLORS,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const colorValue = useMemo(() => parseValue(value), [value]);

  const displayValue = useMemo(() => {
    if (colorValue.mode === 'gradient') {
      return 'Gradient';
    }
    return colorValue.solid || 'No color';
  }, [colorValue]);

  const handleSolidColorChange = useCallback((color: string) => {
    onChange({ ...colorValue, solid: color, mode: 'solid' });
  }, [colorValue, onChange]);

  const handleModeChange = useCallback((mode: ColorMode) => {
    onChange({ ...colorValue, mode });
  }, [colorValue, onChange]);

  const handleAlphaChange = useCallback((values: number[]) => {
    onChange({ ...colorValue, alpha: values[0] });
  }, [colorValue, onChange]);

  const handleGradientTypeChange = useCallback((type: GradientType) => {
    onChange({
      ...colorValue,
      gradient: { ...colorValue.gradient, type },
    });
  }, [colorValue, onChange]);

  const handleGradientAngleChange = useCallback((values: number[]) => {
    onChange({
      ...colorValue,
      gradient: { ...colorValue.gradient, angle: values[0] },
    });
  }, [colorValue, onChange]);

  const handleStopColorChange = useCallback((color: string) => {
    if (!selectedStopId) return;
    const newStops = colorValue.gradient.stops.map(s =>
      s.id === selectedStopId ? { ...s, color } : s
    );
    onChange({
      ...colorValue,
      gradient: { ...colorValue.gradient, stops: newStops },
    });
  }, [colorValue, selectedStopId, onChange]);

  const handleAddStop = useCallback(() => {
    const newStop: GradientStop = {
      id: generateId(),
      color: '#8b5cf6',
      position: 50,
    };
    onChange({
      ...colorValue,
      gradient: {
        ...colorValue.gradient,
        stops: [...colorValue.gradient.stops, newStop],
      },
    });
    setSelectedStopId(newStop.id);
  }, [colorValue, onChange]);

  const handleRemoveStop = useCallback((id: string) => {
    const newStops = colorValue.gradient.stops.filter(s => s.id !== id);
    onChange({
      ...colorValue,
      gradient: { ...colorValue.gradient, stops: newStops },
    });
    setSelectedStopId(null);
  }, [colorValue, onChange]);

  const handlePresetSelect = useCallback((color: string) => {
    if (colorValue.mode === 'gradient' && selectedStopId) {
      handleStopColorChange(color);
    } else {
      handleSolidColorChange(color);
    }
    setRecentColors(prev => [color, ...prev.filter(c => c !== color)].slice(0, 6));
  }, [colorValue.mode, selectedStopId, handleStopColorChange, handleSolidColorChange]);

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const currentColor = useMemo(() => {
    if (colorValue.mode === 'gradient' && selectedStopId) {
      return colorValue.gradient.stops.find(s => s.id === selectedStopId)?.color || '#000000';
    }
    return colorValue.solid || '#000000';
  }, [colorValue, selectedStopId]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`
            flex items-center gap-2 h-8 px-2.5
            bg-inspector-input-bg border border-inspector-input-border
            rounded-lg hover:bg-inspector-hover
            transition-all duration-150
            text-xs text-inspector-text
            ${className}
          `}
          aria-label={`${label} color picker`}
        >
          <ColorSwatch
            color={colorValue.solid}
            gradient={colorValue.gradient}
            mode={colorValue.mode}
            alpha={colorValue.alpha}
            size="md"
          />
          <span className="truncate max-w-20 font-mono text-[0.65rem]">
            {displayValue}
          </span>
          <Palette className="w-3 h-3 text-inspector-text-muted ml-auto" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-64 p-3 bg-inspector-panel border-inspector-border"
        align="start"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Mode selector */}
          {showGradient && (
            <Tabs 
              value={colorValue.mode} 
              onValueChange={(v) => handleModeChange(v as ColorMode)}
            >
              <TabsList className="grid grid-cols-2 h-7 bg-inspector-section">
                <TabsTrigger value="solid" className="text-[0.65rem]">
                  Solid
                </TabsTrigger>
                <TabsTrigger value="gradient" className="text-[0.65rem]">
                  Gradient
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Color picker area */}
          {colorValue.mode === 'solid' ? (
            <div className="space-y-3">
              <HexColorPicker 
                color={colorValue.solid || '#000000'} 
                onChange={handleSolidColorChange}
                style={{ width: '100%', height: '140px' }}
              />
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[0.6rem] text-inspector-text-muted">
                    #
                  </span>
                  <HexColorInput
                    color={colorValue.solid || ''}
                    onChange={handleSolidColorChange}
                    className="
                      w-full h-7 pl-5 pr-2 
                      bg-inspector-input-bg border border-inspector-input-border
                      rounded text-[0.65rem] font-mono text-inspector-text
                      focus:outline-none focus:ring-1 focus:ring-inspector-active
                    "
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 px-2 text-inspector-text-muted hover:text-inspector-text"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Gradient editor */}
              <GradientStopEditor
                stops={colorValue.gradient.stops}
                selectedStopId={selectedStopId}
                onSelectStop={setSelectedStopId}
                onUpdateStop={() => {}}
                onAddStop={handleAddStop}
                onRemoveStop={handleRemoveStop}
                gradient={colorValue.gradient}
              />

              {/* Selected stop color picker */}
              {selectedStopId && (
                <HexColorPicker 
                  color={currentColor} 
                  onChange={handleStopColorChange}
                  style={{ width: '100%', height: '100px' }}
                />
              )}

              {/* Gradient controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6rem] text-inspector-text-muted">Type</span>
                  <div className="flex rounded-full border border-inspector-border bg-inspector-section p-0.5">
                    {(['linear', 'radial'] as GradientType[]).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleGradientTypeChange(type)}
                        className={`
                          px-2 py-0.5 text-[0.6rem] rounded-full
                          transition-colors duration-150
                          ${colorValue.gradient.type === type
                            ? 'bg-inspector-active text-inspector-bg'
                            : 'text-inspector-text-muted hover:text-inspector-text'
                          }
                        `}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {colorValue.gradient.type === 'linear' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.6rem] text-inspector-text-muted">Angle</span>
                      <span className="text-[0.6rem] font-mono text-inspector-text-muted">
                        {colorValue.gradient.angle}°
                      </span>
                    </div>
                    <Slider
                      value={[colorValue.gradient.angle]}
                      onValueChange={handleGradientAngleChange}
                      min={0}
                      max={360}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alpha slider */}
          {showAlpha && (
            <div className="space-y-1 pt-2 border-t border-inspector-border">
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] text-inspector-text-muted">Opacity</span>
                <span className="text-[0.6rem] font-mono text-inspector-text-muted">
                  {colorValue.alpha}%
                </span>
              </div>
              <Slider
                value={[colorValue.alpha]}
                onValueChange={handleAlphaChange}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Preset colors */}
          <div className="pt-2 border-t border-inspector-border">
            <PresetColorsGrid
              colors={presetColors}
              onSelect={handlePresetSelect}
              recentColors={recentColors}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

InspectorColorPicker.displayName = 'InspectorColorPicker';

export default InspectorColorPicker;
