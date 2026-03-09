import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import type { DailyGuidance, SpiritualProfile } from '@/types';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch spiritual profile
  const { data: profile } = await supabase
    .from('spiritual_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/onboarding');
  }

  // Fetch today's guidance
  const today = new Date().toISOString().split('T')[0];
  const { data: todayGuidance } = await supabase
    .from('daily_guidance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  // Fetch recent guidance (last 7 days)
  const { data: recentGuidance } = await supabase
    .from('daily_guidance')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(7);

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profile as SpiritualProfile}
      todayGuidance={todayGuidance as DailyGuidance | null}
      recentGuidance={(recentGuidance ?? []) as DailyGuidance[]}
    />
  );
}
