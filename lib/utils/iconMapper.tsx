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
 *
 * Icons are organized by category for easy browsing
 */
export const COMMON_EVENT_ICONS = [
  // Scoring & Goals
  { name: 'volleyball', label: 'Volleyball (Football/Soccer Ball)' },
  { name: 'football', label: 'Football (American)' },
  { name: 'goal', label: 'Goal Net' },
  { name: 'trophy', label: 'Trophy' },
  { name: 'target', label: 'Target' },
  { name: 'crosshair', label: 'Crosshair' },
  { name: 'circle-dot', label: 'Circle Dot' },
  { name: 'rocket', label: 'Rocket' },
  { name: 'zap', label: 'Lightning' },
  { name: 'flame', label: 'Flame' },
  { name: 'sparkles', label: 'Sparkles' },
  { name: 'star', label: 'Star' },
  { name: 'award', label: 'Award' },

  // Defense & Saves
  { name: 'shield', label: 'Shield' },
  { name: 'shield-check', label: 'Shield Check' },
  { name: 'shield-alert', label: 'Shield Alert' },
  { name: 'save', label: 'Save' },
  { name: 'hand', label: 'Hand' },
  { name: 'hand-metal', label: 'Hand Metal' },
  { name: 'shield-ban', label: 'Shield Ban' },
  { name: 'shield-x', label: 'Shield X' },

  // Cards & Fouls
  { name: 'square', label: 'Square (Card)' },
  { name: 'octagon', label: 'Octagon (Red Card)' },
  { name: 'triangle-alert', label: 'Triangle Alert' },
  { name: 'alert-triangle', label: 'Alert Triangle' },
  { name: 'alert-circle', label: 'Alert Circle' },
  { name: 'alert-octagon', label: 'Alert Octagon' },
  { name: 'ban', label: 'Ban' },
  { name: 'x-circle', label: 'X Circle' },
  { name: 'x-octagon', label: 'X Octagon' },
  { name: 'skull', label: 'Skull' },

  // Substitutions
  { name: 'arrow-right', label: 'Arrow Right' },
  { name: 'arrow-left', label: 'Arrow Left' },
  { name: 'arrow-up', label: 'Arrow Up' },
  { name: 'arrow-down', label: 'Arrow Down' },
  { name: 'arrow-up-circle', label: 'Arrow Up Circle' },
  { name: 'arrow-down-circle', label: 'Arrow Down Circle' },
  { name: 'circle-arrow-up', label: 'Circle Arrow Up' },
  { name: 'circle-arrow-down', label: 'Circle Arrow Down' },
  { name: 'move-up', label: 'Move Up' },
  { name: 'move-down', label: 'Move Down' },
  { name: 'replace', label: 'Replace' },
  { name: 'repeat', label: 'Repeat' },
  { name: 'refresh-cw', label: 'Refresh' },

  // Players & Team
  { name: 'users', label: 'Users' },
  { name: 'user', label: 'User' },
  { name: 'user-plus', label: 'User Plus' },
  { name: 'user-minus', label: 'User Minus' },
  { name: 'user-check', label: 'User Check' },
  { name: 'user-x', label: 'User X' },
  { name: 'user-round', label: 'User Round' },

  // Flags & Signals
  { name: 'flag', label: 'Flag' },
  { name: 'flag-triangle-right', label: 'Flag Triangle' },
  { name: 'flag-off', label: 'Flag Off' },
  { name: 'corner-down-right', label: 'Corner Kick' },
  { name: 'corner-up-right', label: 'Corner Up' },

  // Actions & Events
  { name: 'whistle', label: 'Whistle' },
  { name: 'timer', label: 'Timer' },
  { name: 'clock', label: 'Clock' },
  { name: 'stopwatch', label: 'Stopwatch' },
  { name: 'hourglass', label: 'Hourglass' },
  { name: 'play', label: 'Play' },
  { name: 'pause', label: 'Pause' },
  { name: 'square-play', label: 'Square Play' },

  // Judgement & Status
  { name: 'check', label: 'Check' },
  { name: 'check-circle', label: 'Check Circle' },
  { name: 'x', label: 'X' },
  { name: 'cross', label: 'Cross' },
  { name: 'thumbs-up', label: 'Thumbs Up' },
  { name: 'thumbs-down', label: 'Thumbs Down' },
  { name: 'circle', label: 'Circle' },
  { name: 'circle-check', label: 'Circle Check' },

  // Special Events
  { name: 'heart', label: 'Heart' },
  { name: 'heart-pulse', label: 'Heart Pulse' },
  { name: 'activity', label: 'Activity' },
  { name: 'trending-up', label: 'Trending Up' },
  { name: 'trending-down', label: 'Trending Down' },
  { name: 'minus', label: 'Minus' },
  { name: 'plus', label: 'Plus' },
  { name: 'equal', label: 'Equal' },
  { name: 'info', label: 'Info' },
  { name: 'help-circle', label: 'Help Circle' },
  { name: 'message-circle', label: 'Message' },
  { name: 'megaphone', label: 'Megaphone' },
  { name: 'eye', label: 'Eye' },
  { name: 'eye-off', label: 'Eye Off' },
  { name: 'camera', label: 'Camera' },
  { name: 'video', label: 'Video' },
];
