import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import type { DailyGuidance, SpiritualProfile } from '@/types';
export const runtime = 'edge';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('spiritual_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/onboarding');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: todayGuidance } = await supabase
    .from('daily_guidance')
    .select('*')
    .eq('user_id', user.id)
    .eq('guidance_date', today)
    .maybeSingle();

  const { data: recentGuidance } = await supabase
    .from('daily_guidance')
    .select('*')
    .eq('user_id', user.id)
    .neq('guidance_date', today)
    .order('guidance_date', { ascending: false })
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
