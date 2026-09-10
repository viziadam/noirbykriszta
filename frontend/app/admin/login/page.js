"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getToken, setToken } from "@/lib/adminApi";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/admin/dashboard");
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sikertelen bejelentkezés");
      setToken(data.token);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin__login">
      <form onSubmit={submit}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Logo size={44} />
        </div>
        <h1 style={{ fontSize: "1.4rem", textAlign: "center" }}>Admin belépés</h1>
        {error && <div className="form-note form-note--err">{error}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Jelszó</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn btn--primary btn--block" disabled={loading}>
          {loading ? "Belépés…" : "Belépés"}
        </button>
      </form>
    </div>
  );
}
