const normalizeUtils = require("../utils/normalize");
const normalizeInstitute =
  normalizeUtils?.normalizeInstitute ||
  ((s) => (s || "").trim().toLowerCase().replace(/\s+/g, " "));
const normalizeCompany =
  normalizeUtils?.normalizeCompany ||
  ((s) => (s || "").trim().toLowerCase().replace(/\s+/g, " "));
