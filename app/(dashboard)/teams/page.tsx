import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Teams</h1>
        <p className="text-muted-foreground">Manage your football teams and players</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
          <CardDescription>
            You're now logged in. Team management features are coming next!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is where you'll see your teams list.</p>
        </CardContent>
      </Card>
    </div>
  );
}
