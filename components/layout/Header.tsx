'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';

interface HeaderProps {
  userEmail?: string;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/explore', label: 'Study' },
  { href: '/favorites', label: 'Favorites' },
  { href: '/history', label: 'History' },
  { href: '/settings/profile', label: 'Settings' },
];

export default function Header({ userEmail }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="bg-parchment-50 border-b border-parchment-300 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Left: brand + desktop nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center shrink-0">
            <img src="/logo.svg" alt="Shepherd" height="36" style={{height: '36px', width: 'auto'}} />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-navy-800 bg-navy-50'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-parchment-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: desktop user info + logout */}
        <div className="hidden md:flex items-center gap-3">
          {userEmail && (
            <span className="text-sm text-ink-400 truncate max-w-[180px]">{userEmail}</span>
          )}
          {userEmail && (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-ink-600 hover:text-ink-900 border border-parchment-400 hover:bg-parchment-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile: hamburger button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-parchment-200 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-parchment-300 bg-parchment-50 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-navy-800 bg-navy-50'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-parchment-200'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {userEmail && (
            <div className="border-t border-parchment-300 mt-2 pt-2">
              <p className="px-3 py-1 text-xs text-ink-400 truncate">{userEmail}</p>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-parchment-200 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}