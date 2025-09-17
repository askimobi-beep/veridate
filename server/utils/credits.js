// utils/credits.js
exports.summarizeEduCredits = (userDoc) => {
  const buckets = (userDoc?.verifyCredits?.education || []).map((b) => {
    const available = Number(b.available || 0);
    const used = Number(b.used || 0);
    return {
      institute: b.institute,
      instituteKey: b.instituteKey,
      available,
      used,
      total: available + used, // computed
    };
  });

  const totals = buckets.reduce(
    (acc, b) => {
      acc.available += b.available;
      acc.used += b.used;
      return acc;
    },
    { available: 0, used: 0 }
  );

  return { buckets, totals: { ...totals, total: totals.available + totals.used } };
};
