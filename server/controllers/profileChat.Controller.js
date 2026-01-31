const Profile = require("../models/Profile");
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- helpers ----
const toISO = (d) => (d ? new Date(d).toISOString() : null);
const yearsBetween = (start, end) => {
  const s = start ? new Date(start).getTime() : NaN;
  const e = end ? new Date(end).getTime() : Date.now();
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  const yrs = (e - s) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, yrs);
};
const parseEnd = (d) => (d ? new Date(d).getTime() : Infinity); // null/undefined = current

function extractProfileFields(profileDoc) {
  if (!profileDoc) return {};
  return {
    name: profileDoc.name || null,
    email: profileDoc.email || null,
    mobileCountryCode: profileDoc.mobileCountryCode || null,
    mobile: profileDoc.mobile || null,
    city: profileDoc.city || null,
    country: profileDoc.country || null,
    gender: profileDoc.gender || null,
    residentStatus: profileDoc.residentStatus || null,
    nationality: profileDoc.nationality || null,
    dob: toISO(profileDoc.dob),
    shiftPreferences: Array.isArray(profileDoc.shiftPreferences)
      ? profileDoc.shiftPreferences
      : [],
    workAuthorization: Array.isArray(profileDoc.workAuthorization)
      ? profileDoc.workAuthorization
      : [],
    education: Array.isArray(profileDoc.education) ? profileDoc.education : [],
    experience: Array.isArray(profileDoc.experience) ? profileDoc.experience : [],
  };
}

function normalizeArrays(p) {
  const education = Array.isArray(p.education)
    ? p.education.map((e) => ({
        degreeTitle: e.degreeTitle || null,
        institute: e.institute || null,
        startDate: toISO(e.startDate),
        endDate: toISO(e.endDate),
      }))
    : [];

  const experience = Array.isArray(p.experience)
    ? p.experience.map((e) => ({
        jobTitle: e.jobTitle || null,
        company: e.company || null,
        industry: e.industry || null,
        jobFunctions: Array.isArray(e.jobFunctions) ? e.jobFunctions : [],
        startDate: toISO(e.startDate),
        endDate: toISO(e.endDate),
      }))
    : [];

  return { ...p, education, experience };
}

function deriveFacts(profile) {
  const exp = profile.experience || [];
  const edu = profile.education || [];

  // most recent experience: endDate null/undefined = current (Infinity), otherwise pick max endDate
  const expSorted = [...exp].sort((a, b) => parseEnd(b.endDate) - parseEnd(a.endDate));
  const mostRecentExp = expSorted[0] || null;

  // total experience years
  const totalYears = exp.reduce((acc, r) => acc + yearsBetween(r.startDate, r.endDate), 0);
  const totalYearsRounded = Math.round(totalYears * 10) / 10;

  // most recent education by endDate (fallback: by startDate)
  const eduSorted = [...edu].sort((a, b) => {
    const be = b.endDate ? new Date(b.endDate).getTime() : -Infinity;
    const ae = a.endDate ? new Date(a.endDate).getTime() : -Infinity;
    if (be !== ae) return be - ae;
    const bs = b.startDate ? new Date(b.startDate).getTime() : -Infinity;
    const as = a.startDate ? new Date(a.startDate).getTime() : -Infinity;
    return bs - as;
  });
  const mostRecentEdu = eduSorted[0] || null;

  const mostRecentEduYear = mostRecentEdu?.endDate
    ? new Date(mostRecentEdu.endDate).getFullYear()
    : null;

  return {
    mostRecentExp, // { jobTitle, company, ... }
    mostRecentEdu, // { degreeTitle, institute, ... }
    mostRecentEduYear, // e.g. 2022
    totalYearsRounded, // e.g. 3.7
  };
}

function buildAIContext(profileDoc) {
  const sanitized = normalizeArrays(extractProfileFields(profileDoc));
  const facts = deriveFacts(sanitized);
  return {
    ...sanitized,
    facts, // add derived facts so "most recent" lookups are trivial
  };
}


