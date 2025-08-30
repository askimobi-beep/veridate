// utils/profileUtils.js

export const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const parseTime = (d) => {
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : NaN;
};

// pick “latest” item in an array by date
export const latestByDate = (rows, startKey = "startDate", endKey = "endDate") => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const r of rows) {
    const hasEnd = r?.[endKey] != null && r?.[endKey] !== "";
    const end = parseTime(r?.[endKey]);
    const start = parseTime(r?.[startKey]);

    const score = hasEnd
      ? Math.max(Number.isNaN(end) ? -Infinity : end, Number.isNaN(start) ? -Infinity : start)
      : Number.MAX_SAFE_INTEGER; // ongoing wins

    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best || null;
};
