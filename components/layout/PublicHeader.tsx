import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="bg-parchment-50 border-b border-parchment-300 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center shrink-0">
            <img src="/logo.png" alt="Shepherd" style={{ height: '140px', width: 'auto' }} />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-ink-600 hover:text-ink-900 font-medium text-sm transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-navy-700 hover:bg-navy-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}