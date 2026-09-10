import Link from "next/link";
import Logo from "./Logo";
import { IconInstagram, IconFacebook } from "./Icons";
import { WEEKDAYS } from "@/lib/format";

export default function Footer({ contact = {}, hours = [] }) {
  const year = new Date().getFullYear();
  const sortedHours = [1, 2, 3, 4, 5, 6, 0]
    .map((wd) => hours.find((h) => h.weekday === wd))
    .filter(Boolean);

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo size={38} />
          <p className="footer__row mt-2" style={{ marginTop: "1rem", maxWidth: "34ch" }}>
            Prémium szempilla építés és szemöldök-formázás Pécelen és Budapest agglomerációjában.
          </p>
          <div className="footer__social">
            {contact.instagram && (
              <a href={contact.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <IconInstagram width={18} height={18} />
              </a>
            )}
            {contact.facebook && (
              <a href={contact.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <IconFacebook width={18} height={18} />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4>Elérhetőség</h4>
          <p className="footer__row">
            {contact.addressLine || "Kossuth Lajos utca 12."}
            <br />
            {(contact.postalCode || "2119") + " " + (contact.city || "Pécel")}
          </p>
          {contact.phone && (
            <p className="footer__row">
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
            </p>
          )}
          {contact.email && (
            <p className="footer__row">
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
          )}
          {contact.googleBusinessUrl && (
            <p className="footer__row">
              <a href={contact.googleBusinessUrl} target="_blank" rel="noopener noreferrer">
                Google Cégprofil
              </a>
            </p>
          )}
        </div>

        <div>
          <h4>Nyitvatartás</h4>
          {sortedHours.length === 0 && <p className="footer__row">H–P: 9:00–18:00</p>}
          {sortedHours.map((h) => (
            <p className="footer__row" key={h.weekday}>
              {WEEKDAYS[h.weekday]}: {h.isClosed ? "Zárva" : `${h.openTime}–${h.closeTime}`}
            </p>
          ))}
        </div>

        <div>
          <h4>Oldalak</h4>
          <p className="footer__row"><Link href="/szolgaltatasok">Szolgáltatások &amp; árak</Link></p>
          <p className="footer__row"><Link href="/galeria">Galéria</Link></p>
          <p className="footer__row"><Link href="/kapcsolat">Kapcsolat</Link></p>
          <p className="footer__row"><Link href="/foglalas">Időpontfoglalás</Link></p>
          {contact.googleMapsEmbed && (
            <div className="footer__map mt-2" style={{ marginTop: "1rem" }}>
              <iframe
                src={contact.googleMapsEmbed}
                title="Térkép — Noir by Kriszta, Pécel"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>

        <p className="footer__seo">
          {contact.areasText ||
            "Szempilla építés és szemöldök lamináció Pécelen és Budapesten. Vendégeim érkeznek Isaszegről, Gödöllőről, Maglódról és Budapest XVI–XVII. kerületéből is."}
        </p>

        <div className="footer__legal">
          <span>© {year} Noir by Kriszta. Minden jog fenntartva.</span>
          <span>
            <Link href="/adatkezeles">Adatkezelési tájékoztató</Link> ·{" "}
            <Link href="/impresszum">Impresszum</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
