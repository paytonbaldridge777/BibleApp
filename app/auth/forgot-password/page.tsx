'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }
    setSent(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo-dark.png" alt="Anchored in the Word" style={{height: '140px', width: 'auto'}} />
          </Link>
          <h1 className="text-2xl font-bold font-serif text-white">Reset your password</h1>
          <p className="text-navy-300 mt-1">We&apos;ll send you a link to reset it</p>
        </div>

        <div className="bg-navy-800 rounded-2xl border border-navy-700 shadow-sm p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✉️</div>
              <p className="text-white font-medium">Check your email</p>
              <p className="text-navy-300 text-sm">
                We sent a reset link to <strong className="text-white">{email}</strong>. It may take a minute to arrive.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-navy-200 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-navy-600 rounded-lg text-white bg-navy-700 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-navy-700 hover:bg-navy-600 disabled:bg-navy-800 disabled:text-navy-500 text-white py-3 rounded-lg font-semibold transition-colors border border-navy-600"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-navy-400 text-sm mt-6">
          Remember it?{' '}
          <Link href="/auth/login" className="text-gold-400 hover:text-gold-300 font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
