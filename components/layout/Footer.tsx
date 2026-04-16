import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-200 py-8 px-4 mt-16">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <img
          src="/logo.png"
          alt="Shepherd"
          style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.85 }}
        />
        <div className="flex gap-6 text-sm">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
        </div>
        <p className="text-navy-400 text-xs">
          © {new Date().getFullYear()} Shepherd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}