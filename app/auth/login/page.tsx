'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError('');

    const supabase = createBrowserSupabaseClient();

    console.log('[login] attempting signIn...');
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    console.log('[login] signIn result:', { error, user: authData?.user?.id, session: !!authData?.session });

    if (error) {
      console.log('[login] error:', error.message, error.status);
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    console.log('[login] success, checking session...');
    const { data: sessionCheck } = await supabase.auth.getSession();
    console.log('[login] session after signIn:', !!sessionCheck.session, sessionCheck.session?.access_token?.slice(0, 20));

    console.log('[login] pushing to /dashboard...');
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo-dark.png" alt="Anchored in the Word" style={{height: '140px', width: 'auto'}} />
          </Link>
          <h1 className="text-2xl font-bold font-serif text-white">Welcome back</h1>
          <p className="text-navy-300 mt-1">Sign in to continue your journey</p>
        </div>

        <div className="bg-navy-800 rounded-2xl border border-navy-700 shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-200 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full px-4 py-3 border border-navy-600 rounded-lg text-white bg-navy-700 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-navy-200">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-gold-400 hover:text-gold-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full px-4 py-3 pr-11 border border-navy-600 rounded-lg text-white bg-navy-700 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-navy-400 hover:text-navy-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-navy-700 hover:bg-navy-600 disabled:bg-navy-800 disabled:text-navy-500 text-white py-3 rounded-lg font-semibold transition-colors border border-navy-600"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-navy-400 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-gold-400 hover:text-gold-300 font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
