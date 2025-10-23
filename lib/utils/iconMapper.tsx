import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * Maps icon name strings to Lucide React icon components
 * Usage: const Icon = getIconComponent('trophy'); <Icon className="h-4 w-4" />
 */
export function getIconComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) {
    return Icons.Circle; // Default icon
  }

  // Convert to PascalCase for Lucide component names
  // e.g., "trophy" -> "Trophy", "alert-triangle" -> "AlertTriangle"
  const pascalCase = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // Get the icon component from Lucide
  const IconComponent = (Icons as any)[pascalCase];

  // Return the component or default to Circle if not found
  return IconComponent || Icons.Circle;
}

/**
 * List of commonly used Lucide icons for event types
 * Visit https://lucide.dev/icons for the full list
 */
export const COMMON_EVENT_ICONS = [
  { name: 'trophy', label: 'Trophy' },
  { name: 'target', label: 'Target' },
  { name: 'shield', label: 'Shield' },
  { name: 'shield-check', label: 'Shield Check' },
  { name: 'save', label: 'Save' },
  { name: 'hand', label: 'Hand' },
  { name: 'alert-triangle', label: 'Alert Triangle' },
  { name: 'alert-circle', label: 'Alert Circle' },
  { name: 'octagon', label: 'Octagon (Stop)' },
  { name: 'square', label: 'Square (Card)' },
  { name: 'arrow-right', label: 'Arrow Right' },
  { name: 'arrow-left', label: 'Arrow Left' },
  { name: 'arrow-up', label: 'Arrow Up' },
  { name: 'arrow-down', label: 'Arrow Down' },
  { name: 'move-up', label: 'Move Up' },
  { name: 'move-down', label: 'Move Down' },
  { name: 'circle-arrow-up', label: 'Circle Arrow Up' },
  { name: 'circle-arrow-down', label: 'Circle Arrow Down' },
  { name: 'users', label: 'Users' },
  { name: 'user-plus', label: 'User Plus' },
  { name: 'user-minus', label: 'User Minus' },
  { name: 'flag', label: 'Flag' },
  { name: 'whistle', label: 'Whistle' },
  { name: 'circle', label: 'Circle' },
  { name: 'zap', label: 'Zap (Lightning)' },
  { name: 'star', label: 'Star' },
  { name: 'flame', label: 'Flame' },
  { name: 'heart', label: 'Heart' },
  { name: 'cross', label: 'Cross' },
  { name: 'x', label: 'X' },
  { name: 'check', label: 'Check' },
  { name: 'thumbs-up', label: 'Thumbs Up' },
  { name: 'thumbs-down', label: 'Thumbs Down' },
];
