const mongoose = require("mongoose");

const JobTitleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    normalized: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

JobTitleSchema.index({ title: 1 });

module.exports = mongoose.model("JobTitle", JobTitleSchema);
