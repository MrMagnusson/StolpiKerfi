# Stólpi — live demo deployment (Railway)

**Staða: ✅ Lifandi.** Öll þrjú forrit + Postgres keyra í Railway-verkefninu `shimmering-reverence`,
alveg ótengt fyrirtækis-Azure/M365 (sjálfstæður reikningur notanda).

| Þjónusta | Slóð | Athugasemd |
|---|---|---|
| **web** (skrifborð) | https://beautiful-elegance-production-ad7a.up.railway.app | Dockerfile: `apps/web/Dockerfile` |
| **vettvangur** (farsími) | https://protective-blessing-production-efa1.up.railway.app | Dockerfile: `apps/vettvangur/Dockerfile` |
| **api** | https://stolpikerfi-production.up.railway.app | Dockerfile: `apps/api/Dockerfile` — ekki ætlað til beinnar skoðunar |
| **Postgres** | (innra netfang `postgres.railway.internal`, ekki opinbert) | Railway-hýst, `db push` við ræsingu api |

Gagnagrunnur er sáður með sömu sýnigögnum og staðbundna útgáfan (`POST /api/admin/seed`, varið af
`ADMIN_SEED_TOKEN`).

## Hvernig þetta er sett upp — fyrir næstu breytingu
Allar þrjár þjónusturnar eru **Dockerfile-based deploys úr GitHub** (`MrMagnusson/StolpiKerfi`, grein
`master`). Sjálfvirk deploy (Auto Deploy) var **ekki** virkjuð þegar þetta var sett upp — ný `git push`
til `master` uppfærir **ekki** þjónusturnar sjálfkrafa. Til að birta nýjar breytingar þarf handvirkt
**"Redeploy"** á hverri þjónustu í Railway (Deployments-flipi → nýjasta færsla → "Redeploy"), eða
virkja "Auto Deploy" í Settings → Source á hverri þjónustu.

**Fyrir hverja þjónustu, þessar stillingar (Settings):**
- **Source → Root Directory**: tómt (rót geymslunnar — Dockerfile-in þurfa `packages/`)
- **Build → Dockerfile Path**: `apps/api/Dockerfile` / `apps/web/Dockerfile` / `apps/vettvangur/Dockerfile`
- **Networking → target port**: `8080` fyrir allar þrjár — Railway úthlutar alltaf `PORT=8080` óháð
  því sem forritið sjálft biður um; öll þrjú Dockerfiles lesa `process.env.PORT` (api) eða
  `${PORT:-4173}` (web/vettvangur), svo þau hlusta þar sjálfkrafa — bara passa að lénið í "Generate
  Domain" bendi á sama port.

**Variables:**
- **api**: `DATABASE_URL` (Reference á Postgres-þjónustuna), `ADMIN_SEED_TOKEN`
- **web** og **vettvangur**: `VITE_API_URL` = `https://stolpikerfi-production.up.railway.app` (engin
  skástrik í lokin). Þetta er lesið við **byggingu** (Vite bakar `import.meta.env.VITE_API_URL` inn í
  JS-búntinn), svo breyting á þessari breytu krefst **Redeploy** (ekki bara restart) til að skila sér.

## Þekkt fljótandi atriði (ekki blokkerar demo)
- **Myndageymsla er ekki varanleg** — myndir (Vettvangur-myndataka, Ástandsmyndir) vistast á
  staðbundnum diski `api`-gámsins og týnast við hverja nýja útgáfu/redeploy. Fyrir alvöru notkun:
  Railway Volume tengt við `/repo/apps/api/uploads`, eða flytja í S3/Blob.
- **Gagnagrunnsskema er samstillt með `prisma db push`**, ekki formlegri migration-sögu (því beinn
  aðgangur að Postgres frá þróunarvél var ekki tiltækur — sjá `apps/api/Dockerfile`). Í lagi fyrir
  demo-stigið; skipta yfir í `prisma migrate dev/deploy` með alvöru migration-skrám áður en þetta fer í
  raunverulega notkun.
- Verkefnið `illustrious-elegance` í Railway er gamalt/ónotað (biluð fyrsta tilraun) — má eyða.

## Kostnaður
Railway "Trial" — $5 í inneign, 30 daga. Eftir það þarf greiðsluupplýsingar til að halda þjónustunum
gangandi (notandinn stjórnar því sjálfur, ekkert sjálfvirkt).
