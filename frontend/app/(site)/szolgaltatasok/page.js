import Link from "next/link";
import Reveal from "@/components/Reveal";
import ServicesAccordion from "@/components/ServicesAccordion";
import { serverGet } from "@/lib/api";

// Mindig szerver-oldali renderelés friss adatokkal (nincs statikus cache).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Szolgáltatások és Árlista",
  description:
    "Szempilla építés (1D, 2D, 3D, hibrid, mega volume), szempilla töltés és szemöldök szolgáltatások — lamináció, festés, formázás — árakkal és időtartammal, Pécelen.",
};

export default async function ServicesPage() {
  const data = await serverGet("/services", { grouped: [] });
  const grouped = data?.grouped || [];

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <p className="eyebrow">Szolgáltatások</p>
          <h1>Árlista</h1>
          <p>
            Minden ár tájékoztató jellegű, induló ár. A pontos árat és időtartamot a konzultáció
            során, a kívánt hatás és a natúr pillák állapota alapján egyeztetjük.
          </p>
        </div>
      </header>

      <section className="section section--cream">
        <div className="container" style={{ maxWidth: 820 }}>
          {grouped.length === 0 ? (
            <p className="muted text-center">
              Az árlista jelenleg frissítés alatt áll. Kérlek, vedd fel velem a kapcsolatot a
              részletekért.
            </p>
          ) : (
            <Reveal>
              <ServicesAccordion grouped={grouped} />
            </Reveal>
          )}

          <div className="admin-card" style={{ marginTop: "2.5rem", background: "#fff" }}>
            <h3>Töltésről</h3>
            <p className="muted">
              A szempilla építés tartósságához 2–4 hetente ajánlott töltés. A töltés árát az
              eltelt idő és a pótolandó szálak mennyisége határozza meg. 4 hét fölött új
              építésként számoljuk.
            </p>
          </div>

          <div className="text-center mt-2">
            <Link href="/foglalas" className="btn btn--primary">
              Időpontfoglalás
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
