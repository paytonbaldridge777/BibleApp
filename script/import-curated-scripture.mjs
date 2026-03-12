import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const BIBLE_JSON_PATH = path.join(rootDir, "bibles", "web.json");
const CURATED_SEED_PATH = path.join(rootDir, "data", "curated-scripture-seed.json");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function normalizeBookName(bookName) {
  return bookName.replace(/\s+/g, " ").trim().toLowerCase();
}

function parseReference(reference) {
  const match = reference.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) {
    throw new Error(`Invalid reference format: ${reference}`);
  }

  const [, bookName, chapterStr, verseStartStr, verseEndStr] = match;

  return {
    book_name: bookName.trim(),
    chapter: Number(chapterStr),
    verse_start: Number(verseStartStr),
    verse_end: verseEndStr ? Number(verseEndStr) : Number(verseStartStr),
    reference: reference.trim(),
  };
}

function getTestament(bookNumber) {
  return bookNumber >= 1 && bookNumber <= 39 ? "old" : "new";
}

function buildVerseIndex(verses) {
  const byKey = new Map();

  for (const verse of verses) {
    const key = `${normalizeBookName(verse.book_name)}|${verse.chapter}|${verse.verse}`;
    byKey.set(key, verse);
  }

  return byKey;
}

function getPassageFromBible(referenceObj, verseIndex) {
  const verses = [];

  for (let verseNum = referenceObj.verse_start; verseNum <= referenceObj.verse_end; verseNum++) {
    const key = `${normalizeBookName(referenceObj.book_name)}|${referenceObj.chapter}|${verseNum}`;
    const verse = verseIndex.get(key);

    if (!verse) {
      throw new Error(`Verse not found in Bible JSON: ${referenceObj.reference}`);
    }

    verses.push(verse);
  }

  const firstVerse = verses[0];
  const combinedText = verses.map((v) => v.text.trim()).join(" ");

  return {
    book_name: firstVerse.book_name,
    book_number: firstVerse.book,
    chapter: firstVerse.chapter,
    verse_start: referenceObj.verse_start,
    verse_end: referenceObj.verse_end === referenceObj.verse_start ? null : referenceObj.verse_end,
    reference: referenceObj.reference,
    translation: "WEB",
    text: combinedText,
    testament: getTestament(firstVerse.book),
  };
}

async function main() {
  const bibleRaw = await fs.readFile(BIBLE_JSON_PATH, "utf8");
  const curatedRaw = await fs.readFile(CURATED_SEED_PATH, "utf8");

  const bibleData = JSON.parse(bibleRaw);
  const curatedSeed = JSON.parse(curatedRaw);

  if (!Array.isArray(bibleData.verses)) {
    throw new Error("Bible JSON does not contain a top-level verses array.");
  }

  if (!Array.isArray(curatedSeed)) {
    throw new Error("Curated seed file must be an array.");
  }

  const verseIndex = buildVerseIndex(bibleData.verses);

  const uniquePassages = new Map();
  const themeMappings = [];

  for (const item of curatedSeed) {
    if (!item.theme_slug || !item.reference) {
      throw new Error(`Seed item missing theme_slug or reference: ${JSON.stringify(item)}`);
    }

    const parsedRef = parseReference(item.reference);

    if (!uniquePassages.has(item.reference)) {
      const passage = getPassageFromBible(parsedRef, verseIndex);

      uniquePassages.set(item.reference, {
        ...passage,
        devotional_summary: item.devotional_summary ?? null,
        caution_notes: item.notes ?? null,
      });
    }

    themeMappings.push({
      theme_slug: item.theme_slug,
      reference: item.reference,
      weight: Number(item.weight ?? 1),
      notes: item.notes ?? null,
    });
  }

  const passages = Array.from(uniquePassages.values());

  const { data: existingThemes, error: themesError } = await supabase
    .from("scripture_themes")
    .select("id, slug");

  if (themesError) {
    throw themesError;
  }

  const themeIdBySlug = new Map(existingThemes.map((t) => [t.slug, t.id]));

  for (const mapping of themeMappings) {
    if (!themeIdBySlug.has(mapping.theme_slug)) {
      throw new Error(`Theme slug not found in DB: ${mapping.theme_slug}`);
    }
  }

  const { data: insertedPassages, error: passagesError } = await supabase
    .from("scripture_passages")
    .upsert(passages, { onConflict: "reference" })
    .select("id, reference");

  if (passagesError) {
    throw passagesError;
  }

  const passageIdByReference = new Map(insertedPassages.map((p) => [p.reference, p.id]));

  const dbMappings = themeMappings.map((mapping) => ({
    theme_id: themeIdBySlug.get(mapping.theme_slug),
    passage_id: passageIdByReference.get(mapping.reference),
    weight: mapping.weight,
    notes: mapping.notes,
  }));

  const { error: mapError } = await supabase
    .from("scripture_theme_map")
    .upsert(dbMappings, { onConflict: "theme_id,passage_id" });

  if (mapError) {
    throw mapError;
  }

  console.log(`Imported ${passages.length} unique passages.`);
  console.log(`Imported ${dbMappings.length} theme mappings.`);
}

main().catch((err) => {
  console.error("Import failed:");
  console.error(err);
  process.exit(1);
});
