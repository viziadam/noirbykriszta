// Line-art szem + szemöldök illusztráció arany körvonalban — a spec 2.1 pontja.
export default function Logo({ size = 44, withText = true }) {
  return (
    <span className="logo" aria-label="Noir by Kriszta — Lash Stylist">
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
          <span className="logo__name">Noir by Kriszta</span>
          <span className="logo__sub">Lash Stylist</span>
        </span>
      )}
    </span>
  );
}
