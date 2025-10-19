import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RewardsManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rewards Management</h2>
        <p className="text-muted-foreground">
          Manage rewards for player achievements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Rewards management functionality will be implemented next
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will allow you to add, edit, and remove rewards that players can earn
            based on their performance in matches and throughout the season.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
