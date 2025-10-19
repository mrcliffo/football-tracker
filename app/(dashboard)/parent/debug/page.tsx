import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ParentDebugPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Test 1: Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Test 2: Get team_members records
  const { data: teamMembers, error: teamMembersError } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', user.id);

  // Test 3: Get players via policy
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*');

  // Test 4: Get teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*');

  // Test 5: Try parent_children_view
  const { data: viewData, error: viewError } = await supabase
    .from('parent_children_view')
    .select('*')
    .eq('parent_id', user.id);

  // Test 6: Try raw query with joins
  const { data: rawQuery, error: rawError } = await supabase
    .from('team_members')
    .select(`
      *,
      player:players(*),
      team:teams(*)
    `)
    .eq('user_id', user.id);

  // Test 7: Try RPC function
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_parent_children', { parent_user_id: user.id });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Parent Access Debug Page</h1>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>1. Current User</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ id: user.id, email: user.email }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>2. Profile Data</CardTitle>
        </CardHeader>
        <CardContent>
          {profileError ? (
            <div className="text-red-500">Error: {profileError.message}</div>
          ) : (
            <pre className="text-xs overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>3. Team Members (Direct Query)</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembersError ? (
            <div className="text-red-500">Error: {teamMembersError.message}</div>
          ) : (
            <div>
              <p className="mb-2">Found {teamMembers?.length || 0} records</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(teamMembers, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader>
          <CardTitle>4. Players (Via RLS Policy)</CardTitle>
        </CardHeader>
        <CardContent>
          {playersError ? (
            <div className="text-red-500">Error: {playersError.message}</div>
          ) : (
            <div>
              <p className="mb-2">Found {players?.length || 0} players</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(players, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardHeader>
          <CardTitle>5. Teams (Via RLS Policy)</CardTitle>
        </CardHeader>
        <CardContent>
          {teamsError ? (
            <div className="text-red-500">Error: {teamsError.message}</div>
          ) : (
            <div>
              <p className="mb-2">Found {teams?.length || 0} teams</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(teams, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Data */}
      <Card>
        <CardHeader>
          <CardTitle>6. Parent Children View</CardTitle>
        </CardHeader>
        <CardContent>
          {viewError ? (
            <div className="text-red-500">Error: {viewError.message}</div>
          ) : (
            <div>
              <p className="mb-2">Found {viewData?.length || 0} children</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(viewData, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Query with Joins */}
      <Card>
        <CardHeader>
          <CardTitle>7. Raw Query with Joins</CardTitle>
        </CardHeader>
        <CardContent>
          {rawError ? (
            <div className="text-red-500">Error: {rawError.message}</div>
          ) : (
            <div>
              <p className="mb-2">Found {rawQuery?.length || 0} records</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(rawQuery, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RPC Function */}
      <Card>
        <CardHeader>
          <CardTitle>8. RPC Function (get_parent_children)</CardTitle>
        </CardHeader>
        <CardContent>
          {rpcError ? (
            <div className="text-red-500">Error: {rpcError.message}</div>
          ) : (
            <div>
              <p className="mb-2">Found {rpcData?.length || 0} children</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(rpcData, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
