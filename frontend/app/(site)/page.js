import Link from "next/link";
import Reveal from "@/components/Reveal";
import Carousel from "@/components/Carousel";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import {
  IconShield,
  IconSparkle,
  IconMedal,
  IconStar,
  IconCalendar,
  IconChat,
} from "@/components/Icons";
import { serverGet } from "@/lib/api";
import { fromPrice } from "@/lib/format";

// Mindig szerver-oldali renderelés friss adatokkal (nincs statikus cache).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Szempilla Építés és Szemöldök Lamináció Pécelen",
  description:
    "Ébressz fel minden reggel egy magabiztosabb tekintetet. Prémium szempilla építés, töltés és szemöldök lamináció Pécelen és Budapesten — természetes, tartós eredmény.",
};

// Alap hero-kép (lást szempilla közeli). Adminból felülírható: Képek panel →
// típus "Hero". A GalleryImage.type === "hero" rekord url-je élvez elsőbbséget.
const HERO_IMG_FALLBACK =
  "https://images.unsplash.com/photo-1683719312734-e31de63957ab?auto=format&fit=crop&w=2000&q=80";
const ABOUT_IMG =
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=800&q=80";

const CATEGORY_FALLBACK_IMG = {
  "Szempilla építés":
    "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=80",
  "Szempilla töltés":
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  Szemöldök:
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80",
};

