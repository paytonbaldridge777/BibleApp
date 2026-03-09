import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';

const feedbackSchema = z.object({
  guidance_id: z.string().uuid(),
  feedback_type: z.enum(['helpful', 'not_relevant', 'favorite']),
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
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { guidance_id, feedback_type } = parsed.data;

    // Upsert feedback
    const { error: feedbackError } = await supabase.from('guidance_feedback').upsert(
      {
        user_id: user.id,
        guidance_id,
        feedback_type,
      },
      { onConflict: 'user_id,guidance_id,feedback_type' }
    );

    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    // If favorite, also insert into favorites table
    if (feedback_type === 'favorite') {
      await supabase
        .from('favorites')
        .upsert(
          { user_id: user.id, guidance_id },
          { onConflict: 'user_id,guidance_id' }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
