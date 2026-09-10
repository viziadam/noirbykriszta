import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { IconPhone, IconMail, IconPin, IconInstagram, IconFacebook } from "@/components/Icons";
import { serverGet } from "@/lib/api";
import { WEEKDAYS } from "@/lib/format";

// Mindig szerver-oldali renderelés friss adatokkal (nincs statikus cache).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kapcsolat — Pécel",
  description:
    "Noir by Kriszta elérhetőségei: cím Pécelen, telefonszám, email, nyitvatartás és térkép. Kiszolgált környék: Pécel, Isaszeg, Gödöllő, Maglód, Budapest XVI–XVII. kerület.",
};

export default async function ContactPage() {
  const [content, hoursData] = await Promise.all([
    serverGet("/content", {}),
    serverGet("/business-hours", { hours: [] }),
  ]);
  const c = content?.contact || {};
  const hours = hoursData?.hours || [];
  const todayWeekday = new Date().getDay();
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((wd) => hours.find((h) => h.weekday === wd)).filter(Boolean);

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <p className="eyebrow">Kapcsolat</p>
          <h1>Találkozzunk Pécelen</h1>
          <p>{c.areasText || "Szempilla építés és szemöldök lamináció Pécelen és Budapesten."}</p>
        </div>
      </header>

      <section className="section section--cream">
        <div className="container contact-grid">
          <Reveal>
            <div className="map-embed">
              {c.googleMapsEmbed ? (
                <iframe
                  src={c.googleMapsEmbed}
                  title="Noir by Kriszta térkép – Pécel"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div style={{ display: "grid", placeItems: "center", height: "100%" }} className="muted">
                  Térkép hamarosan
                </div>
              )}
            </div>

            <ul className="stack" style={{ listStyle: "none", padding: 0 }}>
              <li className="admin-row">
                <IconPin style={{ color: "var(--gold)" }} />
                <span>
                  {(c.postalCode || "2119") + " " + (c.city || "Pécel") + ", "}
                  {c.addressLine || "Kossuth Lajos utca 12."}
                </span>
              </li>
              {c.phone && (
                <li className="admin-row">
                  <IconPhone style={{ color: "var(--gold)" }} />
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>
                </li>
              )}
              {c.email && (
                <li className="admin-row">
                  <IconMail style={{ color: "var(--gold)" }} />
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </li>
              )}
              <li className="admin-row" style={{ gap: "1rem" }}>
                {c.instagram && (
                  <a href={c.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <IconInstagram style={{ color: "var(--gold)" }} />
                  </a>
                )}
                {c.facebook && (
                  <a href={c.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <IconFacebook style={{ color: "var(--gold)" }} />
                  </a>
                )}
              </li>
            </ul>

            <h3 style={{ marginTop: "2rem" }}>Nyitvatartás</h3>
            <table className="hours-table">
              <tbody>
                {ordered.length === 0 && (
                  <tr>
                    <td>Hétfő–Péntek</td>
                    <td>9:00–18:00</td>
                  </tr>
                )}
                {ordered.map((h) => (
                  <tr key={h.weekday} className={h.weekday === todayWeekday ? "is-today" : ""}>
                    <td>{WEEKDAYS[h.weekday]}</td>
                    <td>{h.isClosed ? "Zárva" : `${h.openTime}–${h.closeTime}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>

          <Reveal>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <section className="section section--cream-2">
        <div className="container" style={{ maxWidth: 760 }}>
          <h2>Merről érkeznek a vendégeim?</h2>
          <p className="muted">
            A szalon Pécel központjában található, kényelmes parkolással. Rendszeresen fogadok
            vendégeket <strong>Isaszegről, Gödöllőről, Maglódról, Kerepesről</strong>, valamint
            Budapest <strong>XVI. és XVII. kerületéből</strong> — a fővárosból is könnyen
            megközelíthető HÉV-vel és autóval egyaránt. Ha szempilla építést vagy szemöldök
            laminációt keresel Pécel környékén, szeretettel várlak.
          </p>
        </div>
      </section>
    </>
  );
}
