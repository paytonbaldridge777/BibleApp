import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import type { OnboardingAnswers } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

if (!API_BASE && typeof window !== 'undefined') {
  console.warn(
    '[api] NEXT_PUBLIC_API_BASE_URL is not set. API requests will fail. ' +
      'Set this variable to your Cloudflare Worker URL.'
  );
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(init.headers as HeadersInit);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export async function postOnboarding(data: OnboardingAnswers): Promise<void> {
  const res = await apiFetch('/onboarding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? 'Failed to save your profile');
  }
}

export async function postGuidance(action: 'generate' | 'regenerate') {
  const res = await apiFetch('/guidance', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? 'Failed to generate guidance');
  }
  return res.json();
}

export async function postFeedback(
  guidanceId: string,
  feedbackType: 'helpful' | 'not_relevant' | 'favorite'
): Promise<void> {
  const res = await apiFetch('/feedback', {
    method: 'POST',
    body: JSON.stringify({ guidance_id: guidanceId, feedback_type: feedbackType }),
  });
  if (!res.ok) {
    throw new Error('Failed to send feedback');
  }
}
