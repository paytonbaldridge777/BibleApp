'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import { postInterpret } from '@/lib/api';
import type { InterpretResponse } from '@/lib/api';

interface Props {
  user: { id: string; email: string };
}

const OLD_TESTAMENT = [
  { name: 'Genesis', chapters: 50 },
  { name: 'Exodus', chapters: 40 },
  { name: 'Leviticus', chapters: 27 },
  { name: 'Numbers', chapters: 36 },
  { name: 'Deuteronomy', chapters: 34 },
  { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 },
  { name: 'Ruth', chapters: 4 },
  { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 },
  { name: '1 Kings', chapters: 22 },
  { name: '2 Kings', chapters: 25 },
  { name: '1 Chronicles', chapters: 29 },
  { name: '2 Chronicles', chapters: 36 },
  { name: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', chapters: 13 },
  { name: 'Esther', chapters: 10 },
  { name: 'Job', chapters: 42 },
  { name: 'Psalms', chapters: 150 },
  { name: 'Proverbs', chapters: 31 },
  { name: 'Ecclesiastes', chapters: 12 },
  { name: 'Song of Solomon', chapters: 8 },
  { name: 'Isaiah', chapters: 66 },
  { name: 'Jeremiah', chapters: 52 },
  { name: 'Lamentations', chapters: 5 },
  { name: 'Ezekiel', chapters: 48 },
  { name: 'Daniel', chapters: 12 },
  { name: 'Hosea', chapters: 14 },
  { name: 'Joel', chapters: 3 },
  { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 },
  { name: 'Jonah', chapters: 4 },
  { name: 'Micah', chapters: 7 },
  { name: 'Nahum', chapters: 3 },
  { name: 'Habakkuk', chapters: 3 },
  { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 },
  { name: 'Zechariah', chapters: 14 },
  { name: 'Malachi', chapters: 4 },
];

const NEW_TESTAMENT = [
  { name: 'Matthew', chapters: 28 },
  { name: 'Mark', chapters: 16 },
  { name: 'Luke', chapters: 24 },
  { name: 'John', chapters: 21 },
  { name: 'Acts', chapters: 28 },
  { name: 'Romans', chapters: 16 },
  { name: '1 Corinthians', chapters: 16 },
  { name: '2 Corinthians', chapters: 13 },
  { name: 'Galatians', chapters: 6 },
  { name: 'Ephesians', chapters: 6 },
  { name: 'Philippians', chapters: 4 },
  { name: 'Colossians', chapters: 4 },
  { name: '1 Thessalonians', chapters: 5 },
  { name: '2 Thessalonians', chapters: 3 },
  { name: '1 Timothy', chapters: 6 },
  { name: '2 Timothy', chapters: 4 },
  { name: 'Titus', chapters: 3 },
  { name: 'Philemon', chapters: 1 },
  { name: 'Hebrews', chapters: 13 },
  { name: 'James', chapters: 5 },
  { name: '1 Peter', chapters: 5 },
  { name: '2 Peter', chapters: 3 },
  { name: '1 John', chapters: 5 },
  { name: '2 John', chapters: 1 },
  { name: '3 John', chapters: 1 },
  { name: 'Jude', chapters: 1 },
  { name: 'Revelation', chapters: 22 },
];

const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];
const MAX_VERSES = 12;

