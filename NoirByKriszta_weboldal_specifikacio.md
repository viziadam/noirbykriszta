# NoirByKriszta — Weboldal Fejlesztési Specifikáció

**Cél:** Ez a dokumentum a teljes design-, tartalom- és funkcióspecifikációt tartalmazza a Codex számára. A dokumentumban minden vizuális, szöveges és funkcionális döntés meg van hozva — a fejlesztő feladata a leírtak pontos technikai megvalósítása React + Node.js stackben.

---

## 1. Projekt összefoglaló

| | |
|---|---|
| **Márkanév** | Noir by Kriszta — Lash Stylist |
| **Tevékenység** | Szempilla építés (1D/2D/3D/hibrid), szempilla töltés, szemöldök szedés, szemöldök lamináció, szemöldök festés |
| **Helyszín** | Pécel, Budapest agglomeráció |
| **Célközönség** | 20–45 éves nők, akik igényes, prémium, higiénikus szolgáltatást keresnek a lakóhelyükhöz közel |
| **Fő cél** | Online időpontfoglalás növelése + prémium márkaimázs kiépítése |
| **Tech stack** | React (frontend), Node.js/Express (backend), PostgreSQL (adatbázis), JWT alapú admin auth |

---

## 2. Márka és vizuális identitás

### 2.1 A logó (adott)
Vékony vonalas ("line-art"), kézzel rajzolt stílusú szem- és szemöldök-illusztráció, arany körvonalban, kurzív script felirat ("Noir by Kriszta") és alatta letisztult, kis kapitális serif felirat ("Lash Stylist"). Ez a stílus (minimalista vonalrajz + arany + fekete + krém) a teljes weboldal vizuális nyelvének alapja.

### 2.2 Színpaletta

| Szerep | Szín | Hex |
|---|---|---|
| Elsődleges háttér (prémium sötét) | Sötét smaragdzöld | `#132A22` |
| Másodlagos sötét árnyalat | Mélyzöld (hero gradiens aljára) | `#0B1D17` |
| Kiegészítő/akcent szín | Antik arany (champagne gold) | `#C6A15B` |
| Világos arany hover/vonal | Halvány arany | `#E4C98A` |
| Háttér világos szekciókhoz | Törtfehér / krém | `#FAF6EF` |
| Szöveg sötét háttéren | Krémfehér | `#F5F1E8` |
| Szöveg világos háttéren | Antracit | `#1E1E1E` |
| Finom elválasztó/border | Halvány arany, 20% opacitás | `#C6A15B33` |

A sötétzöld+arany kombináció adja a "prémium, elegáns" hatást, a krém háttér biztosítja az olvashatóságot a szöveges/ár-szekciókban. Kerülni kell az élénk, hideg színeket (kék, neon) — minden kiegészítő szín meleg, tompított tónusú (bézs, halvány rosé opcionálisan a galéria kártyák háttereként).

### 2.3 Tipográfia

- **Script/akcent betűtípus** (logóhoz illő, csak kiemelésekhez, pl. Hero aláírás-szerű elem, idézetek): *Alex Brush* vagy *Parisienne* (Google Fonts)
- **Címsor betűtípus** (H1–H3, elegáns szerif): *Playfair Display*
- **Törzsszöveg**: *Cormorant Garamond* (nagyobb szövegblokkokhoz) vagy *Poppins Light/Regular* (jobb olvashatóság mobilon — ez legyen az elsődleges body font)
- Címsorokban ritkított (letter-spacing: 0.05–0.1em) kisbetűs vagy kiskapitális stílus ajánlott a luxus hatásért.

### 2.4 Vizuális stílus / hangulat
- Sok fehér/negatív tér, nagy, professzionális fotók (nem stock jellegű)
- Vékony arany vonaldíszek elválasztóként (a logó köríves motívumát visszaköszönve, pl. félkör vagy ív díszelemek szekciók között)
- Lekerekített, de nem túl "kerek" kártyák (border-radius: 4–8px), finom árnyékok
- Mikroanimációk: lágy fade-in scroll-ra, hover esetén finom arany alávonás/keret
- A két referenciaoldal (kristenmarieco.com, demimuseartistry.com) stílusából átvesszük: nagy hero-kép + rövid tagline, bőséges whitespace, before/after galéria hangsúlyos elhelyezése, elegáns szerif címsorok — de a színvilágot a kért sötétzöld+arany paletta váltja fel a náluk látott bézs/rózsaszín helyett.

