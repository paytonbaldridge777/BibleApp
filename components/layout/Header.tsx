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
    <header className="bg-navy-900 border-b border-navy-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Left: brand + desktop nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center shrink-0">
            <img src="/logo-dark.png" alt="Shepherd" height="140" style={{height: '140px', width: 'auto', marginTop: '20px'}} />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-white bg-navy-700'
                    : 'text-navy-300 hover:text-white hover:bg-navy-700'
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
            <span className="text-sm text-navy-400 truncate max-w-[180px]">{userEmail}</span>
          )}
          {userEmail && (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-navy-300 hover:text-white border border-navy-600 hover:bg-navy-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile: hamburger button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700 transition-colors"
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
        <div className="md:hidden border-t border-navy-700 bg-navy-900 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-white bg-navy-700'
                  : 'text-navy-300 hover:text-white hover:bg-navy-700'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {userEmail && (
            <div className="border-t border-navy-700 mt-2 pt-2">
              <p className="px-3 py-1 text-xs text-navy-400 truncate">{userEmail}</p>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:text-white hover:bg-navy-700 transition-colors"
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