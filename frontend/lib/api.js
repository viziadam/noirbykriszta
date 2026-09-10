// Egységes API kliens. Szerveren a BACKEND_URL-t használja közvetlenül,
// böngészőben a /api relatív útvonalat (a next.config.js rewrites proxyzza).

const SERVER_BASE = process.env.BACKEND_URL || "http://localhost:4000";
const BROWSER_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function url(path) {
  if (typeof window === "undefined") return `${SERVER_BASE}/api${path}`;
  return `${BROWSER_BASE}${path}`;
}

/** Szerver-oldali fetch fallback-kel: ha a backend nem elérhető, a megadott
 *  alapértéket adja vissza, hogy az oldal SSR-ben akkor is rendereljen. */
export async function serverGet(path, fallback = null) {
  try {
    const res = await fetch(`${SERVER_BASE}/api${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[api] serverGet ${path} sikertelen: ${e.message} — fallback`);
    return fallback;
  }
}

export async function apiGet(path) {
  const res = await fetch(url(path));
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

export async function apiSend(path, method, body, token) {
  const res = await fetch(url(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
