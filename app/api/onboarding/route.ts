import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { generateSpiritualProfile } from '@/lib/profiles/generate';
import { generateProfileSummary } from '@/lib/ai/openai';
import type { OnboardingAnswers } from '@/types';

const onboardingSchema = z.object({
  struggles: z.array(z.string()).min(1, 'Please select at least one struggle'),
  seeking: z.array(z.string()).min(1, 'Please select at least one need'),
  familiarity: z.string().min(1, 'Please select your Bible familiarity'),
  content_types: z.array(z.string()).min(1, 'Please select at least one content type'),
  tone: z.string().min(1, 'Please select a tone'),
  devotional_length: z.string().min(1, 'Please select a devotional length'),
  free_text: z.string().optional(),
});

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
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid onboarding data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const answers: OnboardingAnswers = {
      ...parsed.data,
      free_text: parsed.data.free_text ?? '',
    };

    // Upsert onboarding answers
    const { error: answersError } = await supabase
      .from('onboarding_answers')
      .upsert(
        {
          user_id: user.id,
          struggles: answers.struggles,
          seeking: answers.seeking,
          familiarity: answers.familiarity,
          content_types: answers.content_types,
          tone: answers.tone,
          devotional_length: answers.devotional_length,
          free_text: answers.free_text,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (answersError) {
      console.error('Error saving onboarding answers:', answersError);
    }

    // Generate spiritual profile
    const profileData = generateSpiritualProfile(answers);

    // Generate AI profile summary
    const aiSummary = await generateProfileSummary(answers);
    profileData.profile_summary = aiSummary;

    // Upsert spiritual profile
    const { error: profileError } = await supabase
      .from('spiritual_profiles')
      .upsert(
        {
          user_id: user.id,
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (profileError) {
      console.error('Error saving spiritual profile:', profileError);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    // Mark onboarding complete in profiles
    await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
