"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import ImageUploader from "@/components/ImageUploader";
import { adminFetch, getToken, clearToken } from "@/lib/adminApi";
import { huf, duration, dateTime, WEEKDAYS } from "@/lib/format";

const MODULES = [
  { key: "appointments", label: "Foglalások" },
  { key: "services", label: "Szolgáltatások & árak" },
  { key: "gallery", label: "Képek & galéria" },
  { key: "branding", label: "Kinézet (logó, hero)" },
  { key: "hours", label: "Nyitvatartás & szünetek" },
  { key: "contact", label: "Kapcsolat & elérhetőség" },
  { key: "content", label: "Bemutatkozó szöveg" },
  { key: "messages", label: "Üzenetek" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState("appointments");

  useEffect(() => {
    if (!getToken()) router.replace("/admin/login");
    else setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="admin">
      <aside className="admin__side">
        <Logo size={34} />
        <nav className="admin__nav">
          {MODULES.map((m) => (
            <button
              key={m.key}
              className={active === m.key ? "is-active" : ""}
              onClick={() => setActive(m.key)}
            >
              {m.label}
            </button>
          ))}
        </nav>
        <button
          className="admin__logout"
          onClick={() => {
            clearToken();
            router.replace("/admin/login");
          }}
        >
          Kijelentkezés
        </button>
      </aside>
      <main className="admin__main">
        {active === "appointments" && <AppointmentsPanel />}
        {active === "services" && <ServicesPanel />}
        {active === "gallery" && <GalleryPanel />}
        {active === "branding" && <BrandingPanel />}
        {active === "hours" && <HoursPanel />}
        {active === "contact" && <ContactPanel />}
        {active === "content" && <ContentPanel />}
        {active === "messages" && <MessagesPanel />}
      </main>
    </div>
  );
}

/* -------------------------- közös segédek -------------------------- */
function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    setError("");
    fn().then(setData).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, reload, setData };
}

function Msg({ error }) {
  if (!error) return null;
  return <div className="form-note form-note--err">{error}</div>;
}