---

## 3. Technológiai stack és architektúra

- **Frontend:** React 18+ (Next.js javasolt a szerver-oldali renderelés / SSG miatt — ez kritikus a SEO célok eléréséhez), React Router ha nem Next.js mellett döntünk
- **Backend:** Node.js + Express (REST API)
- **Adatbázis:** PostgreSQL (strukturált adat: szolgáltatások, árak, időpontok, foglalások) — Prisma ORM ajánlott
- **Képtárolás:** Felhő tárhely (pl. Cloudinary vagy S3-kompatibilis tárhely) a feltöltött admin képekhez, ne a szerver fájlrendszerén tárolódjon élesben
- **Admin autentikáció:** JWT token, egyetlen admin szerepkör (Kriszta), bcrypt jelszó-hasheléssel
- **Email értesítés:** Foglalás visszaigazoláshoz tranzakciós email szolgáltatás (pl. Resend / SendGrid API)
- **Naptár/foglalás logika:** Saját fejlesztésű időpont-slot rendszer (lásd 5.5. pont) — **nem** Notino API-t vagy kódot használunk, csak a UX-folyamatot vesszük mintaként, teljesen saját designnal és saját backend logikával, hogy jogi/márkavédelmi probléma ne merüljön fel.
- **Hosting javaslat:** Frontend Vercel/Netlify, backend + adatbázis Railway/Render, vagy egységes VPS

---

## 4. Oldaltérkép (Sitemap)

```
/                     → Főoldal
/szolgaltatasok        → Szolgáltatások + árlista
/galeria               → Galéria (forgó képek + előtte-utána + kategória szűrő)
/kapcsolat             → Kapcsolat + térkép + nyitvatartás
/foglalas               → Foglalási folyamat (önálló, több lépéses oldal/modal)
/admin/login           → Admin belépés
/admin/dashboard        → Admin felület (védett route)
```

---

## 5. Oldalankénti részletes terv

### 5.1 Főoldal (`/`)

**Sorrend fentről lefelé:**

1. **Header/Navigáció** (sticky, átlátszó → sötétzöld háttérré válik scrollra): logó balra, menüpontok (Főoldal, Szolgáltatások, Galéria, Kapcsolat), jobb szélen kiemelt arany „Időpontfoglalás” gomb.

2. **Hero szekció** — teljes képernyős, sötétzöld gradiens háttér, jobb/bal oldalon nagy portré vagy közeli szempilla-fotó, bal oldalon a szöveg (SB7 szövegezés, lásd 7. pont Hero blokkja). CTA gombok: „Időpontfoglalás” (elsődleges, arany) + „Árlista megtekintése” (másodlagos, körvonalas).

3. **Rövid bemutatkozás** — 1 bekezdés Krisztáról (guide-szerep az SB7-ben), profilkép mellette, alatta 3 kis „bizalom-jelző” ikon+szöveg (pl. „Higiénikus, egyszer használatos eszközök”, „Prémium minőségű anyagok”, „X éve a szakmában”).

4. **Szolgáltatások kártyák áras kivonattal** — 3–4 kártya (Szempilla építés, Szempilla töltés, Szemöldök lamináció, Szemöldök szedés/festés), mindegyiken induló ártól ("-tól" ár), rövid leírás, „Részletek” link a `/szolgaltatasok` oldalra.

5. **Galéria forgó (carousel)** — automatikusan lejátszódó, kézzel is léptethető kép-karusszel a legszebb munkákról, alatta „Teljes galéria megtekintése” gomb.

6. **Előtte–utána szekció** — csúszkás (slider) vagy egymás melletti kép-pár megjelenítés, 3–4 kiemelt eset, admin által feltölthető/cserélhető.

7. **Vendégvélemények (opcionális, de ajánlott)** — 3 rövid idézet kártyán, csillagos értékeléssel.

8. **CTA szekció foglalás előtt** — teljes szélességű, arany háttérrel kiemelt sáv: „Foglald le a következő időpontodat még ma” + gomb.

