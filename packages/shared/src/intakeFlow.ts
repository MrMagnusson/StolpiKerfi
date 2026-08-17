// Vettvangur mobile intake flow — ported verbatim from Stólpi Vettvangur.dc.html
// (STEPS/CHECKS constants, lines 189-215). Single source of truth for both the
// mobile app's gating UI and the API's completion endpoint.

export interface IntakeStepDef {
  key: "mottaka" | "astand" | "standsetning" | "tilbuin";
  label: string;
  title: string;
  intro: string;
}

export const INTAKE_STEPS: IntakeStepDef[] = [
  { key: "mottaka", label: "Móttaka", title: "Móttaka einingar", intro: "Staðfestu að rétt eining sé komin á lager og taktu yfirlitsmynd við komu áður en hún er tekin úr flutningi." },
  { key: "astand", label: "Ástand", title: "Ástandsmat", intro: "Farðu yfir alla liði. Sé eitthvað ekki í lagi þarf mynd af skemmdinni og hver olli henni áður en hægt er að halda áfram." },
  { key: "standsetning", label: "Standsetning", title: "Standsetning", intro: "Skráðu unna verkþætti og taktu mynd af einingunni eftir að standsetningu er lokið." },
  { key: "tilbuin", label: "Tilbúin", title: "Tilbúin til leigu", intro: "Lokastaðfesting. Tvær myndir af núverandi ástandi — að innan og að utan — eru skilyrði fyrir því að eining fari í útleigu." },
];

export interface IntakeCheckDef {
  key: string;
  label: string;
  note: string;
}

export const INTAKE_CHECKS: Record<IntakeStepDef["key"], IntakeCheckDef[]> = {
  mottaka: [
    { key: "kodi", label: "Einingakóði staðfestur", note: "Bornar saman merking og flutningsskjal" },
    { key: "komin", label: "Eining komin á lager", note: "Affermd og staðsett" },
  ],
  astand: [
    { key: "gólf", label: "Gólf og innrétting", note: "Slit, raki, dældir" },
    { key: "hurðir", label: "Hurðir og gluggar", note: "Læsingar og þéttilistar" },
    { key: "lagnir", label: "Lagnir og hreinlætistæki", note: "Leki, stíflur, þrýstingur" },
    { key: "rafmagn", label: "Rafmagn og hiti", note: "Tafla, blásari, lýsing" },
  ],
  standsetning: [
    { key: "thrif", label: "Þrif kláruð", note: "Innra rými og gluggar" },
    { key: "vidgerd", label: "Viðgerðir kláraðar", note: "Skv. ástandsmati" },
    { key: "bunadur", label: "Búnaður yfirfarinn", note: "Skráður búnaður til staðar og virkur" },
  ],
  tilbuin: [
    { key: "merking", label: "Merking og lyklar á sínum stað", note: "" },
    { key: "skraning", label: "Ástandsskrá uppfærð", note: "Skemmdir og kostnaður skráður" },
  ],
};

export type CheckMark = "ok" | "issue" | null;

/** Per-step required photo groups, keyed by whether the "ástand" step has any issue flagged. */
export const INTAKE_PHOTO_MIN: Record<string, number> = {
  koma: 1,
  skemmd: 1,
  standsett: 1,
  astand_inni: 1,
  astand_uti: 1,
};

/** Human labels for the intake report's photo groups — shared between the writer (Vettvangur's
 * JobFlow, which tags each upload) and the reader (the desktop request detail page). */
export const INTAKE_PHOTO_GROUP_LABELS: Record<string, string> = {
  koma: "Við komu",
  standsett: "Eftir standsetningu",
  astand_inni: "Núverandi ástand — að innan",
  astand_uti: "Núverandi ástand — að utan",
  yfirlit: "Yfirlitsmynd",
};

const INTAKE_PHOTO_SEP = "::";

/** Tags an uploaded photo URL with its group so ServiceRequest.photos (a flat string[]) can be
 * grouped back into a labeled gallery — see parseIntakePhotos. */
export function formatIntakePhoto(group: string, url: string): string {
  return `${group}${INTAKE_PHOTO_SEP}${url}`;
}

export interface IntakePhoto {
  group: string;
  label: string;
  url: string;
}

export function parseIntakePhotos(entries: string[]): IntakePhoto[] {
  return entries.map((e) => {
    const idx = e.indexOf(INTAKE_PHOTO_SEP);
    const group = idx >= 0 ? e.slice(0, idx) : "";
    const url = idx >= 0 ? e.slice(idx + INTAKE_PHOTO_SEP.length) : e;
    return { group, label: INTAKE_PHOTO_GROUP_LABELS[group] || "Mynd", url };
  });
}
