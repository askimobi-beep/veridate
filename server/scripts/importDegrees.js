const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const DegreeTitle = require("../models/DegreeTitle");
const { normalizeDegreeTitle } = require("../controllers/degree.Controller");

const url = process.env.DEGREE_TITLES_URL || "";
const filePath = process.env.DEGREE_TITLES_FILE || "";

const loadFromUrl = async (source) => {
  const res = await fetch(source);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return text;
};

const loadFromFile = (source) =>
  fs.readFileSync(path.resolve(source), "utf8");

const parseTitles = (raw) => {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return [];
  try {
    const json = JSON.parse(trimmed);
    if (Array.isArray(json)) return json.map(String);
  } catch {}
  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const main = async () => {
  const mongoUri = process.env.DB_URI;
  if (!mongoUri) throw new Error("DB_URI is required");
  if (!url && !filePath) {
    throw new Error("Set DEGREE_TITLES_URL or DEGREE_TITLES_FILE");
  }

  await mongoose.connect(mongoUri);

  const raw = url ? await loadFromUrl(url) : loadFromFile(filePath);
  const titles = parseTitles(raw);

  const ops = titles.map((title) => ({
    updateOne: {
      filter: { normalized: normalizeDegreeTitle(title) },
      update: {
        $setOnInsert: {
          title: String(title).trim(),
          normalized: normalizeDegreeTitle(title),
        },
      },
      upsert: true,
    },
  }));

  if (!ops.length) {
    console.log("No titles to import.");
    await mongoose.disconnect();
    return;
  }

  const res = await DegreeTitle.bulkWrite(ops, { ordered: false });
  console.log(
    `Imported: ${res.upsertedCount || 0}, matched: ${res.matchedCount || 0}`
  );

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
