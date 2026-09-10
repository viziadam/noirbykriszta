"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("nbk-cookie-consent")) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const decide = (value) => {
    try {
      localStorage.setItem("nbk-cookie-consent", value);
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookie" role="dialog" aria-label="Süti tájékoztató">
      <p style={{ margin: 0 }}>
        Ez a weboldal a működéséhez és a látogatottság méréséhez sütiket használ. A részletekért
        lásd az{" "}
        <Link href="/adatkezeles" style={{ color: "var(--gold-light)", textDecoration: "underline" }}>
          adatkezelési tájékoztatót
        </Link>
        .
      </p>
      <div className="cookie__actions">
        <button className="btn btn--primary btn--sm" onClick={() => decide("all")}>
          Elfogadom
        </button>
        <button className="btn btn--outline btn--sm" onClick={() => decide("essential")}>
          Csak a szükségeseket
        </button>
      </div>
    </div>
  );
}
