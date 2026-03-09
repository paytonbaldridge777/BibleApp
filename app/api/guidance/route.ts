import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { selectThemeForUser } from '@/lib/scripture/selector';
import { generateDailyGuidance } from '@/lib/ai/openai';
import type { SpiritualProfile, GuidanceFeedback } from '@/types';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: guidance } = await supabase
      .from('daily_guidance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    return NextResponse.json({ guidance });
  } catch (error) {
    console.error('GET guidance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as 'generate' | 'regenerate';

    if (!action || !['generate', 'regenerate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get spiritual profile
    const { data: profile } = await supabase
      .from('spiritual_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'No spiritual profile found' }, { status: 404 });
    }

    // Get feedback history
    const { data: feedbackHistory } = await supabase
      .from('guidance_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const today = new Date().toISOString().split('T')[0];

    // Select theme
    const theme = selectThemeForUser(
      profile as SpiritualProfile,
      (feedbackHistory ?? []) as GuidanceFeedback[]
    );

    // Generate AI content
    const aiContent = await generateDailyGuidance({
      theme,
      profile: profile as SpiritualProfile,
      today,
    });

    // Upsert guidance for today
    const { data: guidance, error: guidanceError } = await supabase
      .from('daily_guidance')
      .upsert(
        {
          user_id: user.id,
          date: today,
          theme: theme.theme,
          verse_reference: theme.verse_reference,
          verse_text: theme.verse_text,
          devotional: aiContent.devotional,
          prayer: aiContent.prayer,
          reflection: aiContent.reflection,
          theme_id: theme.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (guidanceError) {
      console.error('Error saving guidance:', guidanceError);
      return NextResponse.json({ error: 'Failed to save guidance' }, { status: 500 });
    }

    return NextResponse.json({ guidance });
  } catch (error) {
    console.error('POST guidance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
