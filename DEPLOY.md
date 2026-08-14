# Deploy Stólpi til Railway (sjálfstæð demo-uppsetning)

Þetta er ekki tengt fyrirtækis-Azure/M365 á neinn hátt — Railway er sjálfstæð þjónusta sem þú stofnar
reikning hjá með eigin tölvupósti. Kóðinn er tilbúinn (Dockerfiles, Postgres-gagnalíkan); skrefin hér
eru þau sem aðeins þú getur gert (stofna reikninga, smella í gegnum vefviðmót).

## Yfirlit
Þrjár þjónustur + einn gagnagrunnur, allt í sama Railway-verkefni:
- **api** — Express-þjónninn (`apps/api/Dockerfile`)
- **web** — skrifborðsforritið, static build (`apps/web/Dockerfile`)
- **vettvangur** — farsímaforritið, static build (`apps/vettvangur/Dockerfile`)
- **Postgres** — Railway-hýstur gagnagrunnur (búinn til af sjálfu sér úr sniðmáti)

## Skref sem þú gerir

### 1. GitHub-geymsla
Ef kóðinn er ekki þegar á GitHub: stofnaðu tóma geymslu (t.d. `stolpi-kerfi`, einka) á
github.com/new, og segðu mér slóðina — ég ýti kóðanum upp (`git push`) þegar þú hefur samþykkt það.

### 2. Railway-reikningur
Farðu á [railway.app](https://railway.app) → "Login" → skráðu þig inn með GitHub-reikningnum þínum
(einfaldast, því þá er GitHub-tengingin sjálfvirk). Ókeypis "Trial" er nóg fyrir demo.

### 3. Nýtt verkefni + Postgres
1. "New Project" → "Provision PostgreSQL" (eitt smell, engin stilling þarf).
2. Þegar gagnagrunnurinn er kominn upp: opnaðu hann → flipi "Variables" → afritaðu gildið á
   `DATABASE_URL` (byrjar á `postgresql://...`).
3. Sendu mér þetta gildi (í spjallinu, eða settu það sjálf/ur inn í `apps/api/.env` staðbundið og
   láttu mig vita). Þetta er tengistrengur á tóman, nýstofnaðan gagnagrunn sem þú átt sjálf/ur —
   ekki lykilorð að neinum aðgangi.

### 4. Þrjár þjónustur úr sömu GitHub-geymslu
Fyrir hverja af `api`, `web`, `vettvangur`:
1. Í sama verkefni: "New" → "GitHub Repo" → veldu geymsluna.
2. Í þjónustustillingum ("Settings"):
   - **Root Directory**: `/` (rót geymslunnar — Dockerfile-in þurfa aðgang að `packages/`)
   - **Dockerfile Path**: `apps/api/Dockerfile` (eða `apps/web/Dockerfile` / `apps/vettvangur/Dockerfile`)
3. "Settings" → "Networking" → "Generate Domain" til að fá opinbera `*.up.railway.app` slóð.

### 5. Umhverfisbreytur
- **api**-þjónustan: "Variables" flipi →
  - `DATABASE_URL` = smelltu á "Add Reference" og veldu Postgres-þjónustuna (Railway tengir þetta
    sjálfkrafa, þarf ekki að afrita/líma) — annars límdu gildið úr skrefi 3 handvirkt.
  - `UPLOAD_DIR` þarf ekki að setja — sjálfgefið `./uploads` er þegar rétt miðað við gámsins vinnumöppu.
- **web**-þjónustan: "Variables" flipi → merktu sem **Build Variable** (ekki bara runtime):
  - `VITE_API_URL` = opinbera slóðin á **api**-þjónustunni frá skrefi 4 (t.d.
    `https://stolpi-api-production.up.railway.app`), **engin** skástrik í lokin.
- **vettvangur**-þjónustan: sama `VITE_API_URL` (build variable) og bendir á sömu api-slóð.

Eftir að `VITE_API_URL` er sett þarf **web**/**vettvangur** að endurbyggja (Railway gerir það
sjálfkrafa við breytingu á build-breytu).

### 6. Myndageymsla (valfrjálst, seinna)
Núna vistast myndir (Vettvangur-myndataka) á staðbundnum diski gámsins — týnast við hverja nýja
útgáfu. Fyrir demo er þetta í lagi. Þegar/ef alvöru notkun hefst: bæta við Railway **Volume**
tengdu við `/repo/apps/api/uploads` á api-þjónustunni (Settings → Volumes), eða flytja í S3/Blob.

## Skref sem ég geri (þegar ég hef DATABASE_URL frá þér)
1. Keyri `prisma migrate dev` gegn nýja Postgres-gagnagrunninum — býr til fyrstu migration-skrána
   (var eytt SQLite-útgáfunni af henni þegar skipt var yfir í Postgres).
2. Sái gagnagrunninn með sömu sýnigögnum og verið hafa notuð hingað til.
3. Staðfesti að kerfið keyri rétt gegn þessum gagnagrunni áður en þú deployar.
4. Ýti breytingunum í GitHub-geymsluna (með þínu samþykki).

## Kostnaður
Railway "Trial" gefur $5 í inneign ókeypis — dugar líklega í nokkrar vikur af demo-notkun m.v. litla
umferð. Eftir það er þetta "usage-based" (nokkrir dollarar/mánuði fyrir svona lítið kerfi í lágri
notkun). Ekkert sjálfvirkt áskriftargjald nema þú setjir inn greiðslukort og virkjar það sjálf/ur.
