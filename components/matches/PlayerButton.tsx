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
        'flex flex-col items-center justify-center p-3 rounded-lg border-2 border-border bg-card hover:bg-accent hover:border-primary transition-all duration-200 shadow-sm active:scale-95 min-h-[85px] gap-1',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={`Select ${player.name}`}
    >
      {player.squad_number && (
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-base">
          {player.squad_number}
        </div>
      )}
      <span className="font-semibold text-sm text-center leading-tight">{player.name}</span>
      {player.position && (
        <span className="text-[10px] text-muted-foreground uppercase font-medium px-1.5 py-0.5 bg-muted rounded">
          {player.position}
        </span>
      )}
    </button>
  );
}
