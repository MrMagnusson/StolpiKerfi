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
- **Redeploy af eldri (ekki-nýjustu) færslu í "History" listanum er ekki alltaf í boði** — Railway
  býður stundum ekki upp á "Redeploy" á færslum sem eru merktar "REMOVED" lengra niðri í listanum.
  Ef það gerist: passa að ýta alltaf á "Redeploy" á **efstu/nýjustu** færslunni í listanum (þeirri sem
  samsvarar nýjasta `git push`-inu), ekki eldri færslu — annars getur eldri útgáfa óvart orðið "Active"
  aftur ofan á nýrri breytingu. Ef nýjasta commitið vantar alveg í listann, þarf nýtt `git push` til að
  fá ferska færslu efst sem hægt er að deploya.
- **web er núna PWA (sjá vite-plugin-pwa í `apps/web/vite.config.ts`) — þjónustuverjinn getur sýnt
  eldri útgáfu rétt eftir redeploy.** `registerType: "autoUpdate"` á að uppfæra sig sjálfkrafa við
  næstu heimsókn, en það gerist ekki alltaf samstundis. Ef breyting virðist ekki hafa skilað sér á
  **web** eftir staðfestan redeploy: opna Verktólin (F12) → Application → Service Workers →
  "Unregister", og/eða Application → Storage → "Clear site data", endurhlaða svo síðuna.
  **vettvangur** og **api** eru ekki PWA og verða ekki fyrir þessu.

## Kostnaður
Railway "Trial" — $5 í inneign, 30 daga. Eftir það þarf greiðsluupplýsingar til að halda þjónustunum
gangandi (notandinn stjórnar því sjálfur, ekkert sjálfvirkt).
