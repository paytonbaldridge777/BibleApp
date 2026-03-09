import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Favorite, DailyGuidance } from '@/types';

export default async function FavoritesPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: favorites } = await supabase
    .from('favorites')
    .select(`
      id,
      user_id,
      guidance_id,
      created_at,
      daily_guidance (
        id,
        date,
        theme,
        verse_reference,
        verse_text,
        devotional,
        prayer,
        reflection
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const items = (favorites ?? []) as unknown as (Favorite & { daily_guidance: DailyGuidance })[];

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
              <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-700">Dashboard</Link>
              <Link href="/favorites" className="text-sm font-medium text-stone-800">Favorites</Link>
              <Link href="/settings/profile" className="text-sm text-stone-500 hover:text-stone-700">Settings</Link>
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
              : 'No favorites saved yet'}
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
              const g = item.daily_guidance;
              if (!g) return null;
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-stone-500 text-xs">{g.date}</p>
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                        {g.theme}
                      </span>
                    </div>
                    <p className="text-amber-700 font-semibold text-sm">{g.verse_reference}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <p className="text-stone-800 italic text-sm leading-relaxed">
                        &ldquo;{g.verse_text}&rdquo;
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Devotional</p>
                      <p className="text-stone-700 text-sm leading-relaxed">{g.devotional}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Prayer</p>
                      <p className="text-stone-700 text-sm leading-relaxed italic">{g.prayer}</p>
                    </div>
                    <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Reflection</p>
                      <p className="text-stone-700 text-sm">{g.reflection}</p>
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
