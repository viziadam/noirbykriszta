// Márkalogó. Ha az admin feltöltött saját logót (branding.logoUrl), azt jeleníti
// meg; egyébként a beépített line-art szem + szemöldök illusztráció + a "NOIR By
// Kriszta" felirat.
export default function Logo({ size = 44, withText = true, logoUrl = "" }) {
  if (logoUrl) {
    return (
      <span className="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="NOIR By Kriszta — Lash Stylist"
          className="logo__img"
          style={{ height: size + 6 }}
        />
      </span>
    );
  }

  return (
    <span className="logo" aria-label="NOIR By Kriszta — Lash Stylist">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        style={{ color: "var(--gold-light)" }}
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="30" strokeWidth="1" opacity="0.6" />
        {/* szemöldök */}
        <path d="M14 24c6-5 20-6 30-1" />
        {/* felső + alsó szemhéj */}
        <path d="M15 36c6 8 28 8 34 0" />
        <path d="M15 36c6-6 28-6 34 0" />
        {/* írisz */}
        <circle cx="32" cy="36" r="4.5" />
        {/* pillák */}
        <path d="M18 33l-3-4M25 31l-1.5-4.5M32 30.5V26M39 31l1.5-4.5M46 33l3-4" />
      </svg>
      {withText && (
        <span className="logo__text">
          <span className="logo__name">NOIR By Kriszta</span>
          <span className="logo__sub">Lash Stylist</span>
        </span>
      )}
    </span>
  );
}
