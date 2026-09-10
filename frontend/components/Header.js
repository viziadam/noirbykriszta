"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Főoldal" },
  { href: "/szolgaltatasok", label: "Szolgáltatások" },
  { href: "/galeria", label: "Galéria" },
  { href: "/kapcsolat", label: "Kapcsolat" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // A főoldalon átlátszó a header a hero fölött, máshol tömör.
  const transparentBase = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  const headerClass = !transparentBase
    ? "header header--solid"
    : scrolled
    ? "header header--scrolled"
    : "header header--top";

  return (
    <header className={headerClass}>
      <div className="container header__inner">
        <Link href="/" aria-label="Noir by Kriszta főoldal">
          <Logo size={40} />
        </Link>

        <button
          className={`nav__toggle ${open ? "is-open" : ""}`}
          aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${open ? "is-open" : ""}`}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav__link"
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/foglalas" className="btn btn--primary btn--sm nav__cta">
            Időpontfoglalás
          </Link>
        </nav>
      </div>
    </header>
  );
}
