// utils/normalize.js
exports.normalizeInstitute = (s) =>
  (s || "").trim().toLowerCase().replace(/\s+/g, " ");
