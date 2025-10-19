import { createClient } from '@/lib/supabase/server';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { TeamCard } from '@/components/teams/TeamCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default async function TeamsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Get teams
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching teams:', error);
  }

  const isManager = profile?.role === 'manager';
  const hasTeams = teams && teams.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Teams</h1>
          <p className="text-muted-foreground">
            {isManager
              ? 'Manage your football teams and players'
              : 'View teams and player statistics'}
          </p>
        </div>
        {isManager && <CreateTeamDialog />}
      </div>

      {!isManager && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You're registered as a Parent. Contact your team manager to be added to a team.
          </AlertDescription>
        </Alert>
      )}

      {!hasTeams && isManager && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You don't have any teams yet. Click "Create Team" to get started!
          </AlertDescription>
        </Alert>
      )}

      {hasTeams && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} isManager={isManager} />
          ))}
        </div>
      )}
    </div>
  );
}
