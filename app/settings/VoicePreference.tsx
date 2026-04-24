'use client';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';

interface Props {
  currentVoice: string;
}

export default function VoicePreference({ currentVoice }: Props) {
  const [voice, setVoice] = useState<string>(currentVoice ?? 'ash');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSelect = async (selected: string) => {
    if (selected === voice) return;
    setVoice(selected);
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('spiritual_profiles')
        .update({ tts_voice: selected })
        .eq('user_id', user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-3">
        Audio Voice
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => handleSelect('ash')}
          disabled={saving}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
            voice === 'ash'
              ? 'border-navy-500 bg-navy-50 text-navy-800'
              : 'border-parchment-300 text-ink-600 hover:border-navy-400 hover:text-navy-700'
          }`}
        >
          <span className="text-base">♂</span> Male
          <span className="block text-xs font-normal text-ink-500 mt-0.5">Ash</span>
        </button>
        <button
          onClick={() => handleSelect('nova')}
          disabled={saving}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
            voice === 'nova'
              ? 'border-navy-500 bg-navy-50 text-navy-800'
              : 'border-parchment-300 text-ink-600 hover:border-navy-400 hover:text-navy-700'
          }`}
        >
          <span className="text-base">♀</span> Female
          <span className="block text-xs font-normal text-ink-500 mt-0.5">Nova</span>
        </button>
      </div>
      <p className="text-xs text-ink-400 mt-2">
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Takes effect on your next generated guidance.'}
      </p>
    </div>
  );
}