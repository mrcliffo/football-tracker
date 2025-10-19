import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Format role for display
  const roleDisplay = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  // Format dates
  const createdDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          View your account information
        </p>
      </div>

      {/* Profile Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">Full Name</span>
              </div>
              <p className="text-base pl-6">
                {profile.full_name || 'Not set'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email</span>
              </div>
              <p className="text-base pl-6 break-all">
                {user.email}
              </p>
            </div>

            {profile.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Phone</span>
                </div>
                <p className="text-base pl-6">
                  {profile.phone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your account status and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Role</span>
              </div>
              <div className="pl-6">
                <Badge variant={profile.role === 'manager' ? 'default' : 'secondary'}>
                  {roleDisplay}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Member Since</span>
              </div>
              <p className="text-base pl-6">
                {createdDate}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email Status</span>
              </div>
              <div className="pl-6">
                <Badge variant={user.email_confirmed_at ? 'default' : 'outline'}>
                  {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Card */}
      {profile.role === 'parent' && (
        <Card>
          <CardHeader>
            <CardTitle>Parent Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              As a parent, you have access to view statistics and match history for players
              that have been linked to your account by team managers. Contact your team manager
              if you need to link additional players.
            </p>
          </CardContent>
        </Card>
      )}

      {profile.role === 'manager' && (
        <Card>
          <CardHeader>
            <CardTitle>Manager Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              As a manager, you can create and manage teams, track matches, record player
              statistics, and link parent accounts to their children's player profiles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
