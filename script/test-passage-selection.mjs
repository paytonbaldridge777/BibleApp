import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const MAP_PATH = path.join(rootDir, "data", "onboarding-theme-map.json");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function rankThemesForProfile(profile, mapConfig) {
  const scoreMap = new Map();
  const reasons = new Map();

  const pushReason = (theme, reason) => {
    if (!reasons.has(theme)) reasons.set(theme, []);
    reasons.get(theme).push(reason);
  };

  const struggleWeight = mapConfig.weights?.struggles ?? 2;
  const seekingWeight = mapConfig.weights?.seeking ?? 3;
  const familiarityWeight = mapConfig.weights?.familiarity ?? 1;

  for (const value of profile.struggles || []) {
    const themes = mapConfig.struggles?.[value] || [];
    for (const theme of themes) {
      scoreMap.set(theme, (scoreMap.get(theme) || 0) + struggleWeight);
      pushReason(theme, `struggles:${value} (+${struggleWeight})`);
    }
  }

  for (const value of profile.seeking || []) {
    const themes = mapConfig.seeking?.[value] || [];
    for (const theme of themes) {
      scoreMap.set(theme, (scoreMap.get(theme) || 0) + seekingWeight);
      pushReason(theme, `seeking:${value} (+${seekingWeight})`);
    }
  }

  if (profile.familiarity) {
    const themes = mapConfig.familiarity?.[profile.familiarity] || [];
    for (const theme of themes) {
      scoreMap.set(theme, (scoreMap.get(theme) || 0) + familiarityWeight);
      pushReason(theme, `familiarity:${profile.familiarity} (+${familiarityWeight})`);
    }
  }

  return Array.from(scoreMap.entries())
    .map(([theme, score]) => ({
      theme,
      score,
      reasons: reasons.get(theme) || [],
    }))
    .sort((a, b) => b.score - a.score || a.theme.localeCompare(b.theme));
}

function normalizeSpiritualProfile(row) {
  return {
    struggles: row.main_struggles || [],
    seeking: row.current_needs || [],
    familiarity: row.bible_experience_level || null,
    content_types: row.preferred_content_types || [],
    tone: row.tone_preference || null,
    devotional_length: row.devotional_length || null,
    free_text: row.profile_summary || "",
  };
}

async function main() {
  const userId = process.argv[2];

  if (!userId) {
    throw new Error("Usage: node script/test-passage-selection.mjs <user_id>");
  }

  const mapRaw = await fs.readFile(MAP_PATH, "utf8");
  const mapConfig = JSON.parse(mapRaw);

  const { data: profileRow, error: profileError } = await supabase
    .from("spiritual_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileError) throw profileError;

  const profile = normalizeSpiritualProfile(profileRow);
  const rankedThemes = rankThemesForProfile(profile, mapConfig);
  const topThemes = rankedThemes.slice(0, 3);

  const themeNames = topThemes.map(t => t.theme);

  const { data: themes, error: themesError } = await supabase
    .from("scripture_themes")
    .select("id, slug, name")
    .in("slug", themeNames);

  if (themesError) throw themesError;

  const themeScoreMap = new Map(topThemes.map(t => [t.theme, t.score]));
  const themeById = new Map(themes.map(t => [t.id, t]));

  const themeIds = themes.map(t => t.id);

  const { data: mappings, error: mappingsError } = await supabase
    .from("scripture_theme_map")
    .select(`
      theme_id,
      weight,
      notes,
      scripture_passages (
        id,
        reference,
        book_name,
        chapter,
        verse_start,
        verse_end,
        translation,
        text,
        devotional_summary,
        caution_notes
      )
    `)
    .in("theme_id", themeIds);

  if (mappingsError) throw mappingsError;

  const candidates = mappings.map(row => {
    const theme = themeById.get(row.theme_id);
    const passage = Array.isArray(row.scripture_passages)
      ? row.scripture_passages[0]
      : row.scripture_passages;

    return {
      theme_slug: theme.slug,
      theme_name: theme.name,
      theme_score: themeScoreMap.get(theme.slug) || 0,
      mapping_weight: row.weight,
      reference: passage.reference,
      text: passage.text,
      devotional_summary: passage.devotional_summary,
      combined_score: (themeScoreMap.get(theme.slug) || 0) * 10 + row.weight
    };
  });

  candidates.sort((a, b) =>
    b.combined_score - a.combined_score ||
    b.theme_score - a.theme_score ||
    b.mapping_weight - a.mapping_weight ||
    a.reference.localeCompare(b.reference)
  );

  console.log("Top themes:");
  console.log(JSON.stringify(topThemes, null, 2));

  console.log("\nCandidate passages:");
  console.log(JSON.stringify(candidates, null, 2));
}

main().catch((err) => {
  console.error("Passage selection test failed:");
  console.error(err);
  process.exit(1);
});