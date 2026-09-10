import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../prisma.js";
import { isSlotStillFree } from "../lib/availability.js";
import { upload } from "../lib/upload.js";
import { sendBookingStatusChanged } from "../lib/email.js";

const router = Router();
router.use(requireAuth);

/* ============================= KÉPFELTÖLTÉS ============================= */
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nincs feltöltött fájl" });
  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
  });
});

/* ============================== SZOLGÁLTATÁSOK ============================= */
router.get("/services", async (_req, res) => {
  const services = await prisma.service.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });
  res.json({ services });
});

router.post("/services", async (req, res) => {
  const { category, name, description, durationMinutes, price, isActive, order, imageUrl } =
    req.body || {};
  if (!category || !name) return res.status(400).json({ error: "category és name kötelező" });
  const service = await prisma.service.create({
    data: {
      category,
      name,
      description: description || "",
      imageUrl: imageUrl || null,
      durationMinutes: Number(durationMinutes) || 60,
      price: Number(price) || 0,
      isActive: isActive !== false,
      order: Number(order) || 0,
    },
  });
  res.status(201).json({ service });
});

router.put("/services/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = {};
  for (const k of ["category", "name", "description"]) if (k in req.body) data[k] = req.body[k];
  if ("imageUrl" in req.body) data.imageUrl = req.body.imageUrl || null;
  for (const k of ["durationMinutes", "price", "order"])
    if (k in req.body) data[k] = Number(req.body[k]);
  if ("isActive" in req.body) data.isActive = Boolean(req.body.isActive);
  const service = await prisma.service.update({ where: { id }, data });
  res.json({ service });
});

router.delete("/services/:id", async (req, res) => {
  const id = Number(req.params.id);
  const count = await prisma.appointment.count({ where: { serviceId: id } });
  if (count > 0) {
    // Ne töröljük, ha van hozzá foglalás — csak inaktiváljuk
    const service = await prisma.service.update({ where: { id }, data: { isActive: false } });
    return res.json({ service, softDeleted: true });
  }
  await prisma.service.delete({ where: { id } });
  res.json({ ok: true });
});

/* ================================= GALÉRIA =============================== */
router.get("/gallery", async (_req, res) => {
  const images = await prisma.galleryImage.findMany({ orderBy: [{ order: "asc" }] });
  res.json({ images });
});

router.post("/gallery", async (req, res) => {
  const { url, urlAfter, category, caption, order, type } = req.body || {};
  if (!url) return res.status(400).json({ error: "url kötelező" });
  const image = await prisma.galleryImage.create({
    data: {
      url,
      urlAfter: urlAfter || null,
      category: category || "szempilla",
      caption: caption || "",
      order: Number(order) || 0,
      type: type || "gallery",
    },
  });
  res.status(201).json({ image });
});

router.put("/gallery/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = {};
  for (const k of ["url", "urlAfter", "category", "caption", "type"])
    if (k in req.body) data[k] = req.body[k] || (k === "urlAfter" ? null : "");
  if ("order" in req.body) data.order = Number(req.body.order);
  const image = await prisma.galleryImage.update({ where: { id }, data });
  res.json({ image });
});

router.put("/gallery-order", async (req, res) => {
  // { ids: [3, 1, 2] } — az új sorrend
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids tömb kötelező" });
  await prisma.$transaction(
    ids.map((id, i) => prisma.galleryImage.update({ where: { id: Number(id) }, data: { order: i } }))
  );
  res.json({ ok: true });
});

