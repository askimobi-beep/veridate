const baseAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://localhost:5173",
  "https://localhost:5174",
  "https://veridate.vercel.app",
  "https://www.veridate.vercel.app",
  "https://veridate-dwiq4n7oy-veridates-projects.vercel.app",
  "https://veridate.store",
  "https://www.veridate.store",
  "https://veridate.live",
  "https://www.veridate.live",
];

const envOrigins = [
  process.env.CLIENT_APP_URL,
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
].filter(Boolean);

const allowedOrigins = Array.from(new Set([...baseAllowedOrigins, ...envOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

module.exports = corsOptions;
