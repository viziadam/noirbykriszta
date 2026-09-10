export const metadata = {
  title: "Adatkezelési tájékoztató",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <p className="eyebrow">Jogi</p>
          <h1>Adatkezelési tájékoztató</h1>
        </div>
      </header>
      <section className="section section--cream">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="stack" style={{ fontFamily: "var(--font-serif)", fontSize: "1.08rem" }}>
            <p className="muted">
              Ez egy sablon tájékoztató. Éles használat előtt egyeztesd adatvédelmi szakértővel, és
              töltsd ki a valós cégadatokkal.
            </p>

            <h2>1. Az adatkezelő</h2>
            <p>
              Noir by Kriszta (egyéni vállalkozó), székhely: 2119 Pécel, Kossuth Lajos utca 12.,
              e-mail: kriszta@noirbykriszta.hu. A továbbiakban: „Adatkezelő”.
            </p>

            <h2>2. Kezelt adatok és célok</h2>
            <p>
              <strong>Online időpontfoglalás:</strong> név, telefonszám, e-mail cím, a foglalt
              szolgáltatás és időpont, valamint az általad megadott megjegyzés. Cél: az időpont
              rögzítése, visszaigazolása és a kapcsolattartás. Jogalap: a szerződés teljesítése
              (GDPR 6. cikk (1) b)), illetve a hozzájárulásod (6. cikk (1) a)).
            </p>
            <p>
              <strong>Kapcsolatfelvételi űrlap:</strong> név, e-mail cím, üzenet. Cél: a
              megkeresésed megválaszolása. Jogalap: hozzájárulás.
            </p>
            <p>
              <strong>Sütik:</strong> a weboldal működéséhez szükséges sütik, valamint — a
              hozzájárulásod esetén — anonim látogatottság-mérési sütik.
            </p>

            <h2>3. Az adatok megőrzése</h2>
            <p>
              A foglalási adatokat a szolgáltatás nyújtását követő számviteli és jogi
              kötelezettségek teljesítéséig, egyéb esetben a hozzájárulás visszavonásáig, illetve
              legfeljebb 2 évig őrizzük.
            </p>

            <h2>4. Adatfeldolgozók</h2>
            <p>
              Tárhelyszolgáltató, e-mail küldő szolgáltató és térkép-beágyazás szolgáltatója. A
              pontos lista a szolgáltatók megnevezésével itt frissítendő.
            </p>

            <h2>5. Jogaid</h2>
            <p>
              Kérheted a rád vonatkozó adatokhoz való hozzáférést, azok helyesbítését, törlését,
              kezelésük korlátozását, tiltakozhatsz az adatkezelés ellen, és élhetsz az
              adathordozhatóság jogával. A hozzájárulás bármikor visszavonható. Panasszal a Nemzeti
              Adatvédelmi és Információszabadság Hatósághoz (NAIH, 1055 Budapest, Falk Miksa utca
              9-11.) fordulhatsz.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
