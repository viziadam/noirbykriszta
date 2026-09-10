"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet, apiSend } from "@/lib/api";
import { huf, duration, dateTime, WEEKDAYS } from "@/lib/format";
import { IconArrowLeft, IconArrowRight } from "./Icons";

const STEPS = ["Szolgáltatás", "Időpont", "Adatok", "Összegzés"];

// A következő N nap ISO dátumként (helyi idő szerint)
function nextDays(n) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate()
    ).padStart(2, "0")}`;
    out.push({ iso, date: day });
  }
  return out;
}

export default function BookingWizard({
  grouped = [],
  initialServiceId = null,
  initialCategory = null,
}) {
  const flatServices = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);
  // Konkrét szolgáltatás CSAK a Szolgáltatások oldal deep-linkjéből (?szolgaltatas=).
  const initial = initialServiceId
    ? flatServices.find((s) => String(s.id) === String(initialServiceId))
    : null;

  const categoryExists = grouped.some((g) => g.category === initialCategory);

  // Ha nincs konkrét szolgáltatás, MINDIG az 1. lépéstől (szolgáltatás kiválasztása) indul.
  const [step, setStep] = useState(initial ? 1 : 0);
  const [category, setCategory] = useState(
    initial?.category || (categoryExists ? initialCategory : grouped[0]?.category) || ""
  );
  const [service, setService] = useState(initial || null);

  const [day, setDay] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState(null);

  const [details, setDetails] = useState({ customerName: "", phone: "", email: "", note: "" });
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const days = useMemo(() => nextDays(21), []);

  useEffect(() => {
    if (step !== 1 || !service || !day) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlots([]);
    setSlot(null);
    apiGet(`/availability?date=${day}&serviceId=${service.id}`)
      .then((res) => {
        if (!cancelled) setSlots(res.slots || []);
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [step, service, day]);

  const canNext =
    (step === 0 && service) ||
    (step === 1 && slot) ||
    (step === 2 && details.customerName.trim() && details.phone.trim() && details.email.trim() && consent) ||
    step === 3;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await apiSend("/appointments", "POST", {
        serviceId: service.id,
        startTime: slot.start,
        customerName: details.customerName,
        phone: details.phone,
        email: details.email,
        note: details.note,
        gdprConsent: consent,
      });
      setDone(res);
    } catch (err) {
      setError(err.message);
      if (/foglalt/i.test(err.message)) setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="wizard text-center">
        <div className="ornament" />
        <h2>Foglalásod rögzítettük!</h2>
        <p className="muted" style={{ maxWidth: "46ch", margin: "0 auto 1.5rem" }}>
          Visszaigazoló emailt küldtünk a(z) <strong>{details.email}</strong> címre. Kriszta hamarosan
          megerősíti az időpontot.
        </p>
        <div className="summary" style={{ textAlign: "left", maxWidth: 420, margin: "0 auto 2rem" }}>
          <div className="summary__row">
            <span>Szolgáltatás</span>
            <span>{done.service?.name}</span>
          </div>
          <div className="summary__row">
            <span>Időpont</span>
            <span>{dateTime(done.appointment?.startTime)}</span>
          </div>
          <div className="summary__row">
            <span>Ár</span>
            <strong>{huf(done.service?.price)}</strong>
          </div>
        </div>
        <Link href="/" className="btn btn--outline-dark">
          Vissza a főoldalra
        </Link>
      </div>
    );
  }

  return (
    <div className="wizard">
      <div className="stepper">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`stepper__item ${i === step ? "is-active" : ""} ${i < step ? "is-done" : ""}`}
          >
            {label}
          </div>
        ))}
      </div>

      {error && <div className="form-note form-note--err">{error}</div>}

      {/* 1. Szolgáltatás */}
      {step === 0 && (
        <div>
          <h3>Válaszd ki a szolgáltatást</h3>
          <div className="field">
            <label htmlFor="cat">Kategória</label>
            <select
              id="cat"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setService(null);
              }}
            >
              {grouped.map((g) => (
                <option key={g.category} value={g.category}>
                  {g.category}
                </option>
              ))}
            </select>
          </div>
          <p className="muted" style={{ marginTop: "-0.4rem" }}>
            Válaszd ki a konkrét szolgáltatást a kategórián belül:
          </p>
          <div className="choice-grid">
            {(grouped.find((g) => g.category === category)?.items || []).map((s) => (
              <button
                key={s.id}
                className={`choice ${service?.id === s.id ? "is-selected" : ""}`}
                onClick={() => setService(s)}
              >
                <strong>{s.name}</strong>
                <span>
                  {duration(s.durationMinutes)} · {huf(s.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Időpont */}
      {step === 1 && service && (
        <div>
          <h3>Válassz napot és időpontot</h3>
          <p className="muted">
            {service.name} · {duration(service.durationMinutes)}
          </p>
          <div className="day-strip">
            {days.map(({ iso, date }) => (
              <button
                key={iso}
                className={`day-chip ${day === iso ? "is-selected" : ""}`}
                onClick={() => setDay(iso)}
              >
                {WEEKDAYS[date.getDay()].slice(0, 3)}
                <strong>{date.getDate()}</strong>
                {date.toLocaleDateString("hu-HU", { month: "short" })}
              </button>
            ))}
          </div>

          {!day && <p className="muted">Válassz egy napot a fenti sávból.</p>}
          {day && slotsLoading && <div className="spinner" />}
          {day && !slotsLoading && slots.length === 0 && (
            <p className="muted">
              Ezen a napon nincs szabad időpont ehhez a szolgáltatáshoz. Próbálj másik napot.
            </p>
          )}
          {day && !slotsLoading && slots.length > 0 && (
            <div className="slot-grid">
              {slots.map((s) => (
                <button
                  key={s.start}
                  className={`slot ${slot?.start === s.start ? "is-selected" : ""}`}
                  onClick={() => setSlot(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Adatok */}
      {step === 2 && (
        <div>
          <h3>Add meg az adataidat</h3>
          <div className="field">
            <label htmlFor="d-name">Név *</label>
            <input
              id="d-name"
              value={details.customerName}
              onChange={(e) => setDetails((d) => ({ ...d, customerName: e.target.value }))}
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="d-phone">Telefonszám *</label>
            <input
              id="d-phone"
              value={details.phone}
              onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
              autoComplete="tel"
            />
          </div>
          <div className="field">
            <label htmlFor="d-email">Email *</label>
            <input
              id="d-email"
              type="email"
              value={details.email}
              onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="d-note">Megjegyzés (opcionális)</label>
            <textarea
              id="d-note"
              value={details.note}
              onChange={(e) => setDetails((d) => ({ ...d, note: e.target.value }))}
              placeholder="Pl. galériában látott stílusra hivatkozás, allergia, egyéb kérés"
            />
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              Elolvastam és elfogadom az{" "}
              <Link href="/adatkezeles" target="_blank" style={{ textDecoration: "underline" }}>
                adatkezelési tájékoztatót
              </Link>
              , és hozzájárulok az adataim foglalás céljából történő kezeléséhez. *
            </span>
          </label>
        </div>
      )}

      {/* 4. Összegzés */}
      {step === 3 && service && slot && (
        <div>
          <h3>Összegzés</h3>
          <div className="summary">
            <div className="summary__row">
              <span>Szolgáltatás</span>
              <span>
                {service.category} — {service.name}
              </span>
            </div>
            <div className="summary__row">
              <span>Időpont</span>
              <span>{dateTime(slot.start)}</span>
            </div>
            <div className="summary__row">
              <span>Időtartam</span>
              <span>{duration(service.durationMinutes)}</span>
            </div>
            <div className="summary__row">
              <span>Név</span>
              <span>{details.customerName}</span>
            </div>
            <div className="summary__row">
              <span>Elérhetőség</span>
              <span>
                {details.phone} · {details.email}
              </span>
            </div>
            <div className="summary__row">
              <span>Fizetendő a helyszínen</span>
              <strong>{huf(service.price)}</strong>
            </div>
          </div>
          <p className="muted" style={{ marginTop: "1rem" }}>
            A „Foglalás véglegesítése” gombra kattintva elküldöd a foglalási igényt. Fizetni a
            helyszínen kell, a kezelés után.
          </p>
        </div>
      )}

      <div className="wizard__nav">
        <button
          className="btn btn--outline-dark btn--sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <IconArrowLeft width={16} height={16} /> Vissza
        </button>
        {step < 3 ? (
          <button
            className="btn btn--primary btn--sm"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
          >
            Tovább <IconArrowRight width={16} height={16} />
          </button>
        ) : (
          <button className="btn btn--primary btn--sm" onClick={submit} disabled={submitting}>
            {submitting ? "Foglalás…" : "Foglalás véglegesítése"}
          </button>
        )}
      </div>
    </div>
  );
}
