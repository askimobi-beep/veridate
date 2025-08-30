// server.js
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const DatabaseConnection = require("./config/Database");
const authRoutes = require("./router/auth.Routes");
const profileRoutes = require("./router/profile.Routes");
const verify = require("./router/verify.routes");
const corsOptions = require("./config/corsOptions");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/verify", verify);


app.listen(PORT, () => {
  DatabaseConnection();
  console.log(` 🟢 Server is running at http://localhost:${PORT}`);
});
