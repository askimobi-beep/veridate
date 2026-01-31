export const toYMD = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 10);
};

export const toYM = (d) => {
  if (!d) return "";
  if (typeof d === "string") {
    const raw = d.trim();
    if (/^\d{4}-\d{2}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 7);
  }
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 7);
};