export default function ExploreClient({ user }: Props) {
  const router = useRouter();
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verseStart, setVerseStart] = useState('');
  const [verseEnd, setVerseEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InterpretResponse | null>(null);

  const selectedBook = ALL_BOOKS.find((b) => b.name === book);
  const maxChapters = selectedBook?.chapters ?? 1;
  const verseSpan = verseEnd && verseStart ? parseInt(verseEnd) - parseInt(verseStart) + 1 : 0;
  const verseOverLimit = verseSpan > MAX_VERSES;

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !chapter || !verseStart) return;

    const start = parseInt(verseStart);
    const end = verseEnd ? parseInt(verseEnd) : start;

    if (end < start) {
      setError('End verse must be greater than or equal to start verse');
      return;
    }
    if (end - start + 1 > MAX_VERSES) {
      setError(`Please select ${MAX_VERSES} verses or fewer`);
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await postInterpret({
        book,
        chapter: parseInt(chapter),
        verse_start: start,
        verse_end: end !== start ? end : undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-parchment-100 text-ink-900">
      <header className="border-b border-parchment-300 bg-parchment-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold font-serif text-navy-800">
              Shepherd
            </Link>
            <nav className="flex items-center gap-4 text-sm text-ink-600">
              <Link href="/explore" className="text-navy-800 font-medium">
                Study
              </Link>
              <Link href="/favorites" className="hover:text-ink-900">
                Favorites
              </Link>
              <Link href="/history" className="hover:text-ink-900">
                History
              </Link>
              <Link href="/settings/profile" className="hover:text-ink-900">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-parchment-400 px-3 py-1.5 text-ink-700 hover:bg-parchment-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-gold-300 bg-gold-100">
        <div className="mx-auto max-w-6xl px-6 py-3 text-sm text-navy-800">
          Shepherd provides spiritual encouragement only. For mental health support, please consult a
          professional. In crisis? Call or text 988.
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-serif tracking-tight text-ink-900">
                Passage Study
              </h1>
              <span className="rounded-full bg-gold-200 px-3 py-1 text-xs font-semibold text-navy-800 uppercase tracking-wide">
                Premium
              </span>
            </div>
            <p className="mt-1 text-ink-600">
              Enter any passage to receive context and application.
            </p>
          </div>
        </div>

        {/* Picker card */}
        <div className="rounded-2xl border border-parchment-300 bg-parchment-50 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Book */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Book</label>
              <select
                value={book}
                onChange={(e) => { setBook(e.target.value); setChapter(''); setVerseStart(''); setVerseEnd(''); }}
                required
                className="w-full px-4 py-3 border border-parchment-300 rounded-lg text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition"
              >
                <option value="">Select a book...</option>
                <optgroup label="Old Testament">
                  {OLD_TESTAMENT.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </optgroup>
                <optgroup label="New Testament">
                  {NEW_TESTAMENT.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Chapter</label>
              <input
                type="number"
                min={1}
                max={maxChapters}
                value={chapter}
                onChange={(e) => { setChapter(e.target.value); setVerseStart(''); setVerseEnd(''); }}
                required
                disabled={!book}
                placeholder={book ? `1 – ${maxChapters}` : '—'}
                className="w-full px-4 py-3 border border-parchment-300 rounded-lg text-ink-900 bg-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition disabled:opacity-50"
              />
            </div>

            {/* Verse range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Verse start
                </label>
                <input
                  type="number"
                  min={1}
                  value={verseStart}
                  onChange={(e) => setVerseStart(e.target.value)}
                  required
                  disabled={!chapter}
                  placeholder="e.g. 1"
                  className="w-full px-4 py-3 border border-parchment-300 rounded-lg text-ink-900 bg-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Verse end{' '}
                  <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  type="number"
                  min={verseStart || 1}
                  value={verseEnd}
                  onChange={(e) => setVerseEnd(e.target.value)}
                  disabled={!verseStart}
                  placeholder="e.g. 5"
                  className="w-full px-4 py-3 border border-parchment-300 rounded-lg text-ink-900 bg-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition disabled:opacity-50"
                />
              </div>
            </div>

            {verseOverLimit && (
              <p className="text-sm text-red-600">
                That&apos;s {verseSpan} verses. Please keep it to {MAX_VERSES} or fewer for the best results.
              </p>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || verseOverLimit || !book || !chapter || !verseStart}
              className="w-full rounded-xl bg-navy-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-navy-800 disabled:bg-navy-400"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Studying passage...
                </span>
              ) : (
                'Study This Passage'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-2xl border border-parchment-300 bg-parchment-50 p-6 shadow-sm space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-gold-600">
                Passage Study
              </p>
              <h2 className="mt-1 text-xl font-semibold font-serif text-ink-900">
                {result.reference}
              </h2>
            </div>

            <blockquote className="border-l-4 border-gold-400 pl-5 py-1">
              <p className="font-serif italic text-lg leading-8 text-ink-800">
                &ldquo;{result.text}&rdquo;
              </p>
            </blockquote>

            <div className="border-t border-parchment-300" />

            <section>
              <h3 className="mb-2 text-base font-semibold font-serif text-ink-900">
                Biblical Context
              </h3>
              <p className="whitespace-pre-line leading-7 text-ink-700">{result.context_text}</p>
            </section>

            <div className="border-t border-parchment-300" />

            <section>
              <h3 className="mb-2 text-base font-semibold font-serif text-ink-900">Application</h3>
              <p className="leading-7 text-ink-700">{result.application}</p>
            </section>

            <button
              onClick={() => setResult(null)}
              className="text-sm text-ink-400 hover:text-ink-600 transition-colors"
            >
              Study another passage
            </button>
          </div>
        )}
      </div>
    </main>
  );
}