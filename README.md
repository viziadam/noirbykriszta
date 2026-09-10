# Noir by Kriszta — Weboldal

Prémium szempilla- és szemöldök-stylist weboldal online időpontfoglalással és admin felülettel.
A [specifikáció](./NoirByKriszta_weboldal_specifikacio.md) alapján készült.

> **Élesítés / telepítés:** lásd **[DEPLOYMENT.md](./DEPLOYMENT.md)** — teljes,
> lépésről lépésre útmutató (VPS + Docker + automatikus HTTPS + DuckDNS / saját domain).

## Tech stack

| Réteg | Technológia |
|---|---|
| Frontend | Next.js 14 (App Router, standalone build), React 18 |
| Backend | Node.js + Express (REST API) |
| Adatbázis | **PostgreSQL 16** + Prisma ORM |
| Auth | JWT + bcrypt, egyetlen admin szerepkör, login rate-limit |
| Email | SMTP (Brevo / Gmail) **vagy** Resend — beállítás nélkül konzolra logol |
| Infra | Docker Compose: `db` + `backend` + `frontend` + `caddy` (reverse proxy, auto-HTTPS) |
| Perzisztencia | Docker **nevezett volume-ok** — redeploy után nincs adatvesztés |

## Mappaszerkezet

```
noirbykriszta/
├── docker-compose.yml       éles stack (db + backend + frontend + caddy [+ duckdns])
├── docker-compose.dev.yml   helyi fejlesztéshez (Postgres port kitétele)
├── Caddyfile                reverse proxy + automatikus HTTPS
├── .env.example             ← ebből készítsd a telepítési .env-et
├── DEPLOYMENT.md            telepítési útmutató
├── backend/
│   ├── Dockerfile · docker-entrypoint.sh   (migráció + seed + start)
│   ├── prisma/              séma (PostgreSQL) + idempotens seed
│   └── src/routes · src/lib (availability, email)
└── frontend/
    ├── Dockerfile
    ├── app/ · components/ · lib/
```

## Helyi fejlesztés

Előfeltétel: Node.js 18+ és Docker Desktop.

```bash
npm run install:all

# Postgres konténer (csak az adatbázis, kitett porttal)
npm run dev:db

# backend/.env  (a devpassword egyezzen a docker-compose.yml POSTGRES_PASSWORD-jével,
# vagy állítsd a gyökér .env-ben — dev-hez a .env.example alap jó)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# migráció + seed
npm --prefix backend run db:setup

# backend :4000 + frontend :3000
npm run dev
```

Nyisd meg: <http://localhost:3000> · Admin: <http://localhost:3000/admin/login>

Alap admin (seed): `admin@noirbykriszta.hu` / `noir-admin-2026` — élesben a `.env`
`ADMIN_EMAIL` / `ADMIN_PASSWORD` értékeivel jön létre.

### Teljes stack helyben (Dockerrel, éleshez hasonlóan)

```bash
cp .env.example .env          # töltsd ki (SITE_DOMAIN=localhost, SITE_URL=https://localhost)
docker compose up -d --build
```

## Élesítés

Röviden (részletek: **[DEPLOYMENT.md](./DEPLOYMENT.md)**):

1. VPS (Hetzner CX22 ~3,79 €/hó, vagy Oracle Free) + Docker
2. DuckDNS aldomain a szerver IP-jére
3. `git clone` / feltöltés → `cp .env.example .env` → kitöltés
4. `docker compose up -d --build`
5. Caddy automatikusan hoz Let's Encrypt HTTPS tanúsítványt
6. Email: Brevo (ingyenes) SMTP a `.env`-ben
7. Saját domain megérkeztekor: `SITE_DOMAIN` + `SITE_URL` átírása a `.env`-ben, `docker compose up -d`

**Redeploy adatvesztés nélkül:** `git pull && docker compose up -d --build`.
Az adatbázis, a feltöltött képek és a tanúsítványok nevezett volume-okban maradnak.
**Soha ne** használd a `docker compose down -v` parancsot (a `-v` törli a volume-okat).

## Fő funkciók

- **Főoldal** — StoryBrand (SB7) szövegezés, teljes képernyős hero, szolgáltatás-kártyák képpel + „Időpontfoglalás” gombbal, galéria-karusszel, előtte–utána csúszka, vélemények, CTA sáv
- **Szolgáltatások** — kategóriánkénti akkordeon árlista, „Foglalás” gomb előtöltéssel
- **Galéria** — szűrhető rács, lightbox, előtte–utána összehasonlító csúszka
- **Kapcsolat** — Google Térkép, nyitvatartás, kapcsolatfelvételi űrlap (emailt küld)
- **Foglalás** — 4 lépéses folyamat, a backend számolja a szabad időpontokat
- **Admin** — képfeltöltő felület (galéria, előtte–utána, szolgáltatás-kártyakép), szolgáltatások/árak CRUD, foglalások, nyitvatartás/szünetek, tartalom
- **Email értesítők** — a vendég és Kriszta is kap emailt: foglalás leadása, megerősítés, lemondás, kézi foglalás, kapcsolati űrlap
- **SEO** — oldalankénti meta, `BeautySalon` JSON-LD, dinamikus `sitemap.xml` / `robots.txt`
- **GDPR** — cookie sáv, adatkezelési tájékoztató, foglaláskor kötelező elfogadás
- **Reszponzív** — mobil / tablet / desktop; navigáció mobilon hamburger menü