9. **Footer** — NAP adatok (Pécel cím, telefonszám, email), nyitvatartás, közösségi média ikonok (Instagram, Facebook), mini térkép-thumbnail, SEO szempontból fontos szöveges blokk („Szempilla építés és szemöldök lamináció Pécelen és Budapesten”), impresszum/adatvédelmi tájékoztató linkek.

### 5.2 Szolgáltatások oldal (`/szolgaltatasok`)

Kategóriánként rendezett, akkordeon vagy szekció-alapú árlista:

- **Szempilla építés**: 1D, 2D, 3D, Hibrid, Volumen — mindegyikhez rövid leírás + ár + időtartam
- **Szempilla töltés**: 2 hetes, 3 hetes, 4 hetes töltés kategóriák
- **Szemöldök**: Szemöldökszedés (pinzettával/fonallal), Szemöldök lamináció, Szemöldök festés, kombinált csomagok

Minden szolgáltatásnál: név, leírás (1-2 mondat), időtartam, ár, „Foglalás” mini gomb ami előtölti a foglalási folyamat 1. lépését az adott szolgáltatással. Az árak és kategóriák teljes egészében admin felületről szerkeszthetők (lásd 5.6).

### 5.3 Galéria oldal (`/galeria`)

- Szűrhető kép-rács (Minden / Szempilla / Szemöldök / Előtte-Utána kategóriák)
- Lightbox nagyítás kattintásra
- Előtte-utána képeknél csúszka (slider) komponens az összehasonlításhoz
- Minden képhez opcionálisan rövid szöveg fűzhető adminból (pl. „A vendég természetes, hétköznapi hatást szeretett volna — hibrid technikával készült.”)

### 5.4 Kapcsolat oldal (`/kapcsolat`)

- Beágyazott Google Térkép (Pécel-i pontos cím)
- Nyitvatartási táblázat
- Telefonszám (klikkelhető hívásra mobilon), email, Instagram/Facebook linkek
- Egyszerű kapcsolatfelvételi űrlap (Név, Email, Üzenet) — backend elküldi emailben Krisztának
- Rövid SEO szöveg a helyszínről és a kiszolgált környékbeli településekről (Pécel, Isaszeg, Gödöllő, Budapest XVI./XVII. kerület stb.)

### 5.5 Foglalási rendszer (`/foglalas`)

**Funkcionális folyamat (a Notino booking UX-flow-jához hasonló lépésrend, teljesen saját dizájnnal és kóddal):**

1. **Szolgáltatás kiválasztása** — kategória → konkrét szolgáltatás (pl. Szempilla építés → 2D volumen)
2. **Időpont kiválasztása** — naptár nézet, csak a szabad időslotok jelennek meg (a backend számolja ki a foglalt/szabad időpontokat a szolgáltatás időtartama alapján)
3. **Adatok megadása** — Név, telefonszám, email, megjegyzés (opcionális)
4. **Összegzés és megerősítés** — kiválasztott szolgáltatás, időpont, ár összefoglalása, majd „Foglalás véglegesítése” gomb
5. **Visszaigazítás** — sikeres foglalás után automatikus email mind a vendégnek, mind Krisztának

**Adatbázis modellek (Prisma séma-vázlat):**

```
Service {
  id, category, name, description, durationMinutes, price, isActive
}

Appointment {
  id, serviceId, customerName, phone, email, note,
  startTime, endTime, status (pending/confirmed/cancelled), createdAt
}

BusinessHours {
  id, weekday, openTime, closeTime, isClosed
}

GalleryImage {
  id, url, category, caption, order, type (gallery/before-after/hero)
}
```

**Admin oldali naptár:** Kriszta lássa lista/naptár nézetben az összes foglalást, tudjon időpontot lemondani, kézzel is tudjon foglalást rögzíteni (telefonos foglalás esetére), és tudja szerkeszteni a nyitvatartást / szüneteket (pl. szabadság beállítása, ami blokkolja az adott napokat a foglalási naptárban).

**Jogi megjegyzés:** A rendszer kizárólag a Notino foglalási *folyamat-logikáját* (kategória → időpont → adatok → megerősítés) követi mintaként, sem kódot, sem vizuális elemet, sem márkajelzést nem vesz át — teljesen egyedi, a fenti színpalettával és tipográfiával megvalósított felület, saját backenddel. Ez jogilag tiszta, mert egy UX-mintázat (ami maga is széles körben elterjedt, pl. Booksy, Vagaro, SimplyBook is hasonlót használ) nem áll szerzői jogi védelem alatt, csak a konkrét megvalósítás (kód, grafika, szöveg) védett.

