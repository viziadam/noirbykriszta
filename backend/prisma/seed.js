import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

/*
 * Idempotens seed.
 *
 * Alapból CSAK a hiányzó adatokat tölti fel — ezért nyugodtan lefuthat minden
 * konténer-indításnál (redeploy) anélkül, hogy felülírná az admin által
 * szerkesztett szolgáltatásokat, képeket, szövegeket vagy foglalásokat.
 *
 * Teljes újraseedhez (FIGYELEM: töröl!):  SEED_FORCE=true node prisma/seed.js
 */
const FORCE = process.env.SEED_FORCE === "true" || process.argv.includes("--force");

const U = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

async function main() {
  console.log(FORCE ? "⚠  SEED_FORCE — meglévő adatok felülírása\n" : "Seed (idempotens)\n");

  /* --------------------------------- Admin --------------------------------- */
  const email = (process.env.ADMIN_EMAIL || "admin@noirbykriszta.hu").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "noir-admin-2026";
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (!existingAdmin || FORCE) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.admin.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    console.log(`✓ Admin létrehozva/frissítve: ${email}`);
  } else {
    console.log(`• Admin már létezik: ${email} (változatlan)`);
  }

  /* ----------------------------- Szolgáltatások ---------------------------- */
  const services = [
    { category: "Szempilla építés", name: "1D — Klasszikus", description: "Természetes, mindennapi hatás: egy műszál minden természetes pillához. Diszkrét sűrítés.", durationMinutes: 120, price: 12000, order: 1, imageUrl: U("1583001931096-959e9a1a6223", 800) },
    { category: "Szempilla építés", name: "2D — Light Volume", description: "Enyhén dúsított tekintet, könnyed pillafan­okkal. Népszerű választás első alkalomra.", durationMinutes: 135, price: 14000, order: 2 },
    { category: "Szempilla építés", name: "3D — Volume", description: "Teltebb, mégis pihekönnyű hatás, kézzel készített 3 szálas fanokkal.", durationMinutes: 150, price: 16000, order: 3 },
    { category: "Szempilla építés", name: "Hibrid", description: "A klasszikus és a volume technika keveréke — textúrás, testes, natúr végeredmény.", durationMinutes: 140, price: 15000, order: 4 },
    { category: "Szempilla építés", name: "Mega Volume", description: "Maximális dússág 5–8 szálas ultrakönnyű fanokkal, különleges alkalmakra.", durationMinutes: 165, price: 18000, order: 5 },
    { category: "Szempilla töltés", name: "Töltés — 2 hetes", description: "Frissítés a beépítést követő 2 héten belül. A telt hatás megőrzése.", durationMinutes: 60, price: 7000, order: 1, imageUrl: U("1560066984-138dadb4c035", 800) },
    { category: "Szempilla töltés", name: "Töltés — 3 hetes", description: "A leggyakoribb töltési intervallum, a kihullott szálak pótlása.", durationMinutes: 75, price: 8500, order: 2 },
    { category: "Szempilla töltés", name: "Töltés — 4 hetes", description: "Teljesebb újraépítés, ha 4 hét telt el az előző alkalom óta.", durationMinutes: 90, price: 10000, order: 3 },
    { category: "Szemöldök", name: "Szemöldökszedés — csipesz", description: "Precíz formázás csipesszel, az arcodhoz illő ívvel.", durationMinutes: 30, price: 3500, order: 1, imageUrl: U("1516975080664-ed2fc6a32937", 800) },
    { category: "Szemöldök", name: "Szemöldökszedés — szálazás (fonal)", description: "Fonalas technika a legtisztább vonalakért, érzékeny bőrre is.", durationMinutes: 30, price: 4000, order: 2 },
    { category: "Szemöldök", name: "Szemöldök lamináció", description: "Tartós, feltupírozott hatás 4–6 hétre — rendezett szemöldök smink nélkül.", durationMinutes: 60, price: 9000, order: 3 },
    { category: "Szemöldök", name: "Szemöldök festés", description: "Növényi vagy oxidációs festés a mélyebb, teltebb színért.", durationMinutes: 30, price: 4000, order: 4 },
    { category: "Szemöldök", name: "Lamináció + festés + formázás (csomag)", description: "Teljes szemöldök-átalakítás egy ülésben, kedvezményes csomagáron.", durationMinutes: 90, price: 13000, order: 5 },
  ];
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0 || FORCE) {
    for (const s of services) {
      await prisma.service.upsert({
        where: { category_name: { category: s.category, name: s.name } },
        update: FORCE ? s : {},
        create: s,
      });
    }
    console.log(`✓ ${services.length} szolgáltatás feltöltve`);
  } else {
    console.log(`• ${serviceCount} szolgáltatás már létezik (változatlan)`);
  }

  /* ------------------------------ Nyitvatartás ---------------------------- */
  const hours = [
    { weekday: 1, openTime: "09:00", closeTime: "18:00", isClosed: false },
    { weekday: 2, openTime: "09:00", closeTime: "18:00", isClosed: false },
    { weekday: 3, openTime: "09:00", closeTime: "20:00", isClosed: false },
    { weekday: 4, openTime: "09:00", closeTime: "18:00", isClosed: false },
    { weekday: 5, openTime: "09:00", closeTime: "16:00", isClosed: false },
    { weekday: 6, openTime: "10:00", closeTime: "14:00", isClosed: false },
    { weekday: 0, openTime: "00:00", closeTime: "00:00", isClosed: true },
  ];
  const hoursCount = await prisma.businessHours.count();
  if (hoursCount === 0 || FORCE) {
    for (const h of hours) {
      await prisma.businessHours.upsert({ where: { weekday: h.weekday }, update: h, create: h });
    }
    console.log(`✓ Nyitvatartás feltöltve`);
  } else {
    console.log(`• Nyitvatartás már be van állítva (változatlan)`);
  }

  /* -------------------------------- Galéria ------------------------------- */
  const gallery = [
    { url: U("1683719312734-e31de63957ab", 2000), category: "szempilla", type: "hero", caption: "Prémium szempilla építés közelről", order: 0 },
    { url: U("1583001931096-959e9a1a6223"), category: "szempilla", type: "carousel", caption: "3D Volume — teltebb, mégis pihekönnyű tekintet", order: 1 },
    { url: U("1522337360788-8b13dee7a37e"), category: "szempilla", type: "carousel", caption: "Hibrid technika — textúrás, természetes hatás", order: 2 },
    { url: U("1512257906104-c4fa32f13f88"), category: "szemoldok", type: "carousel", caption: "Szemöldök lamináció — rendezett ív smink nélkül", order: 3 },
    { url: U("1487412947147-5cebf100ffc2"), category: "szempilla", type: "gallery", caption: "Klasszikus 1D — diszkrét mindennapi sűrítés", order: 4 },
    { url: U("1560066984-138dadb4c035"), category: "szempilla", type: "gallery", caption: "Light Volume — könnyed pillafanok", order: 5 },
    { url: U("1516975080664-ed2fc6a32937"), category: "szemoldok", type: "gallery", caption: "Szemöldök festés + formázás", order: 6 },
    { url: U("1596704017254-9b121068fb31"), category: "szempilla", type: "gallery", caption: "Mega Volume — különleges alkalomra", order: 7 },
    { url: U("1503236823255-94609f598e71"), category: "szemoldok", type: "gallery", caption: "Fonalas szemöldökszedés — tiszta vonalak", order: 8 },
    { url: U("1607779097040-26e80aa78e66"), urlAfter: U("1583241800698-9c2e6a0a1f5a"), category: "elotte-utana", type: "before-after", caption: "A vendég természetes, hétköznapi hatást szeretett volna — hibrid technikával készült.", order: 1 },
    { url: U("1594744803329-e58b31de8bf5"), urlAfter: U("1571875257727-256c39da42af"), category: "elotte-utana", type: "before-after", caption: "Ritkás natúr pillák dúsítása 3D volume fanokkal.", order: 2 },
    { url: U("1512496015851-a90fb38ba796"), urlAfter: U("1522337094846-8a818192de1f"), category: "elotte-utana", type: "before-after", caption: "Rendezetlen szemöldök átalakítása laminációval és festéssel.", order: 3 },
  ];
  const galleryCount = await prisma.galleryImage.count();
  if (galleryCount === 0 || FORCE) {
    if (FORCE) await prisma.galleryImage.deleteMany();
    for (const g of gallery) await prisma.galleryImage.create({ data: g });
    console.log(`✓ ${gallery.length} galéria elem feltöltve`);
  } else {
    console.log(`• ${galleryCount} galéria elem már létezik (változatlan)`);
  }

  /* ------------------------------- Vélemények ---------------------------- */
  const testimonials = [
    { author: "Anna, Pécel", text: "Végre reggelente nem kell sminkelnem. A pillák tökéletesen tartanak, és teljesen természetesek. Kriszta odafigyel minden apró részletre.", rating: 5, order: 1 },
    { author: "Dóra, Budapest XVII.", text: "A szalon higiéniája kifogástalan, és a lamináció óta imádom a szemöldököm. Már a harmadik alkalommal járok vissza.", rating: 5, order: 2 },
    { author: "Réka, Isaszeg", text: "Korábban csalódtam egy másik helyen, itt viszont profi konzultációt kaptam és pont olyan lett, amilyet elképzeltem.", rating: 5, order: 3 },
  ];
  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0 || FORCE) {
    if (FORCE) await prisma.testimonial.deleteMany();
    for (const t of testimonials) await prisma.testimonial.create({ data: t });
    console.log(`✓ ${testimonials.length} vélemény feltöltve`);
  } else {
    console.log(`• ${testimonialCount} vélemény már létezik (változatlan)`);
  }

  /* ----------------------------- Oldal-tartalom -------------------------- */
  const content = {
    about: {
      heading: "Kriszta vagyok, a Noir by Kriszta alapítója",
      paragraph:
        "Éveken át dolgoztam azon, hogy a szempilla építés és szemöldök-formázás ne csak szépészeti, hanem valódi önbizalom-növelő élmény legyen minden vendégem számára. Kizárólag prémium, allergiatesztelt anyagokkal és szigorú higiéniai előírások betartásával dolgozom — hogy Te csak a végeredményre koncentrálhass.",
      badges: [
        { title: "Higiénikus, egyszer használatos eszközök", text: "Minden eszköz sterilizált vagy eldobható." },
        { title: "Prémium minőségű anyagok", text: "Allergiatesztelt ragasztók és selyempillák." },
        { title: "6+ év a szakmában", text: "Folyamatos továbbképzés, több ezer elégedett vendég." },
      ],
    },
    contact: {
      businessName: "Noir by Kriszta — Lash Stylist",
      addressLine: "Kossuth Lajos utca 12.",
      city: "Pécel",
      postalCode: "2119",
      phone: "+36 30 123 4567",
      email: "kriszta@noirbykriszta.hu",
      instagram: "https://instagram.com/noirbykriszta",
      facebook: "https://facebook.com/noirbykriszta",
      googleMapsEmbed:
        "https://www.google.com/maps?q=P%C3%A9cel%2C%20Kossuth%20Lajos%20utca%2012&output=embed",
      googleBusinessUrl: "https://g.page/noirbykriszta",
      areasText:
        "Szempilla építés és szemöldök lamináció Pécelen és Budapesten. Vendégeim érkeznek Isaszegről, Gödöllőről, Maglódról, valamint Budapest XVI. és XVII. kerületéből is.",
    },
  };
  for (const [key, value] of Object.entries(content)) {
    const exists = await prisma.siteContent.findUnique({ where: { key } });
    if (!exists || FORCE) {
      await prisma.siteContent.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      });
      console.log(`✓ Tartalom feltöltve: ${key}`);
    } else {
      console.log(`• Tartalom már létezik: ${key} (változatlan)`);
    }
  }

  console.log("\nSeed kész.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