/* -------------------------- FOGLALÁSOK -------------------------- */
function AppointmentsPanel() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, error, reload } = useLoad(
    () => adminFetch(`/admin/appointments${statusFilter ? `?status=${statusFilter}` : ""}`),
    [statusFilter]
  );
  const services = useLoad(() => adminFetch("/admin/services"), []);
  const [form, setForm] = useState({ serviceId: "", startTime: "", customerName: "", phone: "", email: "", note: "" });
  const [formErr, setFormErr] = useState("");

  const setStatus = async (id, status) => {
    await adminFetch(`/admin/appointments/${id}`, { method: "PATCH", body: { status } });
    reload();
  };
  const remove = async (id) => {
    if (!confirm("Biztosan törlöd ezt a foglalást?")) return;
    await adminFetch(`/admin/appointments/${id}`, { method: "DELETE" });
    reload();
  };
  const addManual = async (e) => {
    e.preventDefault();
    setFormErr("");
    try {
      await adminFetch("/admin/appointments", {
        method: "POST",
        body: { ...form, serviceId: Number(form.serviceId), startTime: new Date(form.startTime).toISOString(), skipCheck: false },
      });
      setForm({ serviceId: "", startTime: "", customerName: "", phone: "", email: "", note: "" });
      reload();
    } catch (e) {
      setFormErr(e.message);
    }
  };

  return (
    <>
      <h1>Foglalások</h1>
      <Msg error={error} />
      <div className="admin-row" style={{ margin: "1rem 0" }}>
        {["", "pending", "confirmed", "cancelled"].map((s) => (
          <button
            key={s}
            className={`btn-mini ${statusFilter === s ? "is-active" : ""}`}
            style={statusFilter === s ? { background: "var(--gold)", color: "#fff" } : {}}
            onClick={() => setStatusFilter(s)}
          >
            {s === "" ? "Mind" : s === "pending" ? "Függő" : s === "confirmed" ? "Megerősített" : "Lemondott"}
          </button>
        ))}
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Időpont</th>
            <th>Vendég</th>
            <th>Szolgáltatás</th>
            <th>Elérhetőség</th>
            <th>Státusz</th>
            <th>Művelet</th>
          </tr>
        </thead>
        <tbody>
          {(data?.appointments || []).map((a) => (
            <tr key={a.id}>
              <td>{dateTime(a.startTime)}</td>
              <td>
                {a.customerName}
                {a.note ? <div className="muted">{a.note}</div> : null}
              </td>
              <td>{a.service?.name}<div className="muted">{huf(a.service?.price)}</div></td>
              <td>
                {a.phone}
                <br />
                {a.email}
              </td>
              <td>
                <span className={`badge badge--${a.status}`}>
                  {a.status === "pending" ? "Függő" : a.status === "confirmed" ? "Megerősítve" : "Lemondva"}
                </span>
              </td>
              <td>
                <div className="admin-row">
                  {a.status !== "confirmed" && (
                    <button className="btn-mini" onClick={() => setStatus(a.id, "confirmed")}>
                      Megerősít
                    </button>
                  )}
                  {a.status !== "cancelled" && (
                    <button className="btn-mini btn-mini--danger" onClick={() => setStatus(a.id, "cancelled")}>
                      Lemond
                    </button>
                  )}
                  <button className="btn-mini btn-mini--danger" onClick={() => remove(a.id)}>
                    Törlés
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {data?.appointments?.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                Nincs foglalás ebben a nézetben.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="admin-card" style={{ marginTop: "1.5rem", maxWidth: 520 }}>
        <h3>Kézi foglalás rögzítése (telefonos)</h3>
        <Msg error={formErr} />
        <form onSubmit={addManual}>
          <div className="admin-field">
            <label>Szolgáltatás</label>
            <select
              required
              value={form.serviceId}
              onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
            >
              <option value="">— válassz —</option>
              {(services.data?.services || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.category} — {s.name} ({duration(s.durationMinutes)})
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>Időpont kezdete</label>
            <input
              type="datetime-local"
              required
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            />
          </div>
          <div className="admin-field">
            <label>Vendég neve</label>
            <input required value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Telefon</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Email</label>
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Megjegyzés</label>
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <button className="btn btn--primary btn--sm">Rögzítés</button>
        </form>
      </div>
    </>
  );
}

/* -------------------------- SZOLGÁLTATÁSOK -------------------------- */
const EMPTY_SERVICE = { category: "", name: "", description: "", imageUrl: "", durationMinutes: 60, price: 0, isActive: true, order: 0 };

function ServicesPanel() {
  const { data, error, reload } = useLoad(() => adminFetch("/admin/services"), []);
  const [editing, setEditing] = useState(null); // service obj vagy EMPTY_SERVICE
  const [err, setErr] = useState("");

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (editing.id) {
        await adminFetch(`/admin/services/${editing.id}`, { method: "PUT", body: editing });
      } else {
        await adminFetch("/admin/services", { method: "POST", body: editing });
      }
      setEditing(null);
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  const remove = async (id) => {
    if (!confirm("Törlöd? Ha van hozzá foglalás, csak inaktívvá válik.")) return;
    await adminFetch(`/admin/services/${id}`, { method: "DELETE" });
    reload();
  };

  return (
    <>
      <h1>Szolgáltatások &amp; árak</h1>
      <Msg error={error} />
      <button className="btn btn--primary btn--sm" style={{ margin: "1rem 0" }} onClick={() => setEditing({ ...EMPTY_SERVICE })}>
        + Új szolgáltatás
      </button>

      {editing && (
        <div className="admin-card" style={{ maxWidth: 560 }}>
          <h3>{editing.id ? "Szerkesztés" : "Új szolgáltatás"}</h3>
          <Msg error={err} />
          <form onSubmit={save}>
            {[
              ["category", "Kategória", "text"],
              ["name", "Név", "text"],
              ["description", "Leírás", "textarea"],
              ["durationMinutes", "Időtartam (perc)", "number"],
              ["price", "Ár (Ft)", "number"],
              ["order", "Sorrend", "number"],
            ].map(([k, label, type]) => (
              <div className="admin-field" key={k}>
                <label>{label}</label>
                {type === "textarea" ? (
                  <textarea value={editing[k]} onChange={(e) => setEditing((s) => ({ ...s, [k]: e.target.value }))} />
                ) : (
                  <input
                    type={type}
                    value={editing[k]}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, [k]: type === "number" ? Number(e.target.value) : e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
            <ImageUploader
              label="Kártyakép (a főoldali szolgáltatás-kártyán jelenik meg)"
              value={editing.imageUrl}
              onChange={(url) => setEditing((s) => ({ ...s, imageUrl: url }))}
            />
            <label className="admin-row" style={{ marginBottom: "0.8rem" }}>
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing((s) => ({ ...s, isActive: e.target.checked }))}
              />{" "}
              Aktív (látszik az oldalon)
            </label>
            <div className="admin-row">
              <button className="btn btn--primary btn--sm">Mentés</button>
              <button type="button" className="btn-mini" onClick={() => setEditing(null)}>
                Mégse
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="admin-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Kép</th>
            <th>Kategória</th>
            <th>Név</th>
            <th>Idő</th>
            <th>Ár</th>
            <th>Aktív</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(data?.services || []).map((s) => (
            <tr key={s.id}>
              <td>
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageUrl}
                    alt=""
                    style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 4 }}
                  />
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>{s.category}</td>
              <td>{s.name}</td>
              <td>{duration(s.durationMinutes)}</td>
              <td>{huf(s.price)}</td>
              <td>{s.isActive ? "Igen" : "Nem"}</td>
              <td>
                <div className="admin-row">
                  <button className="btn-mini" onClick={() => setEditing(s)}>
                    Szerkeszt
                  </button>
                  <button className="btn-mini btn-mini--danger" onClick={() => remove(s.id)}>
                    Törlés
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* -------------------------- GALÉRIA -------------------------- */
const EMPTY_IMG = { url: "", urlAfter: "", category: "szempilla", caption: "", type: "gallery", order: 0 };

function GalleryPanel() {
  const { data, error, reload } = useLoad(() => adminFetch("/admin/gallery"), []);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (editing.id) await adminFetch(`/admin/gallery/${editing.id}`, { method: "PUT", body: editing });
      else await adminFetch("/admin/gallery", { method: "POST", body: editing });
      setEditing(null);
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  const remove = async (id) => {
    if (!confirm("Törlöd a képet?")) return;
    await adminFetch(`/admin/gallery/${id}`, { method: "DELETE" });
    reload();
  };
  const move = async (id, dir) => {
    const list = [...(data.images || [])];
    const idx = list.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    await adminFetch("/admin/gallery-order", { method: "PUT", body: { ids: list.map((i) => i.id) } });
    reload();
  };

  return (
    <>
      <h1>Képek &amp; galéria</h1>
      <p className="muted">
        A kép URL-jét add meg (pl. Cloudinary / S3 feltöltés után). Az „előtte–utána” típusnál az
        „Utána kép URL” mezőt is töltsd ki. A „carousel” és „hero” típus a főoldalon jelenik meg.
      </p>
      <Msg error={error} />
      <button className="btn btn--primary btn--sm" style={{ margin: "1rem 0" }} onClick={() => setEditing({ ...EMPTY_IMG })}>
        + Új kép
      </button>

      {editing && (
        <div className="admin-card" style={{ maxWidth: 560 }}>
          <h3>{editing.id ? "Kép szerkesztése" : "Új kép"}</h3>
          <Msg error={err} />
          <form onSubmit={save}>
            <ImageUploader
              label={editing.type === "before-after" ? "Kép — ELŐTTE" : "Kép"}
              value={editing.url}
              onChange={(url) => setEditing((s) => ({ ...s, url }))}
            />
            {editing.type === "before-after" && (
              <ImageUploader
                label="Kép — UTÁNA"
                value={editing.urlAfter || ""}
                onChange={(url) => setEditing((s) => ({ ...s, urlAfter: url }))}
              />
            )}
            <div className="admin-field">
              <label>Típus</label>
              <select value={editing.type} onChange={(e) => setEditing((s) => ({ ...s, type: e.target.value }))}>
                <option value="gallery">Galéria</option>
                <option value="carousel">Főoldali carousel</option>
                <option value="before-after">Előtte–utána</option>
                <option value="hero">Hero</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Kategória</label>
              <select value={editing.category} onChange={(e) => setEditing((s) => ({ ...s, category: e.target.value }))}>
                <option value="szempilla">Szempilla</option>
                <option value="szemoldok">Szemöldök</option>
                <option value="elotte-utana">Előtte–Utána</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Képaláírás</label>
              <input value={editing.caption} onChange={(e) => setEditing((s) => ({ ...s, caption: e.target.value }))} />
            </div>
            <div className="admin-row">
              <button className="btn btn--primary btn--sm">Mentés</button>
              <button type="button" className="btn-mini" onClick={() => setEditing(null)}>
                Mégse
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="admin-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Kép</th>
            <th>Típus</th>
            <th>Kategória</th>
            <th>Aláírás</th>
            <th>Sorrend</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(data?.images || []).map((img) => (
            <tr key={img.id}>
              <td>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }} />
              </td>
              <td>{img.type}</td>
              <td>{img.category}</td>
              <td>{img.caption}</td>
              <td>
                <div className="admin-row">
                  <button className="btn-mini" onClick={() => move(img.id, -1)}>
                    ↑
                  </button>
                  <button className="btn-mini" onClick={() => move(img.id, 1)}>
                    ↓
                  </button>
                </div>
              </td>
              <td>
                <div className="admin-row">
                  <button className="btn-mini" onClick={() => setEditing(img)}>
                    Szerkeszt
                  </button>
                  <button className="btn-mini btn-mini--danger" onClick={() => remove(img.id)}>
                    Törlés
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* -------------------------- NYITVATARTÁS -------------------------- */
function HoursPanel() {
  const { data, error, reload } = useLoad(() => adminFetch("/business-hours"), []);
  const timeOff = useLoad(() => adminFetch("/admin/time-off"), []);
  const bookingCfg = useLoad(() => adminFetch("/admin/booking-settings"), []);
  const [rows, setRows] = useState(null);
  const [saved, setSaved] = useState("");
  const [off, setOff] = useState({ startDate: "", endDate: "", reason: "" });
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (data?.hours) {
      const byDay = [0, 1, 2, 3, 4, 5, 6].map(
        (wd) => data.hours.find((h) => h.weekday === wd) || { weekday: wd, openTime: "09:00", closeTime: "18:00", isClosed: true }
      );
      setRows(byDay);
    }
  }, [data]);

  useEffect(() => {
    if (bookingCfg.data?.settings) setBooking(bookingCfg.data.settings);
  }, [bookingCfg.data]);

  const saveHours = async () => {
    await adminFetch("/admin/business-hours", { method: "PUT", body: { hours: rows } });
    setSaved("Nyitvatartás mentve.");
    setTimeout(() => setSaved(""), 2500);
    reload();
  };

  const saveBooking = async () => {
    const res = await adminFetch("/admin/booking-settings", { method: "PUT", body: booking });
    setBooking(res.settings);
    setSaved("Foglalási beállítások mentve.");
    setTimeout(() => setSaved(""), 2500);
  };
  const addOff = async (e) => {
    e.preventDefault();
    await adminFetch("/admin/time-off", {
      method: "POST",
      body: { startDate: new Date(off.startDate).toISOString(), endDate: new Date(off.endDate).toISOString(), reason: off.reason },
    });
    setOff({ startDate: "", endDate: "", reason: "" });
    timeOff.reload();
  };
  const removeOff = async (id) => {
    await adminFetch(`/admin/time-off/${id}`, { method: "DELETE" });
    timeOff.reload();
  };

  return (
    <>
      <h1>Nyitvatartás &amp; szünetek</h1>
      <Msg error={error} />
      {saved && <div className="form-note form-note--ok">{saved}</div>}

      <div className="admin-card" style={{ maxWidth: 520 }}>
        {(rows || []).map((r, i) => (
          <div className="admin-row" key={r.weekday} style={{ marginBottom: "0.6rem" }}>
            <strong style={{ width: 90 }}>{WEEKDAYS[r.weekday]}</strong>
            <label className="admin-row" style={{ gap: 4 }}>
              <input
                type="checkbox"
                checked={r.isClosed}
                onChange={(e) => setRows((rs) => rs.map((x, xi) => (xi === i ? { ...x, isClosed: e.target.checked } : x)))}
              />
              Zárva
            </label>
            {!r.isClosed && (
              <>
                <input
                  type="time"
                  value={r.openTime}
                  onChange={(e) => setRows((rs) => rs.map((x, xi) => (xi === i ? { ...x, openTime: e.target.value } : x)))}
                />
                <span>–</span>
                <input
                  type="time"
                  value={r.closeTime}
                  onChange={(e) => setRows((rs) => rs.map((x, xi) => (xi === i ? { ...x, closeTime: e.target.value } : x)))}
                />
              </>
            )}
          </div>
        ))}
        <button className="btn btn--primary btn--sm" onClick={saveHours}>
          Nyitvatartás mentése
        </button>
      </div>

      <div className="admin-card" style={{ maxWidth: 520 }}>
        <h3>Foglalási beállítások</h3>
        <p className="muted">
          Az időpont-felbontás határozza meg, milyen sűrűn kínálunk kezdő-időpontokat.
          Egy szolgáltatás után a következő szabad időpont mindig felfelé kerekítve, a
          rácsra igazítva jelenik meg (pl. 30 perces felbontásnál egy 15:15-ig tartó
          kezelés után 15:30 az első ajánlott időpont).
        </p>
        {booking ? (
          <>
            <div className="admin-field">
              <label>Időpont-felbontás</label>
              <select
                value={booking.slotStepMinutes}
                onChange={(e) =>
                  setBooking((b) => ({ ...b, slotStepMinutes: Number(e.target.value) }))
                }
              >
                {(bookingCfg.data?.allowedSteps || [10, 15, 20, 30, 60]).map((n) => (
                  <option key={n} value={n}>
                    {n} perc
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Legkorábban hány órával előre lehessen foglalni</label>
              <input
                type="number"
                min="0"
                max="336"
                value={booking.minLeadHours}
                onChange={(e) =>
                  setBooking((b) => ({ ...b, minLeadHours: Number(e.target.value) }))
                }
              />
            </div>
            <button className="btn btn--primary btn--sm" onClick={saveBooking}>
              Foglalási beállítások mentése
            </button>
          </>
        ) : (
          <div className="spinner" />
        )}
      </div>

      <div className="admin-card" style={{ maxWidth: 520 }}>
        <h3>Szabadság / szünet</h3>
        <p className="muted">A megadott időszakban a foglalási naptár nem kínál időpontot.</p>
        <form onSubmit={addOff} className="admin-row" style={{ alignItems: "flex-end" }}>
          <div className="admin-field">
            <label>Kezdet</label>
            <input type="date" required value={off.startDate} onChange={(e) => setOff((o) => ({ ...o, startDate: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Vége</label>
            <input type="date" required value={off.endDate} onChange={(e) => setOff((o) => ({ ...o, endDate: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Ok</label>
            <input value={off.reason} onChange={(e) => setOff((o) => ({ ...o, reason: e.target.value }))} />
          </div>
          <button className="btn btn--primary btn--sm">Hozzáad</button>
        </form>
        <table className="admin-table" style={{ marginTop: "1rem" }}>
          <tbody>
            {(timeOff.data?.items || []).map((t) => (
              <tr key={t.id}>
                <td>
                  {new Date(t.startDate).toLocaleDateString("hu-HU")} – {new Date(t.endDate).toLocaleDateString("hu-HU")}
                </td>
                <td>{t.reason}</td>
                <td>
                  <button className="btn-mini btn-mini--danger" onClick={() => removeOff(t.id)}>
                    Törlés
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------------------------- KINÉZET (logó, hero) -------------------------- */
function BrandingPanel() {
  const { data, error, reload } = useLoad(() => adminFetch("/content"), []);
  const [branding, setBranding] = useState(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (data) setBranding(data.branding || { logoUrl: "", heroImageUrl: "", aboutImageUrl: "" });
  }, [data]);

  const save = async () => {
    await adminFetch("/admin/content/branding", { method: "PUT", body: { value: branding } });
    setSaved("Kinézet mentve. Frissítsd az oldalt a változás megtekintéséhez.");
    setTimeout(() => setSaved(""), 3500);
    reload();
  };

  if (!branding) return <div className="spinner" />;

  return (
    <>
      <h1>Kinézet</h1>
      <Msg error={error} />
      {saved && <div className="form-note form-note--ok">{saved}</div>}

      <div className="admin-card" style={{ maxWidth: 560 }}>
        <h3>Logó</h3>
        <p className="muted">
          Ha feltöltesz saját logót, az jelenik meg a fejlécben és a láblécben (a beépített
          rajzolt logó helyett). Ajánlott: átlátszó hátterű PNG vagy SVG, kb. 300&nbsp;px széles.
          Üresen hagyva a beépített „NOIR By Kriszta” logó látszik.
        </p>
        <ImageUploader
          label="Logó kép"
          value={branding.logoUrl}
          onChange={(url) => setBranding((b) => ({ ...b, logoUrl: url }))}
        />
      </div>

      <div className="admin-card" style={{ maxWidth: 560 }}>
        <h3>Főoldali hero kép</h3>
        <p className="muted">
          Ez a nagy, teljes képernyős kép a főoldal tetején. Fekvő tájolású, nagy felbontású
          kép ajánlott (min. 1600&nbsp;px széles).
        </p>
        <ImageUploader
          label="Hero kép"
          value={branding.heroImageUrl}
          onChange={(url) => setBranding((b) => ({ ...b, heroImageUrl: url }))}
        />
      </div>

      <div className="admin-card" style={{ maxWidth: 560 }}>
        <h3>Bemutatkozó szekció fotója</h3>
        <p className="muted">
          A főoldal „Bemutatkozás” szekciójában, a szöveg mellett megjelenő fotó (pl. Krisztáról).
          Álló tájolású, jó minőségű kép ajánlott (kb. 800&times;1000&nbsp;px).
        </p>
        <ImageUploader
          label="Bemutatkozó fotó"
          value={branding.aboutImageUrl}
          onChange={(url) => setBranding((b) => ({ ...b, aboutImageUrl: url }))}
        />
      </div>

      <button className="btn btn--primary btn--sm" onClick={save}>
        Kinézet mentése
      </button>
    </>
  );
}

/* -------------------------- KAPCSOLAT & ELÉRHETŐSÉG -------------------------- */
function ContactPanel() {
  const { data, error, reload } = useLoad(() => adminFetch("/content"), []);
  const [contact, setContact] = useState(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (data) setContact(data.contact || {});
  }, [data]);

  const save = async () => {
    await adminFetch("/admin/content/contact", { method: "PUT", body: { value: contact } });
    setSaved("Kapcsolati adatok mentve. Frissül a lábléc és a Kapcsolat oldal.");
    setTimeout(() => setSaved(""), 3500);
    reload();
  };

  if (!contact) return <div className="spinner" />;

  return (
    <>
      <h1>Kapcsolat &amp; elérhetőség</h1>
      <p className="muted">
        Ezek az adatok jelennek meg a lábléc­ben és a Kapcsolat oldalon (telefonszám,
        Instagram, Facebook, cím, térkép, nyitvatartási környék).
      </p>
      <Msg error={error} />
      {saved && <div className="form-note form-note--ok">{saved}</div>}

      <div className="admin-card" style={{ maxWidth: 620 }}>
        {[
          ["businessName", "Név / cégnév"],
          ["phone", "Telefonszám (pl. +36 30 123 4567)"],
          ["email", "Email cím"],
          ["instagram", "Instagram link (teljes URL)"],
          ["facebook", "Facebook link (teljes URL)"],
          ["addressLine", "Cím — utca, házszám"],
          ["postalCode", "Irányítószám"],
          ["city", "Város"],
          ["googleBusinessUrl", "Google Cégprofil link"],
          ["googleMapsEmbed", "Google Térkép beágyazási URL (…&output=embed)"],
        ].map(([k, label]) => (
          <div className="admin-field" key={k}>
            <label>{label}</label>
            <input
              value={contact[k] || ""}
              onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))}
            />
          </div>
        ))}
        <div className="admin-field">
          <label>Környék / SEO szöveg (a lábléc alján és a Kapcsolat oldalon)</label>
          <textarea
            rows={3}
            value={contact.areasText || ""}
            onChange={(e) => setContact((c) => ({ ...c, areasText: e.target.value }))}
          />
        </div>
        <button className="btn btn--primary btn--sm" onClick={save}>
          Kapcsolati adatok mentése
        </button>
      </div>
    </>
  );
}

/* -------------------------- BEMUTATKOZÓ SZÖVEG -------------------------- */
function ContentPanel() {
  const { data, error, reload } = useLoad(() => adminFetch("/content"), []);
  const [about, setAbout] = useState(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (data) setAbout(data.about || { heading: "", paragraph: "", badges: [{}, {}, {}] });
  }, [data]);

  const save = async () => {
    await adminFetch("/admin/content/about", { method: "PUT", body: { value: about } });
    setSaved("Bemutatkozó szöveg mentve.");
    setTimeout(() => setSaved(""), 3000);
    reload();
  };

  if (!about) return <div className="spinner" />;

  return (
    <>
      <h1>Bemutatkozó szöveg (főoldal)</h1>
      <Msg error={error} />
      {saved && <div className="form-note form-note--ok">{saved}</div>}

      <div className="admin-card" style={{ maxWidth: 620 }}>
        <div className="admin-field">
          <label>Címsor</label>
          <input value={about.heading || ""} onChange={(e) => setAbout((a) => ({ ...a, heading: e.target.value }))} />
        </div>
        <div className="admin-field">
          <label>Bekezdés</label>
          <textarea rows={5} value={about.paragraph || ""} onChange={(e) => setAbout((a) => ({ ...a, paragraph: e.target.value }))} />
        </div>
        {(about.badges || [{}, {}, {}]).map((b, i) => (
          <div className="admin-row" key={i}>
            <div className="admin-field" style={{ flex: 1 }}>
              <label>Bizalom-jelző {i + 1} — cím</label>
              <input
                value={b.title || ""}
                onChange={(e) =>
                  setAbout((a) => ({ ...a, badges: (a.badges || [{}, {}, {}]).map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)) }))
                }
              />
            </div>
            <div className="admin-field" style={{ flex: 1 }}>
              <label>Szöveg</label>
              <input
                value={b.text || ""}
                onChange={(e) =>
                  setAbout((a) => ({ ...a, badges: (a.badges || [{}, {}, {}]).map((x, xi) => (xi === i ? { ...x, text: e.target.value } : x)) }))
                }
              />
            </div>
          </div>
        ))}
        <button className="btn btn--primary btn--sm" onClick={save}>
          Bemutatkozás mentése
        </button>
      </div>
    </>
  );
}

/* -------------------------- ÜZENETEK -------------------------- */
function MessagesPanel() {
  const { data, error } = useLoad(() => adminFetch("/admin/messages"), []);
  return (
    <>
      <h1>Kapcsolatfelvételi üzenetek</h1>
      <Msg error={error} />
      <table className="admin-table">
        <thead>
          <tr>
            <th>Dátum</th>
            <th>Név</th>
            <th>Email</th>
            <th>Üzenet</th>
          </tr>
        </thead>
        <tbody>
          {(data?.messages || []).map((m) => (
            <tr key={m.id}>
              <td>{dateTime(m.createdAt)}</td>
              <td>{m.name}</td>
              <td>{m.email}</td>
              <td>{m.message}</td>
            </tr>
          ))}
          {data?.messages?.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                Még nincs üzenet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
