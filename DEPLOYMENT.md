# Noir by Kriszta — Telepítési útmutató (production)

Ez a leírás végigvezet a weboldal élesítésén. A teljes rendszer Dockerben fut
(PostgreSQL + backend + frontend + Caddy reverse proxy), **automatikus HTTPS-sel**.
Az adatok **nevezett Docker volume-okban** vannak, ezért újradeploy / frissítés
után is megmaradnak.

```
                    ┌─────────── VPS (1 szerver) ───────────┐
  Internet ──443──▶ │  Caddy  ──▶  frontend (Next.js :3000)  │
                    │    │    ──▶  backend  (Express :4000)  │
                    │    │              │                    │
                    │    │              ▼                    │
                    │    │        PostgreSQL :5432            │
                    │    │      [pgdata volume]  ◀── adat itt marad
                    │    └──▶ [uploads volume] ◀── feltöltött képek
                    └───────────────────────────────────────┘
```

---

## 0. Mit fizetsz? (költség)

| Tétel | Ár |
|---|---|
| VPS (Hetzner CX22: 2 vCPU / 4 GB RAM / 40 GB SSD) | **~3,79 €/hó** (~1 500 Ft) |
| — vagy Oracle Cloud „Always Free" ARM gép | **0 Ft** (bankkártya kell azonosításhoz) |
| DuckDNS aldomain | 0 Ft |
| HTTPS tanúsítvány (Let's Encrypt) | 0 Ft |
| Brevo email (300 email/nap) | 0 Ft |
| Saját `.hu` domain (később, opcionális) | ~2 000–4 000 Ft/év |

**Ajánlás:** Hetzner CX22 — a legmegbízhatóbb olcsó opció. Az Oracle Free is működik,
de a beállítása körülményesebb és a gépet néha „visszaveszik", ha sokáig üresjáratban van.

---

## 1. VPS létrehozása (Hetzner példa)

1. Regisztrálj: <https://www.hetzner.com/cloud>
2. **New Project** → **Add Server**
   - Location: *Nürnberg* vagy *Falkenstein* (közel van, gyors)
   - Image: **Ubuntu 24.04**
   - Type: **CX22** (Shared vCPU, x86)
   - SSH Key: add hozzá a publikus kulcsod (ha nincs: `ssh-keygen -t ed25519`)
   - Name: `noirbykriszta`
3. **Create & Buy now**. Pár másodperc múlva kapsz egy **IPv4 címet** — ezt jegyezd fel
   (a továbbiakban `SZERVER_IP`).

> Oracle Cloud Free választása esetén: „Always Free eligible" **Ampere A1** (ARM),
> Ubuntu 24.04, nyisd meg a 80-as és 443-as portot a VCN Security List-ben.
> A többi lépés azonos.

---

## 2. DuckDNS domain beállítása

1. Menj a <https://www.duckdns.org> oldalra, jelentkezz be (Google/GitHub).
2. Felül a **token**-t másold ki (ez a `DUCKDNS_TOKEN`).
3. Hozz létre egy aldomaint, pl. `noirbykriszta` → lesz `noirbykriszta.duckdns.org`.
4. A **current ip** mezőbe írd be a `SZERVER_IP`-t, és **update ip**.

Ez lesz ideiglenesen a weboldal címe. (A DuckDNS-frissítő konténer ezután
magától karbantartja, ha változna az IP.)

---

## 3. Szerver előkészítése (Docker telepítése)

Lépj be a szerverre a saját géped termináljából:

```bash
ssh root@SZERVER_IP
```

Majd a szerveren:

```bash
# rendszerfrissítés
apt update && apt upgrade -y

# Docker + Docker Compose plugin (hivatalos szkript)
curl -fsSL https://get.docker.com | sh

# tűzfal: csak SSH + web
apt install -y ufw
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# ellenőrzés
docker --version && docker compose version
```

---

## 4. A projekt feltöltése a szerverre

**Ha van GitHub-od** (ajánlott a későbbi frissítésekhez):

```bash
# a saját gépeden, a projekt mappájában:
git init && git add -A && git commit -m "Noir by Kriszta"
git branch -M main
git remote add origin git@github.com:FELHASZNALO/noirbykriszta.git
git push -u origin main
```
```bash
# a szerveren:
apt install -y git
git clone https://github.com/FELHASZNALO/noirbykriszta.git
cd noirbykriszta
```

**GitHub nélkül** — másold fel a mappát a saját gépedről (a `node_modules`
és `.next` mappák nélkül):

```bash
# a saját gépeden (Git Bash / WSL), a projekt szülőmappájából:
rsync -av --exclude node_modules --exclude .next --exclude .env \
  noirbykriszta/ root@SZERVER_IP:/root/noirbykriszta/
```

---

## 5. A `.env` fájl kitöltése

A szerveren, a projekt mappájában:

```bash
cp .env.example .env
nano .env
```

> ⚠️ **A titkokat (jelszavak, tokenek) KIZÁRÓLAG a `.env`-be írd, SOHA a
> `.env.example`-be** — utóbbi verziókövetett, és ha felkerül GitHubra, bárki látja.

Töltsd ki az alábbiakat (a `#` sorok a magyarázatok):

| Kulcs | Mit írj bele |
|---|---|
| `SITE_DOMAIN` | `noirbykriszta.duckdns.org` |
| `SITE_URL` | `https://noirbykriszta.duckdns.org` |
| `TZ` | `Europe/Budapest` (marad) |
| `COMPOSE_PROFILES` | `duckdns` (egyelőre hagyd így) |
| `DUCKDNS_SUBDOMAIN` | `noirbykriszta` |
| `DUCKDNS_TOKEN` | a DuckDNS tokened |
| `POSTGRES_PASSWORD` | erős véletlen jelszó → `openssl rand -base64 24` |
| `ADMIN_EMAIL` | a belépési email (pl. Kriszta címe) |
| `ADMIN_PASSWORD` | erős admin jelszó |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `OWNER_EMAIL` | ide jönnek az értesítők (Kriszta címe) |
| `MAIL_REPLY_TO` | Kriszta címe |
| `SALON_ADDRESS` | a szalon pontos címe |

Az **email küldést** most még hagyd üresen (`SMTP_*` és `RESEND_API_KEY` üres) —
így minden email a szerver logjába íródik, a weboldal működik. Az élesítés után
állítod be (lásd **7. pont**).

A `SLOT_STEP_MINUTES` / `MIN_LEAD_HOURS` csak az **első indítás** alapértékei —
utána az admin felületről módosíthatók (lásd **9/B pont**).

Mentés a nano-ban: `Ctrl+O`, `Enter`, majd `Ctrl+X`.

---

## 6. Indítás

```bash
docker compose up -d --build
```

Az első build 3–6 perc. Utána:

```bash
docker compose ps          # minden "running" / "healthy" legyen
docker compose logs -f caddy   # itt látszik, ha megkapta a HTTPS tanúsítványt
```

Ha a `caddy` logban látod, hogy `certificate obtained successfully` — kész.
Nyisd meg: **https://noirbykriszta.duckdns.org**

Admin: **https://noirbykriszta.duckdns.org/admin/login**
(a `.env`-ben megadott `ADMIN_EMAIL` / `ADMIN_PASSWORD` párossal)

> Ha a HTTPS nem jön össze: ellenőrizd, hogy a DuckDNS IP tényleg a `SZERVER_IP`,
> és hogy a 80/443 port nyitva van (`ufw status`). A Caddy 1-2 percenként újrapróbálja.

---

## 7. Email küldés beállítása (Brevo — ingyenes, Gmail feladóval)

A weboldal a foglaló vendégnek **és** Krisztának is emailt küld
(foglalás leadása, megerősítés, lemondás, kapcsolati űrlap).

1. Regisztrálj a <https://www.brevo.com> oldalon (ingyenes csomag: 300 email/nap).
2. **Settings → Senders, Domains & Dedicated IPs → Senders → Add a sender**
   - Add meg a küldő Gmail címet és nevet („Noir by Kriszta")
   - A Gmail-re érkező levélben **kattints a megerősítő linkre**
3. **Settings → SMTP & API → SMTP** fül:
   - másold ki a **Login** értéket (pl. `9a1b2c...@smtp-brevo.com`)
   - **Generate a new SMTP key** → másold ki a kulcsot
4. A szerveren `nano .env`, és állítsd:

   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<a Brevo Login értéke>
   SMTP_PASS=<a Brevo SMTP kulcs>
   MAIL_FROM=Noir by Kriszta <ugyanaz.a.gmail@gmail.com>
   OWNER_EMAIL=<ide jönnek az admin értesítők>
   MAIL_REPLY_TO=<ide írnak vissza a vendégek>
   ```

   > **Fontos:** a `MAIL_FROM`-ban lévő cím **pontosan** az legyen, amit a Brevo-ban
   > igazoltál (a Gmail cím). Különben a Brevo elutasítja a küldést.

5. Alkalmazd:

   ```bash
   docker compose up -d
   ```

6. Teszt: adj le egy próbafoglalást a weboldalon. Pár másodperc múlva
   érkeznie kell a visszaigazolónak. Hibakeresés:

   ```bash
   docker compose logs backend | grep -i "email\|smtp\|mail"
   ```

> **Gmail közvetlenül** (Brevo helyett): a Google-fióknál kapcsold be a 2FA-t,
> majd hozz létre egy **App Password**-öt (Google-fiók → Biztonság → Alkalmazásjelszavak).
> `SMTP_HOST=smtp.gmail.com`, `SMTP_USER=<gmail cím>`, `SMTP_PASS=<app password>`.
> Napi limit ~500 email. Hosszú távon a Brevo jobb a kézbesíthetőség miatt.

---

## 8. Saját domain bekötése (később, amikor megvan)

Példa: `noirbykriszta.hu`

1. A domain-szolgáltatónál (pl. Rackhost, Namecheap) állíts be **A rekordot**:

   | Típus | Név | Érték |
   |---|---|---|
   | A | `@` | `SZERVER_IP` |
   | A | `www` | `SZERVER_IP` |

2. Várd meg, míg terjed (10 perc – pár óra). Ellenőrzés: `dig +short noirbykriszta.hu`

3. A szerveren `nano .env`:

   ```env
   SITE_DOMAIN=noirbykriszta.hu www.noirbykriszta.hu
   SITE_URL=https://noirbykriszta.hu
   COMPOSE_PROFILES=
   ```

   (A `COMPOSE_PROFILES=` üresen kikapcsolja a DuckDNS-frissítőt.)

4. Alkalmazd:

   ```bash
   docker compose up -d
   docker compose logs -f caddy   # új tanúsítvány az új domainre
   ```

A Caddy automatikusan kér tanúsítványt az új domainre. A DuckDNS-es cím ezután
elhagyható (vagy meghagyható átirányításnak).

---

## 9. Frissítés / újradeploy — ADATVESZTÉS NÉLKÜL

### 9/A. Hogyan tárolódik minden (és miért marad meg)

| Adat | Hol van | Redeploy után |
|---|---|---|
| Foglalások, szolgáltatások, árak, nyitvatartás, szünetek, oldalszövegek, **foglalási beállítások** | PostgreSQL → `pgdata` docker volume | **megmarad** |
| Feltöltött képek (galéria, előtte–utána, kártyaképek) | `uploads` docker volume | **megmarad** |
| HTTPS tanúsítványok | `caddy_data` docker volume | **megmarad** |
| Napi automata mentések | `./backups/` a szerver lemezén | **megmarad** (ezt a `down -v` sem törli) |

Az admin felületről módosított **minden** paraméter az adatbázisba kerül, tehát
a `pgdata` volume-ban van — redeploy után visszatöltődik.

### 9/B. A frissítés menete

```bash
cd ~/noirbykriszta
git pull                      # ha GitHub-ról frissítesz
docker compose up -d --build  # újraépít + újraindít, az adat megmarad
```

Az induláskor a backend automatikusan lefuttatja az új adatbázis-migrációkat.
A seed **idempotens**: csak a hiányzó alapadatokat tölti fel, **nem** írja felül
az adminban módosított szolgáltatásokat, képeket, szövegeket, beállításokat vagy
a foglalásokat. A backend logban a végén ezt látod:
`Seed kész. Megőrzött adatok: N foglalás, M galéria elem, ...`

> ⚠️ **SOHA ne futtasd:** `docker compose down -v` — a `-v` törli a docker
> volume-okat (adatbázis + képek + tanúsítványok). A `./backups/` mappa ilyenkor
> is megmarad, de a visszaállítás macerás. Sima `docker compose down` biztonságos.

---

## 10. Biztonsági mentés és visszaállítás

### Automatikus (már be van állítva)

A `backup-db` és `backup-uploads` konténerek **naponta** mentenek a
`./backups/` mappába (a szerver lemezén, a docker volume-októl függetlenül):

```
backups/db/daily/   backups/db/weekly/   backups/db/monthly/   backups/db/last/
backups/uploads/uploads_YYYYMMDD_HHMMSS.tar.gz
```

Retenció: DB 14 nap / 8 hét / 6 hónap; képek 14 archív. Ajánlott ezt a mappát
időnként a saját gépedre is lehúzni:  `scp -r root@SZERVER_IP:~/noirbykriszta/backups ./`

### Kézi mentés most azonnal

```bash
cd ~/noirbykriszta
docker compose exec backup-db /backup.sh          # DB dump a backups/db-be
docker compose exec backup-uploads sh -c 'tar czf /backups/uploads_$(date +%F).tar.gz -C /data .'
```

### Visszaállítás

Adatbázis (a legfrissebb napi mentésből):

```bash
gunzip -c backups/db/daily/noirbykriszta-latest.sql.gz \
  | docker compose exec -T db psql -U noir -d noirbykriszta
```

Képek:

```bash
docker run --rm -v noirbykriszta_uploads:/u -v "$PWD/backups/uploads":/b alpine \
  sh -c 'cd /u && tar xzf /b/uploads_YYYY-MM-DD.tar.gz'
```

---

## 10/B. Admin jelszó módosítása

Az admin fiók az **első** indításkor jön létre a `.env` `ADMIN_*` értékeivel.
A `.env` későbbi módosítása nem írja felül. Új jelszó beállítása:

```bash
cd ~/noirbykriszta
docker compose exec backend node -e '
  const b=require("bcryptjs"), {PrismaClient}=require("@prisma/client"), p=new PrismaClient();
  p.admin.update({where:{email:"IDE_AZ_EMAIL"},data:{passwordHash:b.hashSync("IDE_AZ_UJ_JELSZO",10)}}).then(()=>console.log("kész")).finally(()=>p.$disconnect());
'
```

---

## 11. Hasznos parancsok

```bash
docker compose ps                    # állapot
docker compose logs -f backend       # backend log
docker compose logs -f frontend      # frontend log
docker compose restart backend       # egy szolgáltatás újraindítása
docker compose exec db psql -U noir noirbykriszta   # SQL konzol
docker compose exec backend node prisma/seed.js --force   # teljes újraseed (FIGYELEM: felülír)
docker stats                         # erőforrás-használat
```

---

## 12. Hibaelhárítás

| Tünet | Megoldás |
|---|---|
| `https://...` nem tölt be, tanúsítvány-hiba | `docker compose logs caddy` — DuckDNS IP helyes? 80/443 nyitva? Domain terjedt már? |
| „502 Bad Gateway" | `docker compose ps` — a `backend`/`frontend` fut? `docker compose logs backend` |
| Nem érkezik email | `docker compose logs backend | grep -i mail` — a `MAIL_FROM` cím egyezik a Brevo-ban igazolttal? |
| Backend újraindul körökben | `docker compose logs backend` — általában rossz `DATABASE_URL` vagy `POSTGRES_PASSWORD` eltérés |
| Admin belépés „Hibás email vagy jelszó" | a `.env` `ADMIN_*` értékei; `docker compose exec backend node prisma/seed.js` újra létrehozza, ha nem létezett |
| Kevés a memória | Hetzner CX22 bőven elég; ha 1 GB-os gépet választottál, adj hozzá 2 GB swap-et |

---

## 13. Biztonsági checklista élesítés előtt

- [ ] `ADMIN_PASSWORD` erős, nem az alapértelmezett
- [ ] `JWT_SECRET` és `POSTGRES_PASSWORD` véletlen generált
- [ ] `.env` **nincs** feltöltve gitre (a `.gitignore` már kizárja)
- [ ] `ufw` tűzfal aktív (csak 22/80/443)
- [ ] SSH kulcsos belépés (jelszavas SSH tiltása ajánlott)
- [ ] Napi adatbázis-mentés beállítva (10. pont)
- [ ] A `/adatkezeles` és `/impresszum` oldalak valós cégadatokkal kitöltve
