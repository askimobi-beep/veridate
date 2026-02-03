const mongoose = require("mongoose");

const DegreeTitleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    normalized: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

DegreeTitleSchema.index({ title: 1 });

module.exports = mongoose.model("DegreeTitle", DegreeTitleSchema);
