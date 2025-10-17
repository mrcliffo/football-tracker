'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/authStore';

export function useAuth() {
  const router = useRouter();
  const { user, profile, isLoading, setUser, setProfile, setIsLoading, clear } =
    useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);

          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } else {
        clear();
      }

      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setIsLoading, clear, router]);

  const signOut = async () => {
    console.log('useAuth signOut called');
    try {
      // Call server-side sign out API
      console.log('Calling /api/auth/signout');
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('Sign out API failed');
      }

      console.log('API sign out completed, clearing state');
      clear();
      console.log('Redirecting to login');
      window.location.href = '/login';
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      // Even if there's an error, clear local state and redirect
      clear();
      window.location.href = '/login';
    }
  };

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isManager: profile?.role === 'manager',
    isParent: profile?.role === 'parent',
    signOut,
  };
}
