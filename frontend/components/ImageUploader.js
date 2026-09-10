"use client";

import { useRef, useState } from "react";
import { getToken } from "@/lib/adminApi";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

/**
 * Admin képfeltöltő: fájl kiválasztása → feltöltés a backendre → a mentett kép
 * URL-jét adja vissza az onChange-en keresztül. Kézi URL beillesztés is támogatott.
 */
export default function ImageUploader({ value, onChange, label = "Kép" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BASE}/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "A feltöltés nem sikerült");
      onChange(data.url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="admin-field">
      <label>{label}</label>

      {value ? (
        <div className="uploader">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Előnézet" className="uploader__preview" />
          <div className="admin-row">
            <button
              type="button"
              className="btn-mini"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "Feltöltés…" : "Csere"}
            </button>
            <button
              type="button"
              className="btn-mini btn-mini--danger"
              onClick={() => onChange("")}
            >
              Eltávolítás
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="uploader__drop"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Feltöltés…" : "⬆  Kép feltöltése (JPG, PNG, WebP — max. 6 MB)"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />
      <input
        type="text"
        placeholder="vagy illessz be egy kép URL-t"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ marginTop: 6 }}
      />
      {err && (
        <span className="muted" style={{ color: "#c33" }}>
          {err}
        </span>
      )}
    </div>
  );
}
