import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import type { OnboardingAnswers } from '@/types';

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

if (!API_BASE && typeof window !== 'undefined') {
  console.warn(
    '[api] NEXT_PUBLIC_API_BASE_URL is not set. API requests will fail. ' +
      'Set this variable to your Cloudflare Worker URL.'
  );
}

function normalizePath(path: string) {
  if (!path.startsWith('/')) return `/${path}`;
  return `/${path.replace(/^\/+/, '')}`;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  const headers = new Headers(init.headers as HeadersInit);

  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const url = `${API_BASE}${normalizePath(path)}`;
  return fetch(url, { ...init, headers });
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

  const json = await res.json();

  if (!res.ok) {
  const message = json.details
    ? `${json.error ?? 'Failed to generate guidance'}: ${json.details}`
    : (json.error ?? 'Failed to generate guidance');

  throw new Error(message);
}

  return json;
}

export async function getGuidance() {
  const res = await apiFetch('/guidance');
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? 'Failed to load guidance');
  }

  return json;
}

export async function postFeedback(payload: {
  guidance_id: string;
  helpful: boolean;
  note?: string;
}) {
  const res = await apiFetch('/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? 'Failed to save feedback');
  }

  return json;
}

export async function saveFavorite(guidanceId: string) {
  const res = await apiFetch('/favorites', {
    method: 'POST',
    body: JSON.stringify({ guidance_id: guidanceId }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? 'Failed to save favorite');
  }

  return json;
}

export async function getFavorites() {
  const res = await apiFetch('/favorites');
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? 'Failed to load favorites');
  }

  return json;
}

export async function removeFavorite(guidanceId: string) {
  const res = await apiFetch('/favorites', {
    method: 'DELETE',
    body: JSON.stringify({ guidance_id: guidanceId }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? 'Failed to remove favorite');
  }

  return json;
}
