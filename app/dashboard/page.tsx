import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import type {
  DailyGuidance,
  GuidancePassage,
  GuidanceTheme,
} from '@/lib/api';
import type { SpiritualProfile } from '@/types';

export const runtime = 'edge';

type GuidanceWithRelations = DailyGuidance & {
  passage?: GuidancePassage | null;
  matched_theme?: GuidanceTheme | null;
};

async function enrichGuidance(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  guidance: DailyGuidance | null
): Promise<GuidanceWithRelations | null> {
  if (!guidance) return null;

  let passage: GuidancePassage | null = null;
  let matched_theme: GuidanceTheme | null = null;

  if (guidance.passage_id) {
    const { data: passageData } = await supabase
      .from('scripture_passages')
      .select('id, reference')
      .eq('id', guidance.passage_id)
      .maybeSingle();

    if (passageData) {
      passage = {
        id: passageData.id,
        reference: passageData.reference,
        text: '',
      };
    }
  }

  if (guidance.theme_id) {
    const { data: themeData } = await supabase
      .from('scripture_themes')
      .select('id, slug, name')
      .eq('id', guidance.theme_id)
      .maybeSingle();

    if (themeData) {
      matched_theme = themeData;
    }
  }

  return {
    ...guidance,
    passage,
    matched_theme,
  };
}

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

  try {
  const today = new Date().toISOString().split('T')[0];

  const { data: todayGuidanceRaw } = await supabase
    .from('daily_guidance')
    .select('*')
    .eq('user_id', user.id)
    .eq('guidance_date', today)
    .maybeSingle();

  const { data: recentGuidanceRaw } = await supabase
    .from('daily_guidance')
    .select('*')
    .eq('user_id', user.id)
    .neq('guidance_date', today)
    .order('guidance_date', { ascending: false })
    .limit(7);

  const todayGuidance = await enrichGuidance(
    supabase,
    todayGuidanceRaw as DailyGuidance | null
  );

  const recentGuidance = await Promise.all(
    ((recentGuidanceRaw ?? []) as DailyGuidance[]).map((item) =>
      enrichGuidance(supabase, item)
    )
  );

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profile as SpiritualProfile}
      todayGuidance={todayGuidance}
      recentGuidance={recentGuidance.filter(Boolean) as GuidanceWithRelations[]}
    />
  );
} catch (err) {
    const message =
      err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ''}` : String(err);

    return (
      <pre style={{ padding: 16, whiteSpace: 'pre-wrap' }}>
        Dashboard SSR error:
        {'\n\n'}
        {message}
      </pre>
    );
  }
}