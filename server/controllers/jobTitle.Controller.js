const JobTitle = require("../models/JobTitle");

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.listJobTitles = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

    if (!q) {
      const rows = await JobTitle.find({})
        .sort({ title: 1 })
        .limit(limit)
        .lean();
      return res.status(200).json({
        count: rows.length,
        data: rows.map((r) => r.title),
      });
    }

    const normalized = normalize(q);
    if (!normalized) {
      return res.status(200).json({ count: 0, data: [] });
    }

    const rx = new RegExp(escapeRegExp(normalized), "i");
    const rows = await JobTitle.find({
      $or: [{ normalized: rx }, { title: rx }],
    })
      .sort({ title: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      count: rows.length,
      data: rows.map((r) => r.title),
    });
  } catch (err) {
    console.error("listJobTitles error:", err);
    return res.status(500).json({ error: "Failed to fetch job titles" });
  }
};

exports.normalizeJobTitle = normalize;
