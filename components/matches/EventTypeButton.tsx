'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventTypeButtonProps {
  icon: LucideIcon;
  label: string;
  variant: 'goal' | 'assist' | 'tackle' | 'save' | 'yellow' | 'red' | 'sub-on' | 'sub-off';
  onClick: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}

const variantStyles = {
  goal: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600',
  assist: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600',
  tackle: 'bg-green-500 hover:bg-green-600 text-white border-green-600',
  save: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600',
  yellow: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-yellow-500',
  red: 'bg-red-500 hover:bg-red-600 text-white border-red-600',
  'sub-on': 'bg-teal-500 hover:bg-teal-600 text-white border-teal-600',
  'sub-off': 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600',
};

export function EventTypeButton({
  icon: Icon,
  label,
  variant,
  onClick,
  isSelected = false,
  disabled = false,
}: EventTypeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 shadow-md min-h-[100px] active:scale-95',
        variantStyles[variant],
        isSelected && 'ring-4 ring-offset-2 ring-offset-background ring-primary scale-105',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={`Log ${label} event`}
      aria-pressed={isSelected}
    >
      <Icon className="h-8 w-8 mb-2" />
      <span className="text-sm font-bold text-center">{label}</span>
    </button>
  );
}
