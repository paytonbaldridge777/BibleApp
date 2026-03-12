import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const MAP_PATH = path.join(rootDir, "data", "onboarding-theme-map.json");

function addWeightedThemes(scoreMap, themes, weight) {
  for (const theme of themes) {
    scoreMap.set(theme, (scoreMap.get(theme) || 0) + weight);
  }
}

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

  const ranked = Array.from(scoreMap.entries())
    .map(([theme, score]) => ({
      theme,
      score,
      reasons: reasons.get(theme) || [],
    }))
    .sort((a, b) => b.score - a.score || a.theme.localeCompare(b.theme));

  return ranked;
}

async function main() {
  const mapRaw = await fs.readFile(MAP_PATH, "utf8");
  const mapConfig = JSON.parse(mapRaw);

  const sampleProfile = {
    struggles: [
      "finding-relevant-verses",
      "understanding-meaning",
      "knowing-where-to-start"
    ],
    seeking: [
      "spiritual-growth",
      "wisdom",
      "purpose"
    ],
    familiarity: "intermediate",
    content_types: ["short-verses", "study-explanations"],
    tone: "reflective",
    devotional_length: "short",
    free_text: "I want to better communicate with God"
  };

  const ranked = rankThemesForProfile(sampleProfile, mapConfig);

  console.log(JSON.stringify(ranked, null, 2));
}

main().catch((err) => {
  console.error("Theme scoring failed:");
  console.error(err);
  process.exit(1);
});