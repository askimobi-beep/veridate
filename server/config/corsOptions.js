const allowedOrigins = [
  "http://localhost:5173",
  "https://app.veridate.site",
  "https://www.app.veridate.site",
  
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // ✅ allow Electron or browser
    } else {
      console.log("❌ Blocked by CORS:", origin); // helpful for debugging
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

module.exports = corsOptions;
