'use client';

import Link from 'next/link';
import { Team } from '@/lib/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';
import { EditTeamDialog } from './EditTeamDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';

interface TeamCardProps {
  team: Team;
  isManager?: boolean;
}

export function TeamCard({ team, isManager = false }: TeamCardProps) {
  return (
    <Card className="transition-all hover:shadow-lg hover:scale-[1.02]">
      <Link href={`/teams/${team.id}`} className="cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{team.name}</CardTitle>
            {team.age_group && (
              <Badge variant="secondary">{team.age_group}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {team.season && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{team.season}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>View Players</span>
            </div>
          </div>
        </CardContent>
      </Link>
      {isManager && (
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <EditTeamDialog team={team} />
            <DeleteTeamDialog team={team} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
