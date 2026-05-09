import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="bg-navy-900 border-b border-navy-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <Link href="/" className="flex items-center shrink-0">
            <img src="/logo-dark.png" alt="Shepherd" style={{ height: '140px', width: 'auto', marginTop: '20px' }} />
          </Link>
          <nav className="flex items-center">
            <Link
              href="/auth/login"
              className="text-navy-300 hover:text-white font-semibold text-base transition-colors"
            >
              Login
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}