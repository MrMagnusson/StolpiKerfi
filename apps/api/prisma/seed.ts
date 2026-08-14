// Seed data — ported verbatim (same customers, projects, units, deals…) from
// seed() in Stólpi Kerfi.dc.html (lines 1001-1136), adapted to relational IDs.
import { PrismaClient } from "@prisma/client";
import { SALESPEOPLE } from "@stolpi/shared";

const prisma = new PrismaClient();

function iso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Hreinsa gagnagrunn…");
  await prisma.bcLogEntry.deleteMany();
  await prisma.bcSettings.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.damage.deleteMany();
  await prisma.doc.deleteMany();
  await prisma.maintenanceEntry.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.priceItem.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.salesTarget.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.project.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const y = new Date().getFullYear();

  console.log("Sái viðskiptavinum…");
  const [verkis, iav, landsvirkjun, istak, vegagerdin] = await Promise.all([
    prisma.customer.create({ data: { name: "Verkís hf.", kennitala: "480269-3079", phone: "422 8000", email: "verkis@verkis.is", address: "Ofanleiti 2, Reykjavík" } }),
    prisma.customer.create({ data: { name: "ÍAV", kennitala: "550669-1379", phone: "530 4200", email: "iav@iav.is", address: "Höfðabakki 9, Reykjavík" } }),
    prisma.customer.create({ data: { name: "Landsvirkjun", kennitala: "420269-1299", phone: "515 9000", email: "landsvirkjun@lv.is", address: "Katrínartúni 2, Reykjavík" } }),
    prisma.customer.create({ data: { name: "Ístak", kennitala: "521204-2660", phone: "530 2700", email: "istak@istak.is", address: "Bugðufljóti 19, Mosfellsbæ" } }),
    prisma.customer.create({ data: { name: "Vegagerðin", kennitala: "680269-2899", phone: "522 1000", email: "vg@vegagerdin.is", address: "Suðurhraun 3, Garðabæ" } }),
  ]);

  console.log("Sái tengiliðum…");
  const [jon, anna, siggi, helga, olafur, bryndis] = await Promise.all([
    prisma.contact.create({ data: { customerId: verkis.id, name: "Jón Jónsson", title: "Verkefnastjóri", email: "jon@verkis.is", phone: "660 1234" } }),
    prisma.contact.create({ data: { customerId: iav.id, name: "Anna Björk", title: "Innkaupastjóri", email: "anna@iav.is", phone: "660 5678" } }),
    prisma.contact.create({ data: { customerId: landsvirkjun.id, name: "Sigurður Þór", title: "Framkvæmdastjóri", email: "siggi@lv.is", phone: "660 9012" } }),
    prisma.contact.create({ data: { customerId: istak.id, name: "Helga Rún", title: "Staðarstjóri", email: "helga@istak.is", phone: "661 4411" } }),
    prisma.contact.create({ data: { customerId: vegagerdin.id, name: "Ólafur Steinn", title: "Deildarstjóri", email: "olafur@vegagerdin.is", phone: "661 7788" } }),
    prisma.contact.create({ data: { customerId: verkis.id, name: "Bryndís Ósk", title: "Öryggisstjóri", email: "bryndis@verkis.is", phone: "662 3344" } }),
  ]);

  console.log("Sái verkefnum…");
  const p1 = await prisma.project.create({ data: { name: "Vinnubúðir – Kárahnjúkar", customerId: verkis.id, unitsNeeded: 3, needsToilet: true, minSizeM2: 20, location: "Austurland", startDate: `${y}-09-01`, endDate: `${y}-12-15`, status: "active", requiredEquipment: ["Sturta", "Hitablásari"] } });
  const p2 = await prisma.project.create({ data: { name: "Kaffistofa – Hvammsvirkjun", customerId: landsvirkjun.id, unitsNeeded: 1, needsToilet: true, minSizeM2: 28, location: "Suðurland", startDate: `${y}-10-01`, endDate: `${y + 1}-06-30`, status: "planning", requiredEquipment: ["Eldhúskrókur", "Loftkæling", "Innréttingar"] } });
  const p3 = await prisma.project.create({ data: { name: "Skrifstofa á verkstað – Sundabraut", customerId: iav.id, unitsNeeded: 2, needsToilet: false, minSizeM2: 15, location: "Reykjavík", startDate: `${y}-08-15`, endDate: `${y}-11-30`, status: "active", requiredEquipment: ["Skrifborð", "Nettenging"] } });
  const p4 = await prisma.project.create({ data: { name: "Brúarvinna – Skeiðarársandur", customerId: vegagerdin.id, unitsNeeded: 2, needsToilet: true, minSizeM2: 18, location: "Suðausturland", startDate: `${y}-09-20`, endDate: `${y}-12-01`, status: "planning", requiredEquipment: ["Hitablásari", "Öryggisdyr"] } });
  const p5 = await prisma.project.create({ data: { name: "Gangnagerð – Fjarðarheiði", customerId: istak.id, unitsNeeded: 4, needsToilet: true, minSizeM2: 24, location: "Austurland", startDate: `${y + 1}-01-10`, endDate: `${y + 1}-09-30`, status: "planning", requiredEquipment: ["Sturta", "Eldhúskrókur", "Nettenging"] } });

  console.log("Sái einingum…");
  const mkUnit = (code: string, sizeM2: number, hasToilet: boolean, status: string, location: string, equipment: string[], customerId?: string) =>
    prisma.unit.create({ data: { code, sizeM2, hasToilet, status, location, equipment, customerId: customerId ?? null } });

  const u1 = await mkUnit("ST-101", 15, false, "available", "Lager RVK", ["Hitablásari", "Rafmagnstafla", "Gluggar"]);
  const u2 = await mkUnit("ST-102", 24, true, "available", "Lager RVK", ["Sturta", "Eldhúskrókur", "Hitablásari", "Loftkæling", "Öryggisdyr"]);
  const u3 = await mkUnit("ST-103", 30, true, "available", "Lager RVK", ["Sturta", "Eldhúskrókur", "Loftkæling", "Innréttingar", "Nettenging"]);
  const u4 = await mkUnit("ST-104", 15, false, "in_use", "Kárahnjúkar", ["Rafmagnstafla", "Gluggar", "Skrifborð"], verkis.id);
  const u5 = await mkUnit("ST-105", 20, true, "returned", "Lager RVK", ["Sturta", "Hitablásari", "Öryggisdyr"]);
  const u6 = await mkUnit("ST-106", 36, true, "available", "Lager RVK", ["Sturta", "Eldhúskrókur", "Loftkæling", "Innréttingar", "Nettenging", "Öryggisdyr", "Skrifborð"]);
  const u7 = await mkUnit("ST-107", 18, false, "reserved", "Lager RVK", ["Hitablásari", "Gluggar", "Skrifborð"]);
  const u8 = await mkUnit("ST-108", 24, true, "in_use", "Þeistareykir", ["Sturta", "Eldhúskrókur", "Hitablásari"], landsvirkjun.id);
  const u9 = await mkUnit("ST-109", 30, true, "available", "Lager Akureyri", ["Sturta", "Eldhúskrókur", "Ísskápur", "Nettenging"]);
  const u10 = await mkUnit("ST-110", 12, false, "available", "Lager Akureyri", ["Rafmagnstafla", "Gluggar"]);
  const u11 = await mkUnit("ST-201", 24, true, "damaged", "Verkstæði", ["Sturta", "Eldhúskrókur"]);
  const u12 = await mkUnit("ST-202", 40, true, "in_use", "Hvammsvirkjun", ["Sturta", "Eldhúskrókur", "Loftkæling", "Innréttingar", "Nettenging", "Skrifborð"], iav.id);

  console.log("Sái sölutækifærum og samskiptum…");
  await prisma.deal.createMany({
    data: [
      { title: "Vinnubúðir – Kárahnjúkar", customerId: verkis.id, contactId: jon.id, stage: "unnid", valueIsk: 8_400_000, source: "Endurtekið", expectedClose: iso(-40), owner: "Kalli", nextStep: "Afhending eininga" },
      { title: "Skrifstofa á verkstað", customerId: iav.id, contactId: anna.id, stage: "tilbod_sent", valueIsk: 3_200_000, source: "Útboð", expectedClose: iso(20), owner: "Kalli", nextStep: "Fylgja eftir tilboði" },
      { title: "Kaffistofa – virkjun", customerId: landsvirkjun.id, contactId: siggi.id, stage: "samningar", valueIsk: 5_600_000, source: "Tilvísun", expectedClose: iso(35), owner: "Gummi Gunnar", nextStep: "Klára samning" },
      { title: "Gangnagerð – búðir 4 ein.", customerId: istak.id, contactId: helga.id, stage: "i_samskiptum", valueIsk: 11_200_000, source: "Útboð", expectedClose: iso(70), owner: "Fannar", nextStep: "Þarfagreining á staðnum" },
      { title: "Brúarvinna – 2 einingar", customerId: vegagerdin.id, contactId: olafur.id, stage: "nytt", valueIsk: 2_400_000, source: "Heimasíða", expectedClose: iso(55), owner: "Kristján", nextStep: "Hringja og staðfesta þörf" },
      { title: "Framlenging – Þeistareykir", customerId: landsvirkjun.id, contactId: siggi.id, stage: "unnid", valueIsk: 4_300_000, source: "Endurtekið", expectedClose: iso(-12), owner: "Kalli", nextStep: "Lokið" },
      { title: "Vetrarbúðir – Norðurland", customerId: iav.id, contactId: anna.id, stage: "tilbod_sent", valueIsk: 6_100_000, source: "Tilvísun", expectedClose: iso(28), owner: "Pálmi", nextStep: "Verðsamtal" },
      { title: "Skólastofur – bráðabirgða", customerId: vegagerdin.id, contactId: olafur.id, stage: "tapad", valueIsk: 3_900_000, source: "Útboð", expectedClose: iso(-20), owner: "Fannar", nextStep: "Tapaðist á verði" },
      { title: "Geymslueiningar – höfn", customerId: istak.id, contactId: helga.id, stage: "samningar", valueIsk: 2_750_000, source: "Kaldur póstur", expectedClose: iso(14), owner: "Gummi Gunnar", nextStep: "Yfirlestur samnings" },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { type: "simtal", subject: "Fylgja eftir tilboði", customerId: iav.id, contactId: anna.id, dueDate: iso(-3), done: false, notes: "Hringja í Önnu vegna verðs." },
      { type: "fundur", subject: "Kynningarfundur um kaffistofu", customerId: landsvirkjun.id, contactId: siggi.id, dueDate: iso(4), done: false },
      { type: "tolvupostur", subject: "Senda samning", customerId: verkis.id, contactId: jon.id, dueDate: iso(-8), done: true },
      { type: "verkefni", subject: "Þarfagreining á staðnum", customerId: istak.id, contactId: helga.id, dueDate: iso(-1), done: false },
      { type: "simtal", subject: "Staðfesta fjölda eininga", customerId: vegagerdin.id, contactId: olafur.id, dueDate: iso(2), done: false },
      { type: "tolvupostur", subject: `Senda verðskrá ${y + 1}`, customerId: iav.id, contactId: anna.id, dueDate: iso(9), done: false },
    ],
  });

  console.log("Sái sölumarkmiðum…");
  const base: Record<string, number> = { Kalli: 4_000_000, "Gummi Gunnar": 3_500_000, Fannar: 3_000_000, Kristján: 3_000_000, Pálmi: 2_500_000 };
  for (const owner of SALESPEOPLE) {
    for (let m = 1; m <= 12; m++) {
      await prisma.salesTarget.create({ data: { owner, year: y, month: m, targetIsk: base[owner] } });
    }
  }

  console.log("Sái þjónustubeiðnum…");
  await prisma.serviceRequest.createMany({
    data: [
      { title: "Standsetning fyrir ST-102", type: "standsetning", unitId: u2.id, projectId: p1.id, status: "ny", priority: "ha", description: "Þrif og yfirferð fyrir útleigu.", assignedTo: "Þjónusta", dueDate: iso(-2) },
      { title: "Viðgerð á hurð – ST-201", type: "vidgerd", unitId: u11.id, projectId: null, status: "i_vinnslu", priority: "ha", description: "Öryggisdyr skekktar eftir flutning.", assignedTo: "Verkstæði", dueDate: iso(3) },
      { title: "Flutningur ST-109 norður", type: "flutningur", unitId: u9.id, projectId: p5.id, status: "ny", priority: "medal", description: "Keyrsla frá Akureyri á verkstað.", assignedTo: "Flutningar", dueDate: iso(8) },
      { title: "Tenging nettengingar – ST-106", type: "annad", unitId: u6.id, projectId: p3.id, status: "tilbuin", priority: "lag", description: "Beðið eftir staðfestingu viðskiptavinar.", assignedTo: "Þjónusta", dueDate: iso(1) },
      { title: "Yfirferð eftir skil – ST-105", type: "standsetning", unitId: u5.id, projectId: null, status: "i_vinnslu", priority: "medal", description: "Skilamat og myndataka.", assignedTo: "Lager", dueDate: iso(5) },
      { title: "Vetrarþjónusta – ST-104", type: "annad", unitId: u4.id, projectId: p1.id, status: "lokid", priority: "lag", description: "Hitablásari yfirfarinn.", assignedTo: "Þjónusta", dueDate: iso(-14) },
    ],
  });

  console.log("Sái samningum…");
  const c1 = await prisma.contract.create({ data: { number: `LS-${y}-014`, customerId: verkis.id, projectId: p1.id, unitIds: [u4.id], startDate: `${y}-09-01`, endDate: `${y}-12-15`, monthlyIsk: 1_180_000, status: "virkur", notes: "Verðtryggt skv. byggingarvísitölu." } });
  const c2 = await prisma.contract.create({ data: { number: `LS-${y}-021`, customerId: landsvirkjun.id, projectId: p2.id, unitIds: [u8.id], startDate: `${y}-06-01`, endDate: iso(24), monthlyIsk: 640_000, status: "rennur_ut", notes: "Framlenging í skoðun." } });
  const c3 = await prisma.contract.create({ data: { number: `LS-${y}-023`, customerId: iav.id, projectId: p3.id, unitIds: [u12.id], startDate: `${y}-08-15`, endDate: `${y}-11-30`, monthlyIsk: 890_000, status: "virkur", notes: "" } });
  await prisma.contract.create({ data: { number: `LS-${y}-027`, customerId: istak.id, projectId: p5.id, unitIds: [], startDate: `${y + 1}-01-10`, endDate: `${y + 1}-09-30`, monthlyIsk: 2_140_000, status: "drog", notes: "Bíður undirritunar." } });

  console.log("Sái tilboðum…");
  await prisma.quote.createMany({
    data: [
      { number: `T-${y}-118`, customerId: iav.id, projectId: p3.id, totalIsk: 3_200_000, validTo: iso(18), status: "sent", notes: "" },
      { number: `T-${y}-121`, customerId: istak.id, projectId: p5.id, totalIsk: 11_200_000, validTo: iso(30), status: "drog", notes: "Bíður þarfagreiningar." },
      { number: `T-${y}-115`, customerId: landsvirkjun.id, projectId: p2.id, totalIsk: 5_600_000, validTo: iso(9), status: "samthykkt", notes: "Fer í samning." },
      { number: `T-${y}-109`, customerId: vegagerdin.id, projectId: p4.id, totalIsk: 3_900_000, validTo: iso(-6), status: "hafnad", notes: "Tapaðist á verði." },
    ],
  });

  console.log("Sái verðskrá…");
  await prisma.priceItem.createMany({
    data: [
      { name: "Skrifstofueining 12–15 m²", monthlyIsk: 148_000, deliveryIsk: 95_000, minMonths: 3, note: "Rafmagnstafla og gluggar innifalið" },
      { name: "Starfsmannaeining 20–24 m²", monthlyIsk: 214_000, deliveryIsk: 120_000, minMonths: 3, note: "Með klósetti og sturtu" },
      { name: "Kaffi- og matstofa 30 m²", monthlyIsk: 289_000, deliveryIsk: 140_000, minMonths: 6, note: "Eldhúskrókur og innréttingar" },
      { name: "Stjórnstöð 36–40 m²", monthlyIsk: 356_000, deliveryIsk: 165_000, minMonths: 6, note: "Nettenging og loftkæling" },
      { name: "Geymslueining 12 m²", monthlyIsk: 96_000, deliveryIsk: 85_000, minMonths: 1, note: "Óupphituð" },
    ],
  });

  console.log("Sái viðhaldssögu…");
  await prisma.maintenanceEntry.createMany({
    data: [
      { unitId: u2.id, date: iso(-30), type: "thrif", note: "Djúphreinsun eftir skil", costIsk: 42_000, by: "Þjónusta" },
      { unitId: u2.id, date: iso(-120), type: "skodun", note: "Árleg rafmagnsúttekt", costIsk: 68_000, by: "Rafverktaki" },
      { unitId: u11.id, date: iso(-9), type: "vidgerd", note: "Öryggisdyr réttar af", costIsk: 155_000, by: "Verkstæði" },
      { unitId: u5.id, date: iso(-4), type: "skodun", note: "Skilamat eftir Kárahnjúka", costIsk: 0, by: "Lager" },
      { unitId: u6.id, date: iso(-60), type: "uppfaersla", note: "Nettenging sett upp", costIsk: 210_000, by: "Verkstæði" },
      { unitId: u4.id, date: iso(-15), type: "thrif", note: "Reglubundin þrif á staðnum", costIsk: 38_000, by: "Þjónusta" },
    ],
  });

  console.log("Sái skjölum…");
  await prisma.doc.createMany({
    data: [
      { ref: u2.id, name: "ST-102 – skilamat.pdf", kind: "PDF", size: "412 kB", date: iso(-30) },
      { ref: u2.id, name: "ST-102 – ljósmyndir að innan.zip", kind: "Myndir", size: "8,4 MB", date: iso(-29) },
      { ref: u11.id, name: "Tjónaskýrsla ST-201.pdf", kind: "PDF", size: "268 kB", date: iso(-10) },
      { ref: u4.id, name: "Afhendingarblað ST-104.pdf", kind: "PDF", size: "180 kB", date: iso(-95) },
      { ref: u6.id, name: "Teikning – innrétting.dwg", kind: "Teikning", size: "1,2 MB", date: iso(-61) },
    ],
  });

  console.log("Sái notendum…");
  await prisma.user.createMany({
    data: [
      { name: "Kalli Andrésson", email: "kalli@stolpi.is", role: "admin", active: true, lastLogin: iso(0) },
      { name: "Gummi Gunnar", email: "gummi@stolpi.is", role: "sala", active: true, lastLogin: iso(-1) },
      { name: "Fannar Þór", email: "fannar@stolpi.is", role: "sala", active: true, lastLogin: iso(-3) },
      { name: "Sigga á verkstæði", email: "sigga@stolpi.is", role: "thjonusta", active: true, lastLogin: iso(-1) },
      { name: "Bogi lagerstjóri", email: "bogi@stolpi.is", role: "lager", active: true, lastLogin: iso(-6) },
      { name: "Endurskoðun ehf.", email: "adgangur@endurskodun.is", role: "lesandi", active: false, lastLogin: iso(-58) },
    ],
  });

  console.log("Sái skemmdum…");
  await prisma.damage.createMany({
    data: [
      { unitId: u11.id, date: iso(-11), description: "Öryggisdyr skekktar og karmur beyglaður", cause: "flutningur", responsible: "Kranaþjónusta ehf.", projectId: p1.id, costIsk: 155_000, rebilled: true, status: "i_vidgerd" },
      { unitId: u5.id, date: iso(-5), description: "Gólfdúkur rifinn undir vaski", cause: "vidskiptavinur", responsible: "Verkís hf. — Jón Jónsson", projectId: p1.id, costIsk: 96_000, rebilled: true, status: "skrad" },
      { unitId: u5.id, date: iso(-40), description: "Rúða sprungin í hríð", cause: "vedur", responsible: "—", projectId: p1.id, costIsk: 74_000, rebilled: false, status: "lagfaert" },
      { unitId: u4.id, date: iso(-70), description: "Dæld í hlið eftir lyftara", cause: "starfsmadur", responsible: "Bogi lagerstjóri", projectId: null, costIsk: 48_000, rebilled: false, status: "lagfaert" },
    ],
  });

  console.log("Sái reikningum…");
  await prisma.invoice.createMany({
    data: [
      { number: `RE-${y}-0731`, customerId: verkis.id, contractNumber: c1.number, period: "Fyrri mánuður", units: 1, amountIsk: 1_180_000, status: "sendur", bcRef: "BC-INV-10442" },
      { number: `RE-${y}-0732`, customerId: landsvirkjun.id, contractNumber: c2.number, period: "Fyrri mánuður", units: 1, amountIsk: 640_000, status: "sendur", bcRef: "BC-INV-10443" },
      { number: `RE-${y}-0733`, customerId: iav.id, contractNumber: c3.number, period: "Fyrri mánuður", units: 1, amountIsk: 890_000, status: "greiddur", bcRef: "BC-INV-10444" },
    ],
  });

  console.log("Sái BC-tengingu…");
  await prisma.bcSettings.create({ data: { id: "singleton", connected: true, environment: "Production", company: "Stólpi ehf.", tenant: "9f2c1d84-…-b41a", schedule: "1. hvers mánaðar kl. 06:00", autopost: false } });
  await prisma.bcLogEntry.createMany({
    data: [
      { title: "3 leigulínur sendar í Business Central", time: "01.08.2026 06:00", status: "Sent", tone: "ok" },
      { title: "Viðskiptavinir samstilltir (5 uppfærðir)", time: "01.08.2026 06:00", status: "Í lagi", tone: "ok" },
      { title: "Reikningur RE-2026-0731 bókaður í BC", time: "01.08.2026 06:02", status: "BC-INV-10442", tone: "info" },
      { title: "Kennitala vantaði á 1 viðskiptavin — sleppt", time: "01.07.2026 06:00", status: "Aðvörun", tone: "warn" },
    ],
  });

  console.log("Sáning kláruð.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
