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
    throw new Error("Usage: node script/test-score-real-user.mjs <user_id>");
  }

  const mapRaw = await fs.readFile(MAP_PATH, "utf8");
  const mapConfig = JSON.parse(mapRaw);

  const { data, error } = await supabase
    .from("spiritual_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  const profile = normalizeSpiritualProfile(data);
  const ranked = rankThemesForProfile(profile, mapConfig);

  console.log("Normalized profile:");
  console.log(JSON.stringify(profile, null, 2));

  console.log("\nRanked themes:");
  console.log(JSON.stringify(ranked, null, 2));
}

main().catch((err) => {
  console.error("Real-user scoring failed:");
  console.error(err);
  process.exit(1);
});