export const huf = (n) =>
  new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(Number(n) || 0) + " Ft";

export const fromPrice = (n) => `${huf(n)}-tól`;

export const duration = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} óra ${m} perc`;
  if (h) return `${h} óra`;
  return `${m} perc`;
};

export const dateLong = (d) =>
  new Intl.DateTimeFormat("hu-HU", { dateStyle: "long", timeZone: "Europe/Budapest" }).format(
    new Date(d)
  );

export const dateTime = (d) =>
  new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Budapest",
  }).format(new Date(d));

export const time = (d) =>
  new Intl.DateTimeFormat("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Budapest",
  }).format(new Date(d));

export const WEEKDAYS = [
  "Vasárnap",
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
  "Szombat",
];

export const CATEGORY_LABELS = {
  mind: "Minden",
  szempilla: "Szempilla",
  szemoldok: "Szemöldök",
  "elotte-utana": "Előtte–Utána",
};
