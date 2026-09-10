export const metadata = {
  title: "Impresszum",
  robots: { index: false, follow: true },
};

export default function ImprintPage() {
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <p className="eyebrow">Jogi</p>
          <h1>Impresszum</h1>
        </div>
      </header>
      <section className="section section--cream">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="stack" style={{ fontFamily: "var(--font-serif)", fontSize: "1.08rem" }}>
            <p className="muted">Kitöltendő a valós vállalkozási adatokkal.</p>
            <p>
              <strong>Szolgáltató:</strong> Noir by Kriszta (egyéni vállalkozó)
              <br />
              <strong>Székhely:</strong> 2119 Pécel, Kossuth Lajos utca 12.
              <br />
              <strong>Nyilvántartási szám:</strong> —
              <br />
              <strong>Adószám:</strong> —
              <br />
              <strong>E-mail:</strong> kriszta@noirbykriszta.hu
              <br />
              <strong>Telefon:</strong> +36 30 123 4567
            </p>
            <p>
              <strong>Tárhelyszolgáltató:</strong> a hosting szolgáltató neve és elérhetősége itt
              adandó meg.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
