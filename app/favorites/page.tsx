import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Favorite } from '@/types';

export const runtime = 'edge';

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export default async function FavoritesPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  if (!API_BASE || !token) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <span className="text-lg font-bold text-amber-700">Shepherd</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            Favorites could not be loaded due to the API configuration is missing.
          </div>
        </main>
      </div>
    );
  }

  const res = await fetch(`${API_BASE}/favorites`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  let items: Favorite[] = [];

  if (res.ok) {
    const json = await res.json();
    items = json.favorites ?? [];
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <span className="text-lg font-bold text-amber-700">Shepherd</span>
            </Link>
            <nav className="hidden sm:flex gap-4">
              <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-700">
                Dashboard
              </Link>
              <Link href="/favorites" className="text-sm font-medium text-stone-800">
                Favorites
              </Link>
              <Link href="/settings/profile" className="text-sm text-stone-500 hover:text-stone-700">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Saved Favorites</h1>
          <p className="text-stone-500 mt-1">
            {items.length > 0
              ? `${items.length} saved guidance${items.length !== 1 ? 's' : ''}`
              : 'No favorites have been saved yet'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">No favorites yet</h2>
            <p className="text-stone-500 text-sm mb-6">
              When you find guidance that resonates, save it here for easy access.
            </p>
            <Link
              href="/dashboard"
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {items.map((item) => {
              const g = item.guidance;
              if (!g) return null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
                  data-guidance-source={g.generation_source ?? 'unknown'}
                  data-guidance-id={g.id}
                >
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-stone-500 text-xs">{g.guidance_date}</p>
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                        {item.matched_theme?.name || g.title || 'Guidance'}
                      </span>
                    </div>
                    <p className="text-amber-700 font-semibold text-sm">
                      {item.passage?.reference || ''}
                    </p>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <p className="text-stone-800 italic text-sm leading-relaxed">
                        &ldquo;{item.passage?.text || 'Verse unavailable'}&rdquo;
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                        Devotional
                      </p>
                      <p className="text-stone-700 text-sm leading-relaxed">
                        {g.devotional_text}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                        Prayer
                      </p>
                      <p className="text-stone-700 text-sm leading-relaxed italic">
                        {g.prayer_text}
                      </p>
                    </div>

                    <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                        Reflection
                      </p>
                      <p className="text-stone-700 text-sm">
                        {g.reflection_question}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
