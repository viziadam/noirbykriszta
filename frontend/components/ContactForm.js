"use client";

import { useState } from "react";
import Link from "next/link";
import { apiSend } from "@/lib/api";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: "loading", msg: "" });
    try {
      await apiSend("/contact", "POST", { ...form, gdprConsent: consent });
      setStatus({ state: "ok", msg: "Köszönöm az üzeneted! Hamarosan válaszolok." });
      setForm({ name: "", email: "", message: "" });
      setConsent(false);
    } catch (err) {
      setStatus({ state: "err", msg: err.message });
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <h3>Írj nekem</h3>
      {status.state === "ok" && <div className="form-note form-note--ok">{status.msg}</div>}
      {status.state === "err" && <div className="form-note form-note--err">{status.msg}</div>}

      <div className="field">
        <label htmlFor="c-name">Név</label>
        <input id="c-name" required value={form.name} onChange={update("name")} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="c-email">Email</label>
        <input
          id="c-email"
          type="email"
          required
          value={form.email}
          onChange={update("email")}
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label htmlFor="c-msg">Üzenet</label>
        <textarea id="c-msg" required value={form.message} onChange={update("message")} />
      </div>
      <label className="checkbox" style={{ marginBottom: "1.1rem" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        <span>
          Elolvastam és elfogadom az{" "}
          <Link href="/adatkezeles" style={{ textDecoration: "underline" }}>
            adatkezelési tájékoztatót
          </Link>
          .
        </span>
      </label>
      <button className="btn btn--primary btn--block" disabled={status.state === "loading"}>
        {status.state === "loading" ? "Küldés…" : "Üzenet küldése"}
      </button>
    </form>
  );
}
