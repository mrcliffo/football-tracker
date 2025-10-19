import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'manager') {
    redirect('/teams');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage events and rewards for your football tracking system
          </p>
        </div>

        <div className="flex gap-8">
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              <Link
                href="/admin"
                className="block px-4 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/admin/events"
                className="block px-4 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                Manage Events
              </Link>
              <Link
                href="/admin/rewards"
                className="block px-4 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                Manage Rewards
              </Link>
            </nav>
          </aside>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
