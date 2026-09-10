import prisma from "../prisma.js";
import { getBookingSettings } from "./settings.js";

/*
 * Az összes idő-számítás a szerver helyi idejében fut. A konténer a
 * TZ=Europe/Budapest beállítással indul (lásd docker-compose.yml + Dockerfile),
 * így a "12:00" tényleg 12:00 magyar idő szerint — és a tárolt UTC-idő is helyes.
 */

// "HH:MM" -> perc éjféltől
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// dateStr = "YYYY-MM-DD", minutes = perc éjféltől -> Date (szerver helyi idő = Budapest)
const atLocal = (dateStr, minutes) => {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0);
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

/**
 * Kiszámolja egy adott naphoz és szolgáltatáshoz a szabad kezdő-időpontokat.
 *
 * A kezdő-időpontok mindig a "tiszta" órán vannak rácsba igazítva (éjféltől
 * számított step-perces rácspontok). Ezért ha egy foglalás 15:15-kor ér véget,
 * és a felbontás 30 perc, a következő felkínált időpont 15:30 lesz (felfelé
 * kerekítés a rácsra).
 *
 * @returns {Promise<{slots: {start: string, label: string}[], reason?: string, step?: number}>}
 */
export async function getAvailableSlots(dateStr, serviceId) {
  const { slotStepMinutes: step, minLeadHours } = await getBookingSettings();

  const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
  if (!service || !service.isActive) return { slots: [], reason: "invalid-service" };

  const day = atLocal(dateStr, 0);
  const weekday = day.getDay();

  const hours = await prisma.businessHours.findUnique({ where: { weekday } });
  if (!hours || hours.isClosed) return { slots: [], reason: "closed" };

  // Szabadság / szünet ellenőrzése
  const dayStart = atLocal(dateStr, 0);
  const dayEnd = atLocal(dateStr, 24 * 60);
  const timeOff = await prisma.timeOff.findFirst({
    where: { startDate: { lt: dayEnd }, endDate: { gt: dayStart } },
  });
  if (timeOff) return { slots: [], reason: "time-off" };

  const open = toMinutes(hours.openTime);
  const close = toMinutes(hours.closeTime);
  const duration = service.durationMinutes;

  // Aznapi élő foglalások
  const appts = await prisma.appointment.findMany({
    where: {
      status: { not: "cancelled" },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { startTime: true, endTime: true },
  });

  const earliest = new Date(Date.now() + minLeadHours * 60 * 60 * 1000);

  // Első rácspont: az első step-perces (éjféltől számított) pont, ami >= open.
  const first = Math.ceil(open / step) * step;

  const slots = [];
  for (let t = first; t + duration <= close; t += step) {
    const start = atLocal(dateStr, t);
    const end = atLocal(dateStr, t + duration);
    if (start < earliest) continue;
    const clash = appts.some((a) => overlaps(start, end, a.startTime, a.endTime));
    if (clash) continue;
    slots.push({
      start: start.toISOString(),
      label: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
    });
  }

  return { slots, step };
}

/** Ellenőrzi, hogy egy konkrét kezdő időpont még foglalható-e (verseny elleni védelem). */
export async function isSlotStillFree(startIso, serviceId, { enforceGrid = false } = {}) {
  const { slotStepMinutes: step, minLeadHours } = await getBookingSettings();

  const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
  if (!service || !service.isActive) return { ok: false, reason: "invalid-service" };

  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return { ok: false, reason: "invalid-date" };
  const end = new Date(start.getTime() + service.durationMinutes * 60000);

  const earliest = new Date(Date.now() + minLeadHours * 60 * 60 * 1000);
  if (start < earliest) return { ok: false, reason: "too-soon" };

  const weekday = start.getDay();
  const hours = await prisma.businessHours.findUnique({ where: { weekday } });
  if (!hours || hours.isClosed) return { ok: false, reason: "closed" };

  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = startMin + service.durationMinutes;
  if (startMin < toMinutes(hours.openTime) || endMin > toMinutes(hours.closeTime)) {
    return { ok: false, reason: "outside-hours" };
  }

  // Online foglalásnál csak a felkínált rácspontok fogadhatók el.
  if (enforceGrid && startMin % step !== 0) {
    return { ok: false, reason: "off-grid" };
  }

  const timeOff = await prisma.timeOff.findFirst({
    where: { startDate: { lt: end }, endDate: { gt: start } },
  });
  if (timeOff) return { ok: false, reason: "time-off" };

  const clash = await prisma.appointment.findFirst({
    where: {
      status: { not: "cancelled" },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  if (clash) return { ok: false, reason: "taken" };

  return { ok: true, service, start, end };
}
