"use client";

const KEY = "nbk-admin-token";
const BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export const getToken = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    localStorage.setItem(KEY, t);
  } catch {}
};
export const clearToken = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {}
};

export async function adminFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new Error("Lejárt munkamenet");
  }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
