'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postOnboarding } from '@/lib/api';

const CRISIS_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'self-harm',
  'self harm',
  'cutting myself',
  'end my life',
  'want to die',
  'abuse',
  'being abused',
  'crisis',
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

interface OnboardingData {
  struggles: string[];
  seeking: string[];
  familiarity: string;
  content_types: string[];
  tone: string;
  devotional_length: string;
  free_text: string;
}

const TOTAL_STEPS = 5;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-stone-600">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-sm text-stone-400">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className="w-full bg-stone-200 rounded-full h-2">
        <div
          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCrisisNotice, setShowCrisisNotice] = useState(false);
  const [crisisConfirmed, setCrisisConfirmed] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    struggles: [],
    seeking: [],
    familiarity: '',
    content_types: [],
    tone: '',
    devotional_length: '',
    free_text: '',
  });

  const toggleArrayValue = (field: keyof OnboardingData, value: string) => {
    const arr = data[field] as string[];
    setData((prev) => ({
      ...prev,
      [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    }));
  };

  const setRadioValue = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.struggles.length > 0;
      case 2:
        return data.seeking.length > 0;
      case 3:
        return data.familiarity !== '';
      case 4:
        return data.content_types.length > 0 && data.tone !== '';
      case 5:
        return data.devotional_length !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    // Crisis detection
    if (data.free_text && detectCrisis(data.free_text) && !crisisConfirmed) {
      setShowCrisisNotice(true);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await postOnboarding(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  if (showCrisisNotice) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-amber-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">💛</div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">We Care About You</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              We noticed something in what you shared that makes us want to pause and check in. If
              you&apos;re going through a difficult time, you are not alone, and there are people
              who can help right now.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 space-y-3">
            <h3 className="font-semibold text-stone-900 text-sm">Free, confidential support:</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-amber-600">📞</span>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">988 Suicide &amp; Crisis Lifeline</p>
                  <p className="text-stone-600 text-xs">Call or text <strong>988</strong> (US) — available 24/7</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-600">💬</span>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">Crisis Text Line</p>
                  <p className="text-stone-600 text-xs">
                    Text <strong>HOME</strong> to <strong>741741</strong> — available 24/7
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-600">🚨</span>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">Emergency Services</p>
                  <p className="text-stone-600 text-xs">Call <strong>911</strong> for immediate danger</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={crisisConfirmed}
                onChange={(e) => setCrisisConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-sm text-stone-700">
                I have seen these resources. I am safe and would like to continue with Shepherd for
                spiritual encouragement.
              </span>
            </label>

            <button
              onClick={() => {
                if (crisisConfirmed) {
                  setShowCrisisNotice(false);
                  handleSubmit();
                }
              }}
              disabled={!crisisConfirmed}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Continue with Shepherd
            </button>

            <button
              onClick={() => setShowCrisisNotice(false)}
              className="w-full border border-stone-300 hover:border-stone-400 text-stone-700 py-3 rounded-lg font-medium transition-colors"
            >
              Go back and edit my response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🌿</div>
          <h1 className="text-2xl font-bold text-stone-900">Let&apos;s personalize your experience</h1>
          <p className="text-stone-600 text-sm mt-1">
            Answer a few questions so Shepherd can guide you better.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <ProgressBar step={step} />

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-1">
                What do you struggle with most when reading the Bible?
              </h2>
              <p className="text-stone-500 text-sm mb-5">Select all that apply.</p>
              <div className="space-y-3">
                {[
                  { value: 'finding-relevant-verses', label: 'Finding verses that feel relevant to my life' },
                  { value: 'understanding-meaning', label: 'Understanding what passages mean' },
                  { value: 'staying-consistent', label: 'Staying consistent with regular reading' },
                  { value: 'knowing-where-to-start', label: 'Knowing where to start' },
                  { value: 'applying-to-daily-life', label: 'Applying Scripture to daily life' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      data.struggles.includes(opt.value)
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={data.struggles.includes(opt.value)}
                      onChange={() => toggleArrayValue('struggles', opt.value)}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-stone-800 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-1">
                What are you most seeking right now?
              </h2>
              <p className="text-stone-500 text-sm mb-5">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'peace', label: '☮️ Peace' },
                  { value: 'hope', label: '✨ Hope' },
                  { value: 'spiritual-growth', label: '🌱 Spiritual Growth' },
                  { value: 'strength', label: '💪 Strength' },
                  { value: 'wisdom', label: '📖 Wisdom' },
                  { value: 'healing', label: '🩹 Healing' },
                  { value: 'freedom-from-addiction', label: '🔓 Freedom' },
                  { value: 'anxiety-relief', label: '🧘 Anxiety Relief' },
                  { value: 'forgiveness', label: '🤝 Forgiveness' },
                  { value: 'purpose', label: '🎯 Purpose' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                      data.seeking.includes(opt.value)
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={data.seeking.includes(opt.value)}
                      onChange={() => toggleArrayValue('seeking', opt.value)}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-stone-800 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-1">
                How familiar are you with the Bible?
              </h2>
              <p className="text-stone-500 text-sm mb-5">This helps us set the right depth.</p>
              <div className="space-y-3">
                {[
                  {
                    value: 'beginner',
                    label: "I'm just getting started",
                    desc: "New to the Bible or returning after time away",
                  },
                  {
                    value: 'intermediate',
                    label: 'I know some basics',
                    desc: 'Familiar with common stories and themes',
                  },
                  {
                    value: 'advanced',
                    label: 'I study regularly',
                    desc: 'Comfortable with deep study and theological concepts',
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      data.familiarity === opt.value
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="familiarity"
                      value={opt.value}
                      checked={data.familiarity === opt.value}
                      onChange={() => setRadioValue('familiarity', opt.value)}
                      className="mt-0.5 w-4 h-4 text-amber-600"
                    />
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{opt.label}</p>
                      <p className="text-stone-500 text-xs mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-stone-900 mb-1">
                  What content helps you most?
                </h2>
                <p className="text-stone-500 text-sm mb-4">Select all that apply.</p>
                <div className="space-y-2.5">
                  {[
                    { value: 'short-verses', label: 'Short, focused verses' },
                    { value: 'devotionals', label: 'Devotional reflections' },
                    { value: 'prayers', label: 'Written prayers' },
                    { value: 'study-explanations', label: 'Deeper study explanations' },
                    { value: 'daily-encouragement', label: 'Daily encouragement' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        data.content_types.includes(opt.value)
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={data.content_types.includes(opt.value)}
                        onChange={() => toggleArrayValue('content_types', opt.value)}
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                      <span className="text-stone-800 text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-stone-900 mb-1">
                  What tone do you prefer?
                </h2>
                <p className="text-stone-500 text-sm mb-4">Choose one.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'gentle', label: '🌸 Gentle & Compassionate' },
                    { value: 'direct', label: '🎯 Clear & Direct' },
                    { value: 'uplifting', label: '☀️ Uplifting & Energizing' },
                    { value: 'reflective', label: '🌊 Reflective & Meditative' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                        data.tone === opt.value
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tone"
                        value={opt.value}
                        checked={data.tone === opt.value}
                        onChange={() => setRadioValue('tone', opt.value)}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-stone-800 text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-stone-900 mb-1">
                  How long would you like daily devotionals?
                </h2>
                <p className="text-stone-500 text-sm mb-4">Choose what fits your schedule.</p>
                <div className="space-y-3">
                  {[
                    { value: 'very-short', label: 'Quick — just a few sentences', desc: '~1 minute read' },
                    { value: 'short', label: 'Brief — a short paragraph', desc: '~2-3 minute read' },
                    { value: 'medium', label: 'Deeper — a fuller reflection', desc: '~5 minute read' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        data.devotional_length === opt.value
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="devotional_length"
                        value={opt.value}
                        checked={data.devotional_length === opt.value}
                        onChange={() => setRadioValue('devotional_length', opt.value)}
                        className="mt-0.5 w-4 h-4 text-amber-600"
                      />
                      <div>
                        <p className="font-medium text-stone-800 text-sm">{opt.label}</p>
                        <p className="text-stone-500 text-xs mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Anything else you&apos;d like guidance with? <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={data.free_text}
                  onChange={(e) => setData((prev) => ({ ...prev, free_text: e.target.value }))}
                  placeholder="Share anything that's on your heart..."
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none"
                />
                <p className="text-xs text-stone-400 mt-1">
                  If you share something indicating a crisis, we&apos;ll show you helpful resources.
                </p>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 border border-stone-300 hover:border-stone-400 text-stone-700 py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Setting up your profile...' : 'Start My Journey'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
