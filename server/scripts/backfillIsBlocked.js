const mongoose = require("mongoose");
const User = require("../models/auth.model");
require("dotenv").config(); // 👈 add this line

(async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const res = await User.updateMany(
      { isBlocked: { $exists: false } },
      { $set: { isBlocked: false } }
    );

    console.log(
      `✅ Backfilled ${res.modifiedCount} users with isBlocked:false`
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
})();