export default async function HomePage() {
  const [servicesData, galleryData, testimonialsData, content] = await Promise.all([
    serverGet("/services", { grouped: [] }),
    serverGet("/gallery", { images: [] }),
    serverGet("/testimonials", { testimonials: [] }),
    serverGet("/content", {}),
  ]);

  const grouped = servicesData?.grouped || [];
  const allImages = galleryData?.images || [];
  const carouselImages = allImages
    .filter((i) => i.type === "carousel" || i.type === "gallery")
    .slice(0, 8);
  const beforeAfter = allImages.filter((i) => i.type === "before-after").slice(0, 4);
  const heroImg = allImages.find((i) => i.type === "hero")?.url || HERO_IMG_FALLBACK;
  const testimonials = testimonialsData?.testimonials || [];
  const about = content?.about || {};

  // Kategóriánként: induló ár, rövid leírás, reprezentatív kép, előtöltendő szolgáltatás
  const serviceCards = grouped.map((g) => {
    const min = Math.min(...g.items.map((i) => i.price));
    const withImage = g.items.find((i) => i.imageUrl);
    return {
      category: g.category,
      fromPrice: min,
      desc: g.items[0]?.description || "",
      image: withImage?.imageUrl || CATEGORY_FALLBACK_IMG[g.category] || CATEGORY_FALLBACK_IMG.default,
      bookServiceId: (withImage || g.items[0])?.id,
    };
  });

  return (
    <>
      {/* 1. HERO — teljes képernyős kép, rajta középre igazított szöveg */}
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero__bg"
          src={heroImg}
          alt="Prémium szempilla építés közelről – Noir by Kriszta, Pécel"
          fetchPriority="high"
        />
        <div className="hero__overlay" />
        <div className="container hero__content">
          <Reveal>
            <p className="hero__kicker">Noir by Kriszta · Lash Stylist · Pécel</p>
            <h1 className="hero__title">Ébressz fel minden reggel egy magabiztosabb tekintetet</h1>
            <p className="hero__lead">
              Prémium szempilla építés és szemöldök-formázás Pécelen, sminc nélkül is ragyogó,
              természetes eredménnyel.
            </p>
            <div className="hero__cta">
              <Link href="/foglalas" className="btn btn--primary">
                Időpontfoglalás
              </Link>
              <Link href="/szolgaltatasok" className="btn btn--outline">
                Árlista megtekintése
              </Link>
            </div>
          </Reveal>
        </div>
        <span className="hero__scroll" aria-hidden="true">
          <span />
        </span>
      </section>

      {/* 2. PROBLÉMA */}
      <section className="section section--cream">
        <div className="container">
          <Reveal className="section-head">
            <span className="ornament" />
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", lineHeight: 1.7 }}>
              Ismerős érzés, hogy reggelente időt vesztegetsz a sminkeléssel, mégsem érzed magad
              igazán önmagadnak? Vagy csalódtál már olyan szalonban, ahol az anyagok minősége vagy a
              higiénia hagyott kívánnivalót maga után? Megérdemled, hogy a tükörbe nézve — smink
              nélkül is — magabiztosan lásd magad.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 3. BEMUTATKOZÁS + bizalom-jelzők */}
      <section className="section section--dark">
        <div className="container">
          <div className="about">
            <Reveal className="about__photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ABOUT_IMG} alt="Kriszta, a Noir by Kriszta alapítója, munka közben" loading="lazy" />
            </Reveal>
            <Reveal>
              <p className="eyebrow">A segítőd a szépségben</p>
              <h2>{about.heading || "Kriszta vagyok, a Noir by Kriszta alapítója"}</h2>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem" }}>
                {about.paragraph ||
                  "Éveken át dolgoztam azon, hogy a szempilla építés és szemöldök-formázás ne csak szépészeti, hanem valódi önbizalom-növelő élmény legyen minden vendégem számára. Kizárólag prémium, allergiatesztelt anyagokkal és szigorú higiéniai előírások betartásával dolgozom — hogy Te csak a végeredményre koncentrálhass."}
              </p>
              <div className="trust">
                {(about.badges || [
                  { title: "Higiénikus, egyszer használatos eszközök", text: "Minden eszköz sterilizált vagy eldobható." },
                  { title: "Prémium minőségű anyagok", text: "Allergiatesztelt ragasztók és selyempillák." },
                  { title: "6+ év a szakmában", text: "Több ezer elégedett vendég." },
                ]).map((b, i) => {
                  const Icon = [IconShield, IconSparkle, IconMedal][i] || IconSparkle;
                  return (
                    <div className="trust__item" key={i}>
                      <Icon className="trust__icon" />
                      <strong>{b.title}</strong>
                      <span>{b.text}</span>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. SZOLGÁLTATÁS KÁRTYÁK */}
      <section className="section section--cream">
        <div className="container">
          <Reveal className="section-head">
            <span className="ornament" />
            <p className="eyebrow">Szolgáltatások</p>
            <h2>Amiben segíthetek</h2>
            <p>Minden kezelés személyre szabott konzultációval kezdődik.</p>
          </Reveal>
          <div className="card-grid card-grid--3">
            {serviceCards.map((s) => (
              <Reveal className="service-card" key={s.category}>
                <div className="service-card__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image}
                    alt={`${s.category} – Noir by Kriszta, Pécel`}
                    loading="lazy"
                  />
                </div>
                <div className="service-card__body">
                  <h3>{s.category}</h3>
                  <p className="card__price">{fromPrice(s.fromPrice)}</p>
                  <p className="card__desc">{s.desc}</p>
                  <Link
                    href={s.bookServiceId ? `/foglalas?service=${s.bookServiceId}` : "/foglalas"}
                    className="btn btn--book btn--block"
                  >
                    Időpontfoglalás
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. GALÉRIA CAROUSEL */}
      {carouselImages.length > 0 && (
        <section className="section section--darker">
          <div className="container">
            <Reveal className="section-head">
              <span className="ornament" />
              <p className="eyebrow">Munkáim</p>
              <h2>Ízelítő a galériából</h2>
            </Reveal>
            <Reveal>
              <Carousel images={carouselImages} />
            </Reveal>
            <div className="text-center mt-2">
              <Link href="/galeria" className="btn btn--outline">
                Teljes galéria megtekintése
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 6. ELŐTTE–UTÁNA */}
      {beforeAfter.length > 0 && (
        <section className="section section--cream">
          <div className="container">
            <Reveal className="section-head">
              <span className="ornament" />
              <p className="eyebrow">Előtte – Utána</p>
              <h2>A különbség, amit magadon is látni fogsz</h2>
            </Reveal>
            <div className="ba-range">
              {beforeAfter.map((b) => (
                <Reveal key={b.id}>
                  <BeforeAfterSlider before={b.url} after={b.urlAfter || b.url} caption={b.caption} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. A TERV — 3 lépés */}
      <section className="section section--dark">
        <div className="container">
          <Reveal className="section-head">
            <span className="ornament" />
            <p className="eyebrow">A terv</p>
            <h2>Három egyszerű lépés</h2>
          </Reveal>
          <div className="card-grid card-grid--3">
            {[
              { Icon: IconCalendar, t: "1. Foglalj időpontot online", d: "Pár kattintással, bármikor." },
              { Icon: IconChat, t: "2. Konzultálunk", d: "Hogy a Neked leginkább illő stílust válasszuk ki." },
              { Icon: IconSparkle, t: "3. Élvezd az eredményt", d: "Természetes, tartós hatás — nulla utómunkával a reggeleidben." },
            ].map((s) => (
              <Reveal className="card" key={s.t}>
                <s.Icon className="card__icon" />
                <h3>{s.t}</h3>
                <p className="card__desc">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. VÉLEMÉNYEK */}
      {testimonials.length > 0 && (
        <section className="section section--darker">
          <div className="container">
            <Reveal className="section-head">
              <span className="ornament" />
              <p className="eyebrow">Vendégvélemények</p>
              <h2>Amit a vendégeim mondanak</h2>
            </Reveal>
            <div className="card-grid card-grid--3">
              {testimonials.map((t) => (
                <Reveal className="quote" key={t.id}>
                  <div className="quote__stars" aria-label={`${t.rating} csillag`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <IconStar key={i} width={15} height={15} style={{ display: "inline" }} />
                    ))}
                  </div>
                  <p className="quote__text">„{t.text}”</p>
                  <p className="quote__author">{t.author}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. CTA SÁV */}
      <section className="cta-band">
        <div className="container">
          <Reveal>
            <h2>Foglald le a következő időpontodat még ma</h2>
            <p style={{ maxWidth: "48ch", margin: "0 auto 1.8rem" }}>
              Magabiztos tekintet minden nap, smink nélkül is. Ez a Noir by Kriszta ígérete.
            </p>
            <Link href="/foglalas" className="btn btn--primary">
              Foglald le az időpontodat
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