router.delete("/gallery/:id", async (req, res) => {
  await prisma.galleryImage.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

/* =============================== VÉLEMÉNYEK ============================== */
router.get("/testimonials", async (_req, res) => {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
  res.json({ testimonials });
});

router.post("/testimonials", async (req, res) => {
  const { author, text, rating, order, isActive } = req.body || {};
  if (!author || !text) return res.status(400).json({ error: "author és text kötelező" });
  const testimonial = await prisma.testimonial.create({
    data: {
      author,
      text,
      rating: Number(rating) || 5,
      order: Number(order) || 0,
      isActive: isActive !== false,
    },
  });
  res.status(201).json({ testimonial });
});

router.put("/testimonials/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = {};
  for (const k of ["author", "text"]) if (k in req.body) data[k] = req.body[k];
  for (const k of ["rating", "order"]) if (k in req.body) data[k] = Number(req.body[k]);
  if ("isActive" in req.body) data.isActive = Boolean(req.body.isActive);
  const testimonial = await prisma.testimonial.update({ where: { id }, data });
  res.json({ testimonial });
});

router.delete("/testimonials/:id", async (req, res) => {
  await prisma.testimonial.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

/* ============================ OLDAL-TARTALOM ============================ */
router.put("/content/:key", async (req, res) => {
  const key = req.params.key;
  const value = JSON.stringify(req.body?.value ?? {});
  const row = await prisma.siteContent.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  res.json({ content: { key, value: JSON.parse(row.value) } });
});

/* ============================= NYITVATARTÁS ============================= */
router.put("/business-hours", async (req, res) => {
  const { hours } = req.body || {};
  if (!Array.isArray(hours)) return res.status(400).json({ error: "hours tömb kötelező" });
  await prisma.$transaction(
    hours.map((h) =>
      prisma.businessHours.upsert({
        where: { weekday: Number(h.weekday) },
        update: {
          openTime: h.openTime || "09:00",
          closeTime: h.closeTime || "18:00",
          isClosed: Boolean(h.isClosed),
        },
        create: {
          weekday: Number(h.weekday),
          openTime: h.openTime || "09:00",
          closeTime: h.closeTime || "18:00",
          isClosed: Boolean(h.isClosed),
        },
      })
    )
  );
  const updated = await prisma.businessHours.findMany({ orderBy: { weekday: "asc" } });
  res.json({ hours: updated });
});

/* ======================= SZABADSÁG / SZÜNETEK ========================= */
router.get("/time-off", async (_req, res) => {
  const items = await prisma.timeOff.findMany({ orderBy: { startDate: "asc" } });
  res.json({ items });
});

router.post("/time-off", async (req, res) => {
  const { startDate, endDate, reason } = req.body || {};
  if (!startDate || !endDate) return res.status(400).json({ error: "startDate és endDate kötelező" });
  const item = await prisma.timeOff.create({
    data: { startDate: new Date(startDate), endDate: new Date(endDate), reason: reason || "" },
  });
  res.status(201).json({ item });
});

router.delete("/time-off/:id", async (req, res) => {
  await prisma.timeOff.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

/* ============================== FOGLALÁSOK ============================= */
router.get("/appointments", async (req, res) => {
  const { from, to, status } = req.query;
  const where = {};
  if (status) where.status = String(status);
  if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(String(from));
    if (to) where.startTime.lte = new Date(String(to));
  }
  const appointments = await prisma.appointment.findMany({
    where,
    include: { service: true },
    orderBy: { startTime: "asc" },
  });
  res.json({ appointments });
});

router.patch("/appointments/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Érvénytelen státusz" });
  }
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Nincs ilyen foglalás" });

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: { service: true },
  });

  // A vendég és az admin is értesítést kap, ha ténylegesen változott a státusz.
  if (existing.status !== status) {
    try {
      await sendBookingStatusChanged(appointment, appointment.service);
    } catch (e) {
      console.error("Email hiba (státusz):", e.message);
    }
  }

  res.json({ appointment });
});

router.post("/appointments", async (req, res) => {
  // Kézi (telefonos) foglalás rögzítése
  const { serviceId, startTime, customerName, phone, email, note, skipCheck } = req.body || {};
  if (!serviceId || !startTime || !customerName) {
    return res.status(400).json({ error: "serviceId, startTime, customerName kötelező" });
  }
  const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
  if (!service) return res.status(400).json({ error: "Ismeretlen szolgáltatás" });

  let start = new Date(startTime);
  let end = new Date(start.getTime() + service.durationMinutes * 60000);

  if (!skipCheck) {
    const check = await isSlotStillFree(start.toISOString(), serviceId);
    if (!check.ok) return res.status(409).json({ error: "Ütközés / zárva", reason: check.reason });
    start = check.start;
    end = check.end;
  }

  const appointment = await prisma.appointment.create({
    data: {
      serviceId: Number(serviceId),
      customerName,
      phone: phone || "",
      email: email || "",
      note: note || "",
      startTime: start,
      endTime: end,
      status: "confirmed",
      source: "manual",
    },
    include: { service: true },
  });

  // Ha van email cím, a vendég megkapja a (megerősített) foglalás részleteit.
  if (appointment.email) {
    try {
      await sendBookingStatusChanged(appointment, appointment.service);
    } catch (e) {
      console.error("Email hiba (kézi foglalás):", e.message);
    }
  }

  res.status(201).json({ appointment });
});

router.delete("/appointments/:id", async (req, res) => {
  await prisma.appointment.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

/* ============================ KAPCSOLAT ÜZENETEK ===================== */
router.get("/messages", async (_req, res) => {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ messages });
});

export default router;
