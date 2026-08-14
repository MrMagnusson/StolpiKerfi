# Deploy Stólpi til Railway (sjálfstæð demo-uppsetning)

Þetta er ekki tengt fyrirtækis-Azure/M365 á neinn hátt — Railway er sjálfstæð þjónusta sem þú stofnar
reikning hjá með eigin tölvupósti. Kóðinn er tilbúinn (Dockerfiles, Postgres-gagnalíkan); skrefin hér
eru þau sem aðeins þú getur gert (stofna reikninga, smella í gegnum vefviðmót).

**Athugasemd um tengingu við gagnagrunninn**: `postgres.railway.internal` er innra netfang sem virkar
bara á milli þjónusta innan sama Railway-verkefnis — ekki frá utanaðkomandi vél. Frekar en að kveikja á
opinberu neti fyrir gagnagrunninn (aukin áhætta + hugsanleg gjöld) keyrir **api**-þjónustan sjálf
schema-samstillingu (`prisma db push`) og gagnasáningu (gegnum `/api/admin/seed`, sjá neðar) við
ræsingu/eftir fyrstu keyrslu — allt innan Railway-netsins, ókeypis, staðalbúnaður.

## Yfirlit
Þrjár þjónustur + einn gagnagrunnur, allt í sama Railway-verkefni:
- **api** — Express-þjónninn (`apps/api/Dockerfile`)
- **web** — skrifborðsforritið, static build (`apps/web/Dockerfile`)
- **vettvangur** — farsímaforritið, static build (`apps/vettvangur/Dockerfile`)
- **Postgres** — Railway-hýstur gagnagrunnur (búinn til af sjálfu sér úr sniðmáti)

## Skref sem þú gerir

### 1. GitHub-geymsla — ✅ búið
Kóðinn er á [github.com/MrMagnusson/StolpiKerfi](https://github.com/MrMagnusson/StolpiKerfi).

### 2. Railway-reikningur — ✅ búið (Postgres til)

### 3. Þrjár þjónustur úr sömu GitHub-geymslu
Fyrir hverja af `api`, `web`, `vettvangur`:
1. Í sama verkefni: "New" → "GitHub Repo" → veldu `StolpiKerfi`.
2. Í þjónustustillingum ("Settings"):
   - **Root Directory**: `/` (rót geymslunnar — Dockerfile-in þurfa aðgang að `packages/`)
   - **Dockerfile Path**: `apps/api/Dockerfile` (eða `apps/web/Dockerfile` / `apps/vettvangur/Dockerfile`)
3. "Settings" → "Networking" → "Generate Domain" til að fá opinbera `*.up.railway.app` slóð.

### 4. Umhverfisbreytur
- **api**-þjónustan: "Variables" flipi →
  - `DATABASE_URL` = smelltu á **"Add Reference"** og veldu Postgres-þjónustuna (Railway tengir þetta
    sjálfkrafa við innra netfangið — þarf ekki að líma neitt handvirkt).
  - `ADMIN_SEED_TOKEN` = (slembinn strengur — sjá gildið sem ég sendi þér í spjallinu, ekki geymt hér í
    skjalinu). Opnar tímabundið `/api/admin/seed`, ég nota hana einu sinni til að sá sýnigögnum eftir
    fyrsta deploy — þú mátt breyta/fjarlægja hana hvenær sem er á eftir.
- **web**-þjónustan: "Variables" flipi → merktu sem **Build Variable** (ekki bara runtime):
  - `VITE_API_URL` = opinbera slóðin á **api**-þjónustunni frá skrefi 3 (t.d.
    `https://stolpi-api-production.up.railway.app`), **engin** skástrik í lokin.
- **vettvangur**-þjónustan: sama `VITE_API_URL` (build variable) og bendir á sömu api-slóð.

Eftir að `VITE_API_URL` er sett þarf **web**/**vettvangur** að endurbyggja (Railway gerir það
sjálfkrafa við breytingu á build-breytu).

### 5. Myndageymsla (valfrjálst, seinna)
Núna vistast myndir (Vettvangur-myndataka, Ástandsmyndir) á staðbundnum diski gámsins — týnast við
hverja nýja útgáfu. Fyrir demo er þetta í lagi. Þegar/ef alvöru notkun hefst: bæta við Railway
**Volume** tengdu við `/repo/apps/api/uploads` á api-þjónustunni (Settings → Volumes), eða flytja í
S3/Blob.

## Skref sem ég geri
1. Um leið og **api**-þjónustan er komin upp með `DATABASE_URL` + `ADMIN_SEED_TOKEN` stillt (skref 3-4):
   kalla á `POST https://<api-slóð>/api/admin/seed?token=<ADMIN_SEED_TOKEN>` — sáir gagnagrunninn með
   sömu sýnigögnum og verið hafa notuð hingað til.
2. Staðfesti að kerfið keyri rétt enda-til-enda gegn deployaða kerfinu (skrifborð + vettvangur).
3. Segi þér frá um leið og allt er komið upp og gef þér slóðirnar til að skoða/prófa sjálf/ur.

## Kostnaður
Railway "Trial" gefur $5 í inneign ókeypis — dugar líklega í nokkrar vikur af demo-notkun m.v. litla
umferð. Eftir það er þetta "usage-based" (nokkrir dollarar/mánuði fyrir svona lítið kerfi í lágri
notkun). Ekkert sjálfvirkt áskriftargjald nema þú setjir inn greiðslukort og virkjar það sjálf/ur.
