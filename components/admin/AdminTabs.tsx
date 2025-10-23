'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Trophy } from 'lucide-react';

export function AdminTabs() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine which tab is active based on pathname
  const activeTab = pathname === '/admin/rewards' ? 'rewards' : 'events';

  const handleTabChange = (value: string) => {
    if (value === 'events') {
      router.push('/admin/events');
    } else if (value === 'rewards') {
      router.push('/admin/rewards');
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="events">
          <Zap className="mr-2 h-4 w-4" />
          Events
        </TabsTrigger>
        <TabsTrigger value="rewards">
          <Trophy className="mr-2 h-4 w-4" />
          Rewards
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