### 5.6 Admin felület (`/admin/dashboard`)

Bejelentkezés után elérhető, védett felület, az alábbi modulokkal:

1. **Képkezelés (Főoldal & Galéria)**
   - Hero kép(ek) cseréje
   - Galéria: kép feltöltés, törlés, sorrend módosítása (drag & drop), kategória hozzárendelése, opcionális szöveg/leírás hozzáadása képhez
   - Előtte-utána képpárok kezelése (kép A / kép B feltöltés párban)

2. **Szolgáltatások és árak kezelése**
   - Kategóriák létrehozása/szerkesztése (pl. „Szempilla építés”, „Töltés”, „Szemöldök”)
   - Az egyes szolgáltatások (pl. 1D, 2D, 3D, Hibrid) hozzáadása/szerkesztése/törlése kategórián belül, mindegyikhez: név, leírás, ár, időtartam, aktív/inaktív státusz

3. **Foglalások kezelése**
   - Naptár/lista nézet az összes érkező foglalásról
   - Foglalás státusz módosítása (megerősít/lemond)
   - Kézi foglalás rögzítése
   - Nyitvatartás és szabadnapok/szünetek beállítása

4. **Tartalomkezelés**
   - Főoldali bemutatkozó szöveg szerkesztése
   - Kapcsolat oldal adatainak (cím, telefonszám, nyitvatartás szöveg) szerkesztése

Az admin felület vizuálisan letisztult, funkcionális dashboard legyen (nem kell a márka luxus-designját követnie), oldalsáv navigációval a fenti 4 modul között.

---

## 6. SEO stratégia (Pécel, Budapest fókusszal)

### 6.1 Célkulcsszavak (elsődleges)
- szempilla építés Pécel
- szempilla építés Budapest
- szempillahosszabbítás Pécel
- szemöldök lamináció Pécel / Budapest
- szemöldök szedés Pécel
- szemöldökfestés Pécel
- lash stylist Pécel
- műszempilla szalon Pécel környéke

### 6.2 Technikai SEO követelmények
- Next.js SSR/SSG használata, hogy minden oldal indexelhető, gyorsan betöltődő HTML-t kapjon a Google
- Minden oldalhoz egyedi `<title>` és `meta description`, a fenti kulcsszavakkal (pl. Főoldal title: *„Noir by Kriszta – Szempilla Építés és Szemöldök Lamináció Pécelen”*)
- **Schema.org `LocalBusiness` / `BeautySalon` strukturált adat** a Kapcsolat és Főoldal alá: név, cím (Pécel), telefonszám, nyitvatartás, árkategória
- Minden képhez leíró `alt` szöveg (pl. `alt="Természetes hatású szempilla építés Pécelen – Noir by Kriszta"`)
- Sitemap.xml és robots.txt generálása
- Mobilbarát, Core Web Vitals-barát képoptimalizálás (next/image komponens vagy hasonló lazy-loading megoldás)
- Google Business Profile létrehozásának javasolt (ez nem a weboldal kódja, de a helyi SEO alapja) — a weboldalon linkelni kell rá

### 6.3 URL-struktúra
Magyar, ékezet nélküli, kulcsszó-barát URL-ek: `/szolgaltatasok`, `/galeria`, `/kapcsolat`, `/foglalas` — ez már a sitemapban is így szerepel.

---

## 7. Copywriting — SB7 (StoryBrand) keretrendszer alkalmazása a Főoldalon

A StoryBrand modell szerint a **vendég a hős**, Kriszta a **segítő (guide)**. Az alábbi szövegblokkok készen állnak a beillesztésre.

### 7.1 Hero szekció (Hős + probléma megszólítása)
> **Főcím:** Ébressz fel minden reggel egy magabiztosabb tekintetet
> **Alcím:** Prémium szempilla építés és szemöldök-formázás Pécelen, sminc nélkül is ragyogó, természetes eredménnyel.
> **CTA gombok:** „Időpontfoglalás” / „Árlista megtekintése”

