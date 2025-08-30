export const toYMD = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 10);
};
