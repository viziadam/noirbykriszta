import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { UPLOAD_DIR } from "./lib/upload.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

const origins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());
app.use(cors({ origin: origins, credentials: true }));

// Általános rate limit minden API híváson
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Feltöltött képek kiszolgálása
app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=604800");
    next();
  },
  express.static(UPLOAD_DIR)
);

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Nincs ilyen végpont" }));

// Központi hibakezelő
app.use((err, _req, res, _next) => {
  console.error(err);
  let status = err.status || 500;
  let message = err.message || "Szerverhiba";
  if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "A kép túl nagy (max. 6 MB).";
  } else if (err.name === "MulterError") {
    status = 400;
  }
  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Noir by Kriszta API — http://localhost:${port}`);
});
