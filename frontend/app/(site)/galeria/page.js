import GalleryClient from "@/components/GalleryClient";
import { serverGet } from "@/lib/api";

// Mindig szerver-oldali renderelés friss adatokkal (nincs statikus cache).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Galéria — Szempilla és Szemöldök Munkák",
  description:
    "Válogatás korábbi szempilla építés és szemöldök lamináció munkáimból Pécelen. Szűrhető galéria és előtte–utána összehasonlítások.",
};

export default async function GalleryPage() {
  const data = await serverGet("/gallery", { images: [] });
  // A "hero" típusú képek csak a főoldali fejlécen jelennek meg, a rácsban nem.
  const images = (data?.images || []).filter((i) => i.type !== "hero");

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <p className="eyebrow">Galéria</p>
          <h1>Korábbi munkáim</h1>
          <p>
            Minden vendég más — böngéssz a stílusok között, és a foglalásnál nyugodtan hivatkozz
            arra, amelyik megtetszett.
          </p>
        </div>
      </header>

      <section className="section section--cream">
        <div className="container">
          <GalleryClient images={images} />
        </div>
      </section>
    </>
  );
}