### 7.2 Probléma szekció
> Ismerős érzés, hogy reggelente időt vesztegetsz a sminkeléssel, mégsem érzed magad igazán önmagadnak? Vagy csalódtál már olyan szalonban, ahol az anyagok minősége vagy a higiénia hagyott kívánnivalót maga után? Megérdemled, hogy a tükörbe nézve — smink nélkül is — magabiztosan lásd magad.

### 7.3 Guide szekció — empátia + tekintély (Kriszta bemutatása)
> Kriszta vagyok, a Noir by Kriszta alapítója. Éveken át dolgoztam azon, hogy a szempilla építés és szemöldök-formázás ne csak szépészeti, hanem valódi önbizalom-növelő élmény legyen minden vendégem számára. Kizárólag prémium, allergiatesztelt anyagokkal és szigorú higiéniai előírások betartásával dolgozom — hogy Te csak a végeredményre koncentrálhass.

### 7.4 A Terv (3 egyszerű lépés)
> **1. Foglalj időpontot online**, pár kattintással, bármikor.
> **2. Konzultálunk**, hogy a Neked leginkább illő stílust válasszuk ki.
> **3. Élvezd a természetes, tartós eredményt** — nulla utómunkával a reggeleidben.

### 7.5 Cselekvésre ösztönzés (CTA)
> **Elsődleges CTA:** „Foglald le az időpontodat még ma”
> **Átmeneti CTA:** „Nézd meg korábbi munkáimat a galériában”

### 7.6 Kudarc elkerülése (mitől óv meg minket választva)
> Nincs több bizonytalanság rossz minőségű anyagok vagy hosszú, kényelmetlen procedúrák miatt — nálam minden eszköz egyszer használatos vagy sterilizált, minden anyag minőségi és allergiatesztelt.

### 7.7 Siker (a vágyott végeredmény)
> Magabiztos tekintet minden nap, smink nélkül is. Ez a Noir by Kriszta ígérete.

*(A fenti szövegek a fejlesztés során 1:1 beilleszthetők a megfelelő komponensekbe; az admin felületről a bemutatkozó szöveg később szabadon szerkeszthető.)*

---

## 8. Jogi és adatvédelmi követelmények

- Cookie-elfogadó sáv (GDPR megfelelőség)
- Adatkezelési tájékoztató oldal/linkelt dokumentum (foglalási adatok kezeléséről is rendelkezzen)
- Foglalási űrlapon checkbox az adatkezelési tájékoztató elfogadásához
- Sehol nem szerepelhet Notino márkanév, logó vagy vizuális elem — kizárólag a folyamat-logika szolgál mintaként (lásd 5.5. jogi megjegyzés)
- Admin bejelentkezés jelszavas védelemmel, brute-force elleni alap védelemmel (rate limiting a login endpointon)

---

## 9. Nem-funkcionális követelmények

- **Reszponzivitás:** mobile-first, teljesen reszponzív minden töréspontnál (mobil, tablet, desktop)
- **Teljesítmény:** optimalizált képméretek, lazy loading, Lighthouse performance pontszám 90+ cél
- **Hozzáférhetőség:** megfelelő kontraszt a sötétzöld/arany kombinációban (ellenőrizni WCAG AA szerint), alt textek, billentyűzettel navigálható foglalási folyamat
- **Production-ready:** környezeti változók (.env) használata API kulcsokhoz, hibakezelés minden API route-on, HTTPS kikényszerítése

---

## 10. Fejlesztési sorrend Codex számára (javasolt prioritás)

1. Projekt alapstruktúra (React/Next.js + Node.js backend felállítása, adatbázis séma migrálása)
2. Design rendszer implementálása (színek, tipográfia, alap komponensek: gomb, kártya, header, footer)
3. Statikus oldalak: Főoldal, Szolgáltatások, Galéria, Kapcsolat (a fenti szövegekkel és struktúrával)
4. Foglalási rendszer (backend logika + frontend UI)
5. Admin felület (auth + CRUD modulok: képek, szolgáltatások, foglalások)
6. SEO finomhangolás (meta tagek, schema.org, sitemap)
7. Tesztelés (reszponzivitás, foglalási folyamat végponttól végpontig) + élesítés

---

*Ez a dokumentum minden design-, tartalom- és funkciódöntést tartalmaz a fejlesztéshez szükséges részletességgel. A Codexnek ez alapján kell a React + Node.js implementációt elkészítenie.*
