'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';

interface HeaderProps {
  userEmail?: string;
}

export default function Header({ userEmail }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-parchment-50 border-b border-parchment-300 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="text-lg font-bold font-serif text-navy-800">Shepherd</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-ink-600 hover:text-ink-900 font-medium">
              Dashboard
            </Link>
            <Link href="/favorites" className="text-sm text-ink-500 hover:text-ink-700">
              Favorites
            </Link>
            <Link href="/settings/profile" className="text-sm text-ink-500 hover:text-ink-700">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-sm text-ink-500 hidden sm:block">{userEmail}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-ink-600 hover:text-ink-900 border border-parchment-400 hover:border-parchment-400 hover:bg-parchment-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
