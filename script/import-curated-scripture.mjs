import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const BIBLE_JSON_PATH = path.join(rootDir, "bibles", "web.json");
const CURATED_SEED_PATH = path.join(rootDir, "data", "curated-scripture-seed.json");

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
  console.log("BIBLE_JSON_PATH:", BIBLE_JSON_PATH);
  console.log("CURATED_SEED_PATH:", CURATED_SEED_PATH);

  const bibleRaw = await fs.readFile(BIBLE_JSON_PATH, "utf8");
  const curatedRaw = await fs.readFile(CURATED_SEED_PATH, "utf8");

  console.log("bibleRaw length:", bibleRaw.length);
  console.log("curatedRaw length:", curatedRaw.length);

  console.log("bibleRaw first 200 chars:", bibleRaw.slice(0, 200));
  console.log("curatedRaw first 200 chars:", curatedRaw.slice(0, 200));

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

  console.log("Prepared passages:");
  console.log(JSON.stringify(passages, null, 2));

  console.log("\nPrepared theme mappings:");
  console.log(JSON.stringify(themeMappings, null, 2));

  console.log(`\nTotal unique passages: ${passages.length}`);
  console.log(`Total theme mappings: ${themeMappings.length}`);
}
main().catch((err) => {
  console.error("Import prep failed:");
  console.error(err);
  process.exit(1);
});
