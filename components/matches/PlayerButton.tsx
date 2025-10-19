'use client';

import { Player } from '@/lib/types/database';
import { cn } from '@/lib/utils';

interface PlayerButtonProps {
  player: Player;
  onClick: () => void;
  disabled?: boolean;
}

export function PlayerButton({ player, onClick, disabled = false }: PlayerButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-accent hover:border-primary transition-all duration-200 shadow-sm active:scale-95 min-h-[70px]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={`Select ${player.name}`}
    >
      <div className="flex items-center space-x-3">
        {player.squad_number && (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
            {player.squad_number}
          </div>
        )}
        <span className="font-semibold text-lg">{player.name}</span>
      </div>
      {player.position && (
        <span className="text-xs text-muted-foreground uppercase font-medium px-2 py-1 bg-muted rounded">
          {player.position}
        </span>
      )}
    </button>
  );
}
