function normalizeText(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Export as an object (CommonJS)
module.exports = {
  normalizeInstitute: normalizeText,
  normalizeCompany: normalizeText,
};
