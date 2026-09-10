import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import prisma from "../prisma.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

// Brute-force elleni alap védelem a login endpointon
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Túl sok próbálkozás. Próbáld újra 15 perc múlva." },
});

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email és jelszó szükséges" });

  const admin = await prisma.admin.findUnique({ where: { email: String(email).toLowerCase() } });
  const ok = admin && (await bcrypt.compare(password, admin.passwordHash));
  if (!ok) return res.status(401).json({ error: "Hibás email vagy jelszó" });

  const token = signToken({ id: admin.id, email: admin.email });
  res.json({ token, admin: { id: admin.id, email: admin.email } });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ admin: { id: req.admin.id, email: req.admin.email } });
});

export default router;
