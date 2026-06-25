'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import Header from '@/components/layout/Header';
import { postGuidance, postFeedback, postFavorite, deleteFavorite, fetchTTS, type TTSSection } from '@/lib/api';
import type { DailyGuidance, GuidancePassage, GuidanceTheme } from '@/lib/api';
import type { SpiritualProfile } from '@/types';
import Footer from '@/components/layout/Footer';

interface Props {
  user: { id: string; email: string; display_name: string | null };
  profile: SpiritualProfile;
  todayGuidance: (DailyGuidance & {
    passage?: GuidancePassage | null;
    matched_theme?: GuidanceTheme | null;
  }) | null;
  recentGuidance: Array<
    DailyGuidance & {
      passage?: GuidancePassage | null;
      matched_theme?: GuidanceTheme | null;
    }
  >;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function calculateStreak(guidanceList: DailyGuidance[]): number {
  if (!guidanceList.length) return 0;
  const sorted = [...guidanceList].sort((a, b) =>
    b.guidance_date > a.guidance_date ? 1 : -1
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (sorted[i].guidance_date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

type GuidanceViewModel = DailyGuidance & {
  passage?: GuidancePassage | null;
  matched_theme?: GuidanceTheme | null;
};

function toGuidanceViewModel(json: {
  guidance: DailyGuidance | null;
  passage: GuidancePassage | null;
  matched_theme: GuidanceTheme | null;
}): GuidanceViewModel | null {
  if (!json.guidance) return null;
  return {
    ...json.guidance,
    passage: json.passage,
    matched_theme: json.matched_theme,
  };
}


// ---------------------------------------------------------------------------
// TTS
// ---------------------------------------------------------------------------
// Cache keyed by guidanceId:section:generationKey
// generationKey changes on every regeneration to bust stale audio
const audioCache = new Map<string, string>();

// How long to pause between sections when playing all (ms)
const SECTION_GAP_MS = 3500;

function useTTS(generationKey: string, onAudioTimed?: (ms: number) => void) {
  const [speaking, setSpeaking] = useState<TTSSection | null>(null);
  const [loading, setLoading] = useState<TTSSection | null>(null);
  const [audioStage, setAudioStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioStageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRequestedRef = useRef(false);

  const stopAudio = useCallback(() => {
    stopRequestedRef.current = true;
    if (audioStageTimerRef.current) { clearInterval(audioStageTimerRef.current); audioStageTimerRef.current = null; }
    if (gapTimerRef.current) { clearTimeout(gapTimerRef.current); gapTimerRef.current = null; }
    setAudioStage(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setSpeaking(null);
    setLoading(null);
    setPaused(false);
  }, []);

  const stop = stopAudio;

  const togglePause = useCallback(() => {
    if (!audioRef.current) return;
    if (paused) {
      audioRef.current.play();
      setPaused(false);
    } else {
      audioRef.current.pause();
      setPaused(true);
    }
  }, [paused]);

  // Preload disabled -- was causing stale audio race with R2
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const preload = useCallback(async (_guidanceId: string) => {
    console.debug('[TTS] preload disabled');
  }, []);

  // Plays a single section's audio; resolves when playback ends or is stopped
  const playSectionAudio = useCallback(
    async (guidanceId: string, section: TTSSection): Promise<void> => {
      const cacheKey = `${guidanceId}:${section}:${generationKey}`;
      let objectUrl = audioCache.get(cacheKey);
      if (!objectUrl) {
        objectUrl = await fetchTTS(guidanceId, section);
        audioCache.set(cacheKey, objectUrl);
      }
      return new Promise((resolve) => {
        if (stopRequestedRef.current) { resolve(); return; }
        const audio = new Audio(objectUrl!);
        audioRef.current = audio;
        audio.onended = () => { audioRef.current = null; resolve(); };
        audio.onerror = () => { audioRef.current = null; resolve(); };
        audio.play().catch(() => { audioRef.current = null; resolve(); });
      });
    },
    [generationKey]
  );

  const speak = useCallback(
    async (guidanceId: string, section: TTSSection) => {
      stopAudio();
      stopRequestedRef.current = false;
      setLoading(section);
      setAudioStage(0);
      if (audioStageTimerRef.current) clearInterval(audioStageTimerRef.current);
      audioStageTimerRef.current = setInterval(() => {
        setAudioStage((s) => Math.min(s + 1, 2));
      }, 2500);
      const speakStart = performance.now();
      try {
        const cacheKey = `${guidanceId}:${section}:${generationKey}`;
        console.debug('[TTS] speak', { section, cacheKey, cached: audioCache.has(cacheKey) });
        let objectUrl = audioCache.get(cacheKey);
        if (!objectUrl) {
          console.debug('[TTS] speak: cache miss, fetching from R2/API');
          const t0 = performance.now();
          objectUrl = await fetchTTS(guidanceId, section);
          console.debug(`[TTS] speak: fetched in ${(performance.now() - t0).toFixed(0)}ms`);
          audioCache.set(cacheKey, objectUrl);
        } else {
          console.debug('[TTS] speak: cache hit');
        }
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        audio.onended = () => { setSpeaking(null); setPaused(false); setLoading(null); audioRef.current = null; };
        audio.onerror = () => { setSpeaking(null); setPaused(false); setLoading(null); audioRef.current = null; };
        if (audioStageTimerRef.current) { clearInterval(audioStageTimerRef.current); audioStageTimerRef.current = null; }
        setAudioStage(0);
        await audio.play();
        const totalMs = performance.now() - speakStart;
        if (onAudioTimed) onAudioTimed(totalMs);
        console.debug(`[TTS] audio playing for section: ${section} after ${totalMs.toFixed(0)}ms`);
        setLoading(null);
        setSpeaking(section);
      } catch {
        if (audioStageTimerRef.current) { clearInterval(audioStageTimerRef.current); audioStageTimerRef.current = null; }
        setAudioStage(0);
        setLoading(null);
        setSpeaking(null);
        audioRef.current = null;
      }
    },
    [stopAudio, generationKey, onAudioTimed]
  );

  // Plays sections sequentially with a real timed gap between each
  const playAll = useCallback(
    async (guidanceId: string, sections: TTSSection[]) => {
      stopAudio();
      stopRequestedRef.current = false;
      setLoading('all');
      setAudioStage(0);
      if (audioStageTimerRef.current) clearInterval(audioStageTimerRef.current);
      audioStageTimerRef.current = setInterval(() => {
        setAudioStage((s) => Math.min(s + 1, 2));
      }, 2500);
      const speakStart = performance.now();
      try {
        // Prefetch all sections in parallel before starting playback
        await Promise.all(sections.map(async (section) => {
          const cacheKey = `${guidanceId}:${section}:${generationKey}`;
          if (!audioCache.has(cacheKey)) {
            const objectUrl = await fetchTTS(guidanceId, section);
            audioCache.set(cacheKey, objectUrl);
          }
        }));
        if (stopRequestedRef.current) return;
        if (audioStageTimerRef.current) { clearInterval(audioStageTimerRef.current); audioStageTimerRef.current = null; }
        setAudioStage(0);
        setLoading(null);
        setSpeaking('all');
        const totalMs = performance.now() - speakStart;
        if (onAudioTimed) onAudioTimed(totalMs);
        for (let i = 0; i < sections.length; i++) {
          if (stopRequestedRef.current) break;
          await playSectionAudio(guidanceId, sections[i]);
          if (stopRequestedRef.current) break;
          if (i < sections.length - 1) {
            // Real timed silence between sections
            await new Promise<void>((resolve) => {
              gapTimerRef.current = setTimeout(() => { gapTimerRef.current = null; resolve(); }, SECTION_GAP_MS);
            });
          }
        }
      } finally {
        if (!stopRequestedRef.current) {
          setSpeaking(null);
          setLoading(null);
          setPaused(false);
          audioRef.current = null;
        }
      }
    },
    [stopAudio, playSectionAudio, generationKey, onAudioTimed]
  );

  useEffect(() => () => { stopAudio(); }, [stopAudio]);
  return { speak, playAll, preload, stop, togglePause, speaking, loading, audioStage, paused, supported: true, generationKey };
}

interface AudioButtonProps {
  section: TTSSection;
  label?: string;
  tts: ReturnType<typeof useTTS>;
  guidanceId: string;
  variant?: 'icon' | 'pill';
}

const AUDIO_LOADING_MESSAGES = [
  'Preparing audio...',
  'Almost ready...',
  'Just a moment...',
];

const AUDIO_LOADING_MESSAGES_PILL = [
  'Preparing audio...',
  'Fetching from library...',
  'Almost ready...',
];

function AudioButton({ section, label, tts, guidanceId, variant = 'icon' }: AudioButtonProps) {
  const { speak, stop, togglePause, speaking, loading, audioStage, paused } = tts;
  const isActive = speaking === section;
  const isLoading = loading === section;
  const handleClick = () => { if (isActive) { stop(); } else if (!isLoading) { speak(guidanceId, section); } };

  if (variant === 'pill') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        title={isActive ? 'Stop audio' : `Listen to ${label ?? section}`}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? 'border-navy-400 bg-navy-100 text-navy-700' : isLoading ? 'border-navy-200 bg-navy-50 text-navy-500 cursor-wait' : 'border-parchment-400 text-ink-600 hover:border-navy-400 hover:text-navy-700'}`}
      >
        {isLoading ? (
          <svg className="animate-spin h-3.5 w-3.5 text-navy-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isActive ? (paused ? <PlayIcon /> : <StopIcon />) : <SpeakerIcon />}
        <span className={isLoading ? 'animate-pulse' : ''}>
          {isLoading ? AUDIO_LOADING_MESSAGES_PILL[audioStage] : isActive ? (paused ? 'Resume' : 'Stop') : (label ?? 'Listen')}
        </span>
        {isLoading && (
          <span className="flex gap-0.5 ml-1">
            {[0,1,2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 rounded-full bg-navy-400"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </span>
        )}
        {isActive && !paused && <button onClick={(e) => { e.stopPropagation(); togglePause(); }} className="ml-1 rounded px-1 text-xs hover:bg-navy-200 transition-colors" title="Pause">&#9646;&#9646;</button>}
      </button>
    );
  }
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={isActive ? 'Stop audio' : 'Listen'}
      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${isActive ? 'bg-navy-100 text-navy-700' : isLoading ? 'text-navy-400 cursor-wait' : 'text-ink-400 hover:bg-parchment-200 hover:text-ink-700'}`}
    >
      {isLoading ? (
        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : isActive ? (paused ? <PlayIcon size={12} /> : <StopIcon size={12} />) : <SpeakerIcon size={12} />}
      <span className={isLoading ? 'animate-pulse' : ''}>
        {isLoading ? AUDIO_LOADING_MESSAGES[audioStage] : isActive ? (paused ? 'Resume' : 'Stop') : 'Listen'}
      </span>
      {isActive && !paused && <button onClick={(e) => { e.stopPropagation(); togglePause(); }} className="ml-0.5 px-0.5 hover:text-navy-900 transition-colors" title="Pause">&#9646;&#9646;</button>}
    </button>
  );
}

function SpeakerIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
}
function StopIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
}
function PlayIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}

interface CustomizeFormProps {
  contextThemes: { id: string; slug: string; name: string }[];
  selectedThemeSlug: string | null;
  setSelectedThemeSlug: (slug: string | null) => void;
  contextFreeText: string;
  setContextFreeText: (text: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  isGenerating: boolean;
}

function CustomizeForm({
  contextThemes,
  selectedThemeSlug,
  setSelectedThemeSlug,
  contextFreeText,
  setContextFreeText,
  onGenerate,
  onCancel,
  isGenerating,
}: CustomizeFormProps) {
  return (
    <div className="rounded-xl border border-navy-200 bg-navy-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-800">Customize your guidance</p>
        <button onClick={onCancel} className="text-xs text-ink-400 hover:text-ink-600 transition-colors">
          Cancel
        </button>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-2">
          What do you need today?
        </p>
        <div className="flex flex-wrap gap-2">
          {contextThemes.map((t) => (
            <button
              key={t.slug}
              onClick={() => setSelectedThemeSlug(selectedThemeSlug === t.slug ? null : t.slug)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedThemeSlug === t.slug
                  ? 'bg-navy-700 text-white border-navy-700'
                  : 'bg-white text-ink-700 border-parchment-300 hover:border-navy-400'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-2">
          Anything on your heart?{' '}
          <span className="font-normal normal-case text-ink-400">optional</span>
        </p>
        <textarea
          value={contextFreeText}
          onChange={(e) => setContextFreeText(e.target.value.slice(0, 500))}
          placeholder="Share what you are going through today..."
          rows={3}
          className="w-full px-3 py-2 border border-parchment-300 rounded-lg text-sm text-ink-900 bg-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition resize-none font-serif italic"
        />
        <p className="text-xs text-ink-400 mt-1 text-right">{contextFreeText.length}/500</p>
      </div>

      {(selectedThemeSlug || contextFreeText.trim()) && (
        <button
          onClick={() => { setSelectedThemeSlug(null); setContextFreeText(''); }}
          className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
        >
          Clear selections
        </button>
      )}

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full rounded-xl bg-navy-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:bg-navy-400"
      >
        Generate Custom Guidance
      </button>
    </div>
  );
}

export default function DashboardClient({
  user,
  profile,
  todayGuidance,
  recentGuidance,
}: Props) {
  const router = useRouter();
  const [guidance, setGuidance] = useState<GuidanceViewModel | null>(todayGuidance);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [generationKey, setGenerationKey] = useState(() => Date.now().toString());
  const [devTimings, setDevTimings] = useState<{ guidance: number | null; audio: number | null }>({ guidance: null, audio: null });
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // TTS
  const tts = useTTS(generationKey, (ms) => {
    setDevTimings(prev => ({ ...prev, audio: ms }));
  });
  const audioTimingRef = useRef<number | null>(null);

  useEffect(() => {
    tts.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guidance?.id]);

  // Preload disabled -- on-demand fetch on Listen click is fast enough
  // and preload was racing R2 writes causing stale audio
  useEffect(() => {
    console.debug('[DEV] guidance/generationKey changed', { id: guidance?.id, generationKey });
  }, [guidance?.id, generationKey]);

  // Situational context state
  const [showContext, setShowContext] = useState(false);
  const [contextThemes, setContextThemes] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [selectedThemeSlug, setSelectedThemeSlug] = useState<string | null>(null);
  const [contextFreeText, setContextFreeText] = useState('');

  useEffect(() => {
    const loadThemes = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from('scripture_themes')
        .select('id, slug, name')
        .order('name');
      if (data) setContextThemes(data);
    };
    loadThemes();
  }, []);

  const streak = calculateStreak(recentGuidance);

  const generateGuidance = async (action: 'generate' | 'regenerate') => {
    setIsGenerating(true);
    setLoadingStage(0);
    setError('');
    setDevTimings({ guidance: null, audio: null });
    const genStart = performance.now();
    const stageTimer = setInterval(() => {
      setLoadingStage((s) => Math.min(s + 1, 3));
    }, 4000);
    try {
      const context =
        selectedThemeSlug || contextFreeText.trim()
          ? {
              theme_slug: selectedThemeSlug ?? undefined,
              free_text: contextFreeText.trim() || undefined,
            }
          : undefined;
      const json = await postGuidance(action, context);
      const guidanceMs = performance.now() - genStart;
      console.debug(`[DEV] Guidance generated in ${(guidanceMs / 1000).toFixed(2)}s`);
      setDevTimings(prev => ({ ...prev, guidance: guidanceMs }));
      // Hard flush entire audio cache on regeneration
      console.debug('[DEV] flushing entire audioCache, had', audioCache.size, 'entries:', [...audioCache.keys()]);
      audioCache.forEach((url) => URL.revokeObjectURL(url));
      audioCache.clear();
      console.debug('[DEV] audioCache cleared');
      tts.stop();
      const newKey = Date.now().toString();
      console.debug('[DEV] new generationKey:', newKey);
      setGenerationKey(newKey);
      setGuidance(toGuidanceViewModel(json));
      setExpanded({});
      router.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
      setLoadingStage(0);
      clearInterval(stageTimer);
    }
  };

  const toggleFavorite = async () => {
    if (!guidance) return;
    try {
      if (isFavorite) {
        await deleteFavorite(guidance.id);
        setIsFavorite(false);
      } else {
        await postFavorite(guidance.id);
        setIsFavorite(true);
      }
    } catch {
      // silently fail favorite toggle
    }
  };
  
  const sendFeedback = async (helpful: boolean) => {
    if (!guidance) return;
    try {
      await postFeedback({
        guidance_id: guidance.id,
        helpful,
      });
      setFeedbackState((prev) => ({
        ...prev,
        [helpful ? 'helpful' : 'not_helpful']: 'sent',
      }));
    } catch {
      // silently fail feedback
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="min-h-screen bg-parchment-100 text-ink-900">
      <Header userEmail={user.email} />

      <div className="border-b border-gold-300 bg-gold-100">
        <div className="mx-auto max-w-6xl px-6 py-3 text-sm text-navy-800">
          Shepherd provides spiritual encouragement only. For mental health support, please consult a
          professional. In crisis? Call or text 988.
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif tracking-tight text-ink-900">
                {getGreeting()}
                {user.display_name ? ` — ${user.display_name}` : ''}
              </h1>
              <p className="mt-1 text-ink-600">{formatDate(today)}</p>
            </div>
            {streak > 0 && (
              <div className="rounded-full bg-gold-200 px-4 py-2 text-sm font-medium text-navy-800">
                {streak} day{streak !== 1 ? 's' : ''} streak
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {isGenerating ? (
            <div className="rounded-2xl border border-navy-200 bg-navy-50 p-8 shadow-sm text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative h-16 w-16">
                  <svg className="animate-spin h-16 w-16 text-navy-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl">✦</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold font-serif text-navy-900">
                  {["Selecting your verse for today...", "Crafting your devotional...", "Composing your prayer and reflection...", "Almost ready..."][loadingStage]}
                </p>
                <p className="mt-2 text-sm text-navy-600">
                  This usually takes 15&ndash;20 seconds &mdash; your guidance is being thoughtfully prepared.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                {[0,1,2,3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i <= loadingStage ? 'w-8 bg-navy-500' : 'w-2 bg-navy-200'}`}
                  />
                ))}
              </div>
            </div>
          ) : guidance ? (
            <div className="rounded-2xl border border-parchment-300 bg-parchment-50 p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-medium uppercase tracking-widest text-gold-600">
                  Today&apos;s Guidance
                </p>
                <p className="mt-1 text-sm text-ink-500">{formatDate(today)}</p>
                <h2 className="mt-3 text-2xl font-semibold font-serif text-ink-900">
                  {guidance.title || "Today's Guidance"}
                </h2>
                {guidance.matched_theme?.name && (
                  <p className="mt-2 text-sm text-ink-600">
                    Theme: {guidance.matched_theme.name}
                  </p>
                )}
                <div className="mt-3">
                  {(() => {
                    const { playAll, stop, togglePause, speaking, loading, audioStage, paused } = tts;
                    const isActive = speaking === 'all';
                    const isLoading = loading === 'all';
                    const allSections: TTSSection[] = [
                      'verse',
                      ...(guidance.context_text ? ['context' as TTSSection] : []),
                      'devotional',
                      'prayer',
                      'reflection',
                    ];
                    const handleClick = () => {
                      if (isActive) { stop(); }
                      else if (!isLoading) { playAll(guidance.id, allSections); }
                    };
                    return (
                      <button
                        onClick={handleClick}
                        disabled={isLoading}
                        title={isActive ? 'Stop audio' : 'Listen to All'}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? 'border-navy-400 bg-navy-100 text-navy-700' : isLoading ? 'border-navy-200 bg-navy-50 text-navy-500 cursor-wait' : 'border-parchment-400 text-ink-600 hover:border-navy-400 hover:text-navy-700'}`}
                      >
                        {isLoading ? (
                          <svg className="animate-spin h-3.5 w-3.5 text-navy-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : isActive ? (paused ? <PlayIcon /> : <StopIcon />) : <SpeakerIcon />}
                        <span className={isLoading ? 'animate-pulse' : ''}>
                          {isLoading ? AUDIO_LOADING_MESSAGES_PILL[audioStage] : isActive ? (paused ? 'Resume' : 'Stop') : 'Listen to All'}
                        </span>
                        {isLoading && (
                          <span className="flex gap-0.5 ml-1">
                            {[0,1,2].map((i) => (
                              <span key={i} className="h-1 w-1 rounded-full bg-navy-400" style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                            ))}
                          </span>
                        )}
                        {isActive && !paused && <button onClick={(e) => { e.stopPropagation(); togglePause(); }} className="ml-1 rounded px-1 text-xs hover:bg-navy-200 transition-colors" title="Pause">&#9646;&#9646;</button>}
                      </button>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500">
                      Today&apos;s Verse
                    </h3>
                    {guidance.passage?.text && (
                      <AudioButton section="verse" tts={tts} guidanceId={guidance.id} />
                    )}
                  </div>
                  {guidance.passage?.text ? (
                    <blockquote className="border-l-4 border-gold-400 pl-5 py-1">
                      <p className="font-serif italic text-xl leading-9 text-ink-800">
                        &ldquo;{guidance.passage.text}&rdquo;
                      </p>
                      <p className="mt-3 text-sm font-medium text-navy-700 not-italic">
                        — {guidance.passage.reference}
                      </p>
                    </blockquote>
                  ) : (
                    <p className="text-ink-500 font-serif italic">Verse details not yet loaded...</p>
                  )}
                </section>

                <div className="border-t border-parchment-300" />

                <div className="divide-y divide-parchment-200 rounded-xl border border-parchment-200 overflow-hidden">
                  {guidance.context_text && (
                    <section>
                      <button
                        onClick={() => toggleSection('context')}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-parchment-100 transition-colors"
                      >
                        <span className="text-base font-semibold font-serif text-ink-900">Biblical Context</span>
                        <span className="text-ink-400 text-sm ml-4">{expanded['context'] ? '▲' : '▼'}</span>
                      </button>
                      {expanded['context'] && (
                        <>
                          <div className="px-4 pb-1 flex justify-end">
                            <AudioButton section="context" tts={tts} guidanceId={guidance.id} />
                          </div>
                          <p className="px-4 pb-4 whitespace-pre-line leading-7 text-ink-700">
                            {guidance.context_text}
                          </p>
                        </>
                      )}
                    </section>
                  )}

                  <section>
                    <button
                      onClick={() => toggleSection('devotional')}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-parchment-100 transition-colors"
                    >
                      <span className="text-base font-semibold font-serif text-ink-900">Devotional</span>
                      <span className="text-ink-400 text-sm ml-4">{expanded['devotional'] ? '▲' : '▼'}</span>
                    </button>
                    {expanded['devotional'] && (
                      <>
                        <div className="px-4 pb-1 flex justify-end">
                          <AudioButton section="devotional" tts={tts} guidanceId={guidance.id} />
                        </div>
                        <p className="px-4 pb-4 whitespace-pre-line leading-7 text-ink-700">
                          {guidance.devotional_text}
                        </p>
                      </>
                    )}
                  </section>

                  <section>
                    <button
                      onClick={() => toggleSection('prayer')}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-parchment-100 transition-colors"
                    >
                      <span className="text-base font-semibold font-serif text-ink-900">Prayer</span>
                      <span className="text-ink-400 text-sm ml-4">{expanded['prayer'] ? '▲' : '▼'}</span>
                    </button>
                    {expanded['prayer'] && (
                      <>
                        <div className="px-4 pb-1 flex justify-end">
                          <AudioButton section="prayer" tts={tts} guidanceId={guidance.id} />
                        </div>
                        <p className="px-4 pb-4 whitespace-pre-line leading-7 text-ink-700 font-serif italic">
                          {guidance.prayer_text}
                        </p>
                      </>
                    )}
                  </section>

                  <section>
                    <button
                      onClick={() => toggleSection('reflection')}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-parchment-100 transition-colors"
                    >
                      <span className="text-base font-semibold font-serif text-ink-900">Reflection</span>
                      <span className="text-ink-400 text-sm ml-4">{expanded['reflection'] ? '▲' : '▼'}</span>
                    </button>
                    {expanded['reflection'] && (
                      <>
                        <div className="px-4 pb-1 flex justify-end">
                          <AudioButton section="reflection" tts={tts} guidanceId={guidance.id} />
                        </div>
                        <p className="px-4 pb-4 leading-7 text-ink-700">
                          {guidance.reflection_question}
                        </p>
                      </>
                    )}
                  </section>
                </div>
                {showContext ? (
                  <CustomizeForm
                    contextThemes={contextThemes}
                    selectedThemeSlug={selectedThemeSlug}
                    setSelectedThemeSlug={setSelectedThemeSlug}
                    contextFreeText={contextFreeText}
                    setContextFreeText={setContextFreeText}
                    onGenerate={() => { setShowContext(false); generateGuidance('regenerate'); }}
                    onCancel={() => setShowContext(false)}
                    isGenerating={isGenerating}
                  />
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => generateGuidance('regenerate')}
                      disabled={isGenerating}
                      className="flex-1 rounded-xl border border-parchment-400 px-4 py-2.5 text-sm font-medium text-ink-700 hover:border-navy-400 hover:text-navy-700 transition-colors disabled:opacity-50"
                    >
                      ✦ Regenerate Guidance
                    </button>
                    <button
                      onClick={() => setShowContext(true)}
                      disabled={isGenerating}
                      className="flex-1 rounded-xl border border-navy-300 bg-navy-50 px-4 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-100 transition-colors disabled:opacity-50"
                    >
                      ✎ Customize & Regenerate
                    </button>
                  </div>
                )}

<div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={toggleFavorite}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isFavorite
                        ? 'border-gold-400 bg-gold-100 text-gold-700'
                        : 'border-parchment-400 text-ink-600 hover:border-gold-400 hover:text-gold-700'
                    }`}
                  >
                    {isFavorite ? '⭐ Saved' : '☆ Save to Favorites'}
                  </button>
                  <button
                    onClick={() => sendFeedback(true)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      feedbackState['helpful'] === 'sent'
                        ? 'border-green-300 bg-green-100 text-green-700'
                        : 'border-parchment-400 text-ink-600 hover:border-green-300 hover:text-green-700'
                    }`}
                  >
                    {feedbackState['helpful'] === 'sent' ? 'Marked Helpful' : 'Helpful'}
                  </button>
                  <button
                    onClick={() => sendFeedback(false)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      feedbackState['not_helpful'] === 'sent'
                        ? 'border-red-300 bg-red-100 text-red-700'
                        : 'border-parchment-400 text-ink-600 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    {feedbackState['not_helpful'] === 'sent' ? 'Marked Not Helpful' : 'Not Helpful'}
                  </button>

                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {showContext ? (
                <CustomizeForm
                  contextThemes={contextThemes}
                  selectedThemeSlug={selectedThemeSlug}
                  setSelectedThemeSlug={setSelectedThemeSlug}
                  contextFreeText={contextFreeText}
                  setContextFreeText={setContextFreeText}
                  onGenerate={() => { setShowContext(false); generateGuidance('generate'); }}
                  onCancel={() => setShowContext(false)}
                  isGenerating={isGenerating}
                />
              ) : (
                <div className="rounded-2xl border border-parchment-300 bg-parchment-50 p-8 shadow-sm">
                  <h2 className="text-2xl font-semibold font-serif text-ink-900 text-center">
                    Ready for today&apos;s guidance?
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-ink-600 text-center">
                    Shepherd will select a verse and create a personalized devotional, prayer,
                    reflection, and biblical context just for you.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => generateGuidance('generate')}
                      disabled={isGenerating}
                      className="flex-1 rounded-xl bg-navy-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-navy-800 disabled:bg-navy-400"
                    >
                      Generate My Guidance
                    </button>
                    <button
                      onClick={() => setShowContext(true)}
                      disabled={isGenerating}
                      className="flex-1 rounded-xl border border-navy-400 bg-white px-6 py-3 font-semibold text-navy-700 transition-colors hover:bg-navy-50 disabled:opacity-50"
                    >
                      ✎ Customize My Guidance
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-parchment-300 bg-parchment-50 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold font-serif text-ink-900">Your Profile</h3>
              <Link href="/settings/profile" className="text-sm text-navy-700 hover:text-navy-800">
                Edit
              </Link>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-ink-500">Experience</p>
                <p className="mt-1 font-medium text-ink-800">{profile.bible_experience_level}</p>
              </div>
              {profile.current_needs?.length > 0 && (
                <div>
                  <p className="text-ink-500">Seeking</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.current_needs.slice(0, 3).map((need) => (
                      <span
                        key={need}
                        className="rounded-full bg-parchment-200 px-3 py-1 text-ink-700"
                      >
                        {need.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-ink-500">Tone</p>
                <p className="mt-1 font-medium capitalize text-ink-800">
                  {profile.tone_preference}
                </p>
              </div>
              {profile.profile_summary && (
                <p className="rounded-xl bg-parchment-100 border border-parchment-300 p-3 leading-6 text-ink-700 font-serif italic text-sm">
                  {profile.profile_summary}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-parchment-300 bg-parchment-50 p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold font-serif text-ink-900">Quick Links</h3>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/explore" className="text-ink-700 hover:text-ink-900">
                🔍 Passage Study
              </Link>
              <Link href="/favorites" className="text-ink-700 hover:text-ink-900">
                ⭐ Saved Favorites
              </Link>
              <Link href="/history" className="text-ink-700 hover:text-ink-900">
                📖 Guidance History
              </Link>
              <Link href="/settings" className="text-ink-700 hover:text-ink-900">
                ⚙️ Update Profile
              </Link>
            </div>
          </div>

          {recentGuidance.length > 1 && (
            <div className="rounded-2xl border border-parchment-300 bg-parchment-50 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold font-serif text-ink-900">
                  Recent Guidance
                </h3>
                <Link href="/history" className="text-sm text-navy-700 hover:text-navy-800">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentGuidance.slice(0, 6).map((g) => (
                  <Link
                    key={g.id}
                    href="/history"
                    className="block rounded-xl bg-parchment-100 border border-parchment-200 p-3 hover:border-parchment-400 transition-colors"
                  >
                    <p className="text-xs uppercase tracking-wide text-ink-500">
                      {g.guidance_date}
                    </p>
                    <p className="mt-1 font-medium text-ink-800">{g.title || 'Guidance'}</p>
                    {g.passage?.reference && (
                      <p className="mt-1 text-sm text-navy-700 font-serif italic">
                        {g.passage.reference}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      {/* DEV TIMING OVERLAY -- remove before going live */}
      {(devTimings.guidance !== null) && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-black/80 px-3 py-2 text-xs font-mono text-green-400 space-y-1 pointer-events-none">
          <div>⚡ DEV TIMINGS</div>
          {devTimings.guidance !== null && (
            <div>Guidance: {(devTimings.guidance / 1000).toFixed(2)}s</div>
          )}
          {devTimings.audio !== null && (
            <div>Audio: {(devTimings.audio / 1000).toFixed(2)}s</div>
          )}
        </div>
      )}
      <Footer />
    </main>
  );
}