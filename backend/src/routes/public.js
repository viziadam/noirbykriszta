import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import prisma from "../prisma.js";
import { getAvailableSlots, isSlotStillFree } from "../lib/availability.js";
import { getBookingSettings } from "../lib/settings.js";
import { sendBookingCreated, sendContactEmail } from "../lib/email.js";

const router = Router();

const parseContent = (row, fallback = {}) => {
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
};

/* ------------------------------- Szolgáltatások ------------------------------ */
router.get("/services", async (_req, res) => {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { order: "asc" }, { price: "asc" }],
  });
  // Kategóriánként csoportosítva a frontendnek
  const grouped = [];
  for (const s of services) {
    let g = grouped.find((x) => x.category === s.category);
    if (!g) {
      g = { category: s.category, items: [] };
      grouped.push(g);
    }
    g.items.push(s);
  }
  res.json({ services, grouped });
});

/* --------------------------------- Galéria --------------------------------- */
router.get("/gallery", async (req, res) => {
  const { category, type } = req.query;
  const where = {};
  if (category && category !== "mind") where.category = String(category);
  if (type) where.type = String(type);
  const images = await prisma.galleryImage.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  res.json({ images });
});

/* -------------------------------- Vélemények ------------------------------- */
router.get("/testimonials", async (_req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  res.json({ testimonials });
});

/* ------------------------------ Oldal-tartalom ----------------------------- */
router.get("/content", async (_req, res) => {
  const rows = await prisma.siteContent.findMany();
  const map = {};
  for (const r of rows) map[r.key] = parseContent(r);
  res.json(map);
});

/* ------------------------------ Nyitvatartás ------------------------------- */
router.get("/business-hours", async (_req, res) => {
  const hours = await prisma.businessHours.findMany({ orderBy: { weekday: "asc" } });
  res.json({ hours });
});

/* ---------------------- Foglalási beállítások (publikus) ------------------- */
router.get("/booking-settings", async (_req, res) => {
  const s = await getBookingSettings();
  res.json(s);
});

/* --------------------------- Szabad időpontok ----------------------------- */
router.get("/availability", async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) return res.status(400).json({ error: "date és serviceId szükséges" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))
    return res.status(400).json({ error: "date formátum: YYYY-MM-DD" });
  const result = await getAvailableSlots(String(date), Number(serviceId));
  res.json(result);
});

/* ----------------------------- Foglalás létrehozás ------------------------- */
const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 8 });

const bookingSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  startTime: z.string().min(10),
  customerName: z.string().min(2).max(120),
  phone: z.string().min(6).max(40),
  email: z.string().email(),
  note: z.string().max(1000).optional().default(""),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "Az adatkezelési tájékoztató elfogadása kötelező" }),
  }),
});

router.post("/appointments", bookingLimiter, async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Érvénytelen adatok" });
  }
  const { serviceId, startTime, customerName, phone, email, note } = parsed.data;

  const check = await isSlotStillFree(startTime, serviceId, { enforceGrid: true });
  if (!check.ok) {
    return res.status(409).json({ error: "Ez az időpont időközben foglalt lett. Válassz másikat.", reason: check.reason });
  }

  const appointment = await prisma.appointment.create({
    data: {
      serviceId,
      customerName,
      phone,
      email,
      note,
      startTime: check.start,
      endTime: check.end,
      status: "pending",
      source: "online",
    },
  });

  try {
    await sendBookingCreated(appointment, check.service);
  } catch (e) {
    console.error("Email hiba:", e.message);
  }

  res.status(201).json({
    appointment: {
      id: appointment.id,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
    },
    service: check.service,
  });
});

/* --------------------------- Kapcsolatfelvétel ---------------------------- */
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 6 });

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().min(5).max(3000),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "Az adatkezelési tájékoztató elfogadása kötelező" }),
  }),
});

router.post("/contact", contactLimiter, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Érvénytelen adatok" });
  }
  const { name, email, message } = parsed.data;
  await prisma.contactMessage.create({ data: { name, email, message } });
  try {
    await sendContactEmail({ name, email, message });
  } catch (e) {
    console.error("Email hiba:", e.message);
  }
  res.status(201).json({ ok: true });
});

export default router;
