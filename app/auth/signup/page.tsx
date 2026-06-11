'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';

const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setServerError('');

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo-dark.png" alt="Anchored in the Word" style={{height: '140px', width: 'auto'}} />
          </Link>
          <h1 className="text-2xl font-bold font-serif text-white">Start your journey</h1>
          <p className="text-navy-300 mt-1">Create a free account to get started</p>
        </div>

        <div className="bg-navy-800 rounded-2xl border border-navy-700 shadow-sm p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-xl font-bold font-serif text-white mb-2">Check your email</h2>
              <p className="text-navy-300 text-sm leading-relaxed">
                We&apos;ve sent you a confirmation link. Click it to activate your account and
                begin your personalized Bible journey.
              </p>
              <Link
                href="/auth/login"
                className="mt-6 inline-block text-gold-400 hover:text-gold-300 font-medium text-sm"
              >
                Back to login
              </Link>
            </div>
          ) : (
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
                <label htmlFor="password" className="block text-sm font-medium text-navy-200 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full px-4 py-3 border border-navy-600 rounded-lg text-white bg-navy-700 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
                  placeholder="At least 8 characters"
                />
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-navy-200 mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="w-full px-4 py-3 border border-navy-600 rounded-lg text-white bg-navy-700 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
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
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-xs text-navy-400 text-center">
                By creating an account, you agree that Shepherd is for spiritual encouragement
                only and is not a substitute for professional mental health care.
              </p>
            </form>
          )}
        </div>

        {!success && (
          <p className="text-center text-navy-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gold-400 hover:text-gold-300 font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
