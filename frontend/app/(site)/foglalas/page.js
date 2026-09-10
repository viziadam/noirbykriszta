import BookingWizard from "@/components/BookingWizard";
import { serverGet } from "@/lib/api";

// Mindig szerver-oldali renderelés friss adatokkal (nincs statikus cache).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Időpontfoglalás",
  description:
    "Foglalj online időpontot szempilla építésre, töltésre vagy szemöldök kezelésre Pécelen — válaszd ki a szolgáltatást, a szabad időpontot, és add meg az adataidat.",
  robots: { index: true, follow: true },
};

export default async function BookingPage({ searchParams }) {
  const data = await serverGet("/services", { grouped: [] });
  const grouped = data?.grouped || [];

  // ?szolgaltatas= / ?service=  → konkrét szolgáltatás előválasztva (Szolgáltatások oldalról)
  // ?kategoria= / ?category=    → csak a kategória előválasztva, szolgáltatás NÉLKÜL (Főoldalról)
  const initialServiceId = searchParams?.szolgaltatas || searchParams?.service || null;
  const initialCategory = searchParams?.kategoria || searchParams?.category || null;

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <p className="eyebrow">Foglalás</p>
          <h1>Foglalj időpontot</h1>
          <p>Négy lépés, pár perc. A szabad időpontokat valós időben mutatjuk.</p>
        </div>
      </header>

      <section className="section section--cream">
        <div className="container">
          {grouped.length === 0 ? (
            <p className="muted text-center">
              Az online foglalás jelenleg nem elérhető. Kérlek, keress a Kapcsolat oldalon található
              elérhetőségeken.
            </p>
          ) : (
            <BookingWizard
              grouped={grouped}
              initialServiceId={initialServiceId}
              initialCategory={initialCategory}
            />
          )}
        </div>
      </section>
    </>
  );
}
