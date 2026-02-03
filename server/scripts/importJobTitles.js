const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const JobTitle = require("../models/JobTitle");
const { normalizeJobTitle } = require("../controllers/jobTitle.Controller");

const url = process.env.JOB_TITLES_URL || "";
const filePath = process.env.JOB_TITLES_FILE || "";
const hfDataset = process.env.JOB_TITLES_HF_DATASET || "gpriday/job-titles";
const hfSample = Number(process.env.JOB_TITLES_HF_SAMPLE || 0);
const hfDelayMs = Number(process.env.JOB_TITLES_HF_DELAY_MS || 0);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchJson = async (source, attempt = 0) => {
  const res = await fetch(source);
  if (res.status === 429 && attempt < 6) {
    const backoff = Math.min(30000, 1000 * Math.pow(2, attempt));
    await sleep(backoff);
    return fetchJson(source, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

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

const loadFromHfRows = async (datasetName) => {
  const splitsUrl = `https://datasets-server.huggingface.co/splits?dataset=${encodeURIComponent(
    datasetName
  )}`;
  const splits = await fetchJson(splitsUrl);
  const first = splits?.splits?.[0];
  if (!first) {
    throw new Error("No splits found for dataset.");
  }
  const config = first.config || "default";
  const split = first.split || "train";

  let numRows = 0;
  if (hfSample > 0) {
    numRows = hfSample;
  } else {
    const sizeUrl = `https://datasets-server.huggingface.co/size?dataset=${encodeURIComponent(
      datasetName
    )}&config=${encodeURIComponent(config)}&split=${encodeURIComponent(split)}`;
    const sizeJson = await fetchJson(sizeUrl);
    numRows =
      sizeJson?.size?.splits?.[0]?.num_rows ||
      sizeJson?.size?.dataset?.num_rows ||
      0;
    if (!numRows) {
      throw new Error("Failed to determine dataset size.");
    }
  }

  const titles = [];
  const pageSize = 100;
  for (let offset = 0; offset < numRows; offset += pageSize) {
    const rowsUrl = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(
      datasetName
    )}&config=${encodeURIComponent(config)}&split=${encodeURIComponent(
      split
    )}&offset=${offset}&length=${pageSize}`;
    const rowsJson = await fetchJson(rowsUrl);
    const rows = Array.isArray(rowsJson?.rows) ? rowsJson.rows : [];
    rows.forEach((row) => {
      const title =
        row?.row?.job_title ||
        row?.row?.title ||
        row?.row?.jobTitle ||
        "";
      if (title) titles.push(String(title));
    });
    if (hfDelayMs > 0) {
      await sleep(hfDelayMs);
    }
  }
  return titles;
};

const main = async () => {
  const mongoUri = process.env.DB_URI;
  if (!mongoUri) throw new Error("DB_URI is required");
  if (!url && !filePath && !hfDataset) {
    throw new Error("Set JOB_TITLES_URL or JOB_TITLES_FILE or JOB_TITLES_HF_DATASET");
  }

  await mongoose.connect(mongoUri);

  let titles = [];
  if (url || filePath) {
    const raw = url ? await loadFromUrl(url) : loadFromFile(filePath);
    titles = parseTitles(raw);
  } else {
    titles = await loadFromHfRows(hfDataset);
  }

  const ops = titles.map((title) => ({
    updateOne: {
      filter: { normalized: normalizeJobTitle(title) },
      update: {
        $setOnInsert: {
          title: String(title).trim(),
          normalized: normalizeJobTitle(title),
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

  const res = await JobTitle.bulkWrite(ops, { ordered: false });
  console.log(
    `Imported: ${res.upsertedCount || 0}, matched: ${res.matchedCount || 0}`
  );

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
