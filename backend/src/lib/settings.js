import prisma from "../prisma.js";

/*
 * Foglalási beállítások — az adatbázisban tárolva (SiteContent, key = "booking"),
 * ezért az admin felületről módosíthatók ÉS redeploy után megmaradnak.
 * Ha a rekord még nem létezik, a .env / alapértékek érvényesek.
 */

export const ALLOWED_STEPS = [10, 15, 20, 30, 60];

const DEFAULTS = () => ({
  slotStepMinutes: normalizeStep(process.env.SLOT_STEP_MINUTES, 30),
  minLeadHours: normalizeLead(process.env.MIN_LEAD_HOURS, 12),
});

function normalizeStep(value, fallback) {
  const n = Math.round(Number(value));
  return ALLOWED_STEPS.includes(n) ? n : fallback;
}

function normalizeLead(value, fallback) {
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return fallback;
  return Math.min(24 * 14, Math.max(0, n));
}

let cache = null;
let cacheAt = 0;
const TTL_MS = 5000;

export async function getBookingSettings() {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  const defaults = DEFAULTS();
  let result = defaults;
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: "booking" } });
    if (row) {
      const v = JSON.parse(row.value);
      result = {
        slotStepMinutes: normalizeStep(v.slotStepMinutes, defaults.slotStepMinutes),
        minLeadHours:
          v.minLeadHours == null
            ? defaults.minLeadHours
            : normalizeLead(v.minLeadHours, defaults.minLeadHours),
      };
    }
  } catch {
    result = defaults;
  }
  cache = result;
  cacheAt = Date.now();
  return result;
}

export async function setBookingSettings(patch = {}) {
  const current = await getBookingSettings();
  const next = {
    slotStepMinutes: normalizeStep(
      patch.slotStepMinutes ?? current.slotStepMinutes,
      current.slotStepMinutes
    ),
    minLeadHours: normalizeLead(patch.minLeadHours ?? current.minLeadHours, current.minLeadHours),
  };
  await prisma.siteContent.upsert({
    where: { key: "booking" },
    update: { value: JSON.stringify(next) },
    create: { key: "booking", value: JSON.stringify(next) },
  });
  cache = next;
  cacheAt = Date.now();
  return next;
}
