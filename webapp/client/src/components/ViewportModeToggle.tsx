import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { useViewportMode, ViewportMode } from '@/contexts/ViewportModeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ViewportModeToggleProps {
  variant?: 'select' | 'buttons';
  className?: string;
}

export function ViewportModeToggle({ variant = 'select', className = '' }: ViewportModeToggleProps) {
  const { mode, setMode } = useViewportMode();

  const modes: { value: ViewportMode; label: string; icon: React.ReactNode }[] = [
    { value: 'auto', label: 'Auto', icon: <Monitor className="w-4 h-4" /> },
    { value: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
    { value: 'desktop', label: 'Desktop', icon: <Tablet className="w-4 h-4" /> },
  ];

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {modes.map(({ value, label, icon }) => (
          <Button
            key={value}
            variant={mode === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode(value)}
            data-testid={`button-viewport-${value}`}
            className="flex items-center gap-1"
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Select value={mode} onValueChange={(value: ViewportMode) => setMode(value)}>
      <SelectTrigger className={`w-32 ${className}`} data-testid="select-viewport-mode">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {modes.map(({ value, label, icon }) => (
          <SelectItem key={value} value={value} data-testid={`select-viewport-mode-${value}`}>
            <div className="flex items-center gap-2">
              {icon}
              {label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}