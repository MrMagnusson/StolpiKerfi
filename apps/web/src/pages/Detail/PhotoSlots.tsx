// Unit detail page's condition photos — deliberately just 2 slots (að utan / að innan) showing the
// unit's CURRENT state, not a process history: salespeople looking at a unit need to see what it
// looks like right now, not what it looked like mid-refurbishment. The full step-by-step record
// (móttaka/standsetning/skemmd photos) lives on the intake request itself — see its "Myndir úr
// móttöku" gallery, reachable from this unit's "Beiðnir" panel. These 2 fields are filled
// automatically when the Vettvangur intake flow reaches "Tilbúin" (astand_uti/astand_inni), or can
// be set by hand here for a unit that's been received but isn't fully processed yet.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlueprintBox, Btn } from "@stolpi/ui";
import type { Unit } from "@stolpi/shared";
import { downscaleAndUpload } from "../../photo.js";
import { PhotoLightbox, type LightboxImage } from "./PhotoLightbox.js";

const SLOTS: { key: keyof Pick<Unit, "photoUti" | "photoInni">; label: string }[] = [
  { key: "photoUti", label: "Að utan" },
  { key: "photoInni", label: "Að innan" },
];

function Slot({
  label,
  url,
  busy,
  onFile,
  onRemove,
  onOpen,
}: {
  label: string;
  url: string | null;
  busy: boolean;
  onFile: (f: File) => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.6, marginBottom: 6 }}>{label}</div>
      <div style={{ height: 150, position: "relative", overflow: "hidden", background: "var(--color-neutral-200)", border: url ? undefined : "1px dashed var(--color-divider)" }}>
        {url ? (
          <>
            <button
              onClick={onOpen}
              style={{ width: "100%", height: "100%", border: 0, padding: 0, background: "none", cursor: "zoom-in", display: "block" }}
              aria-label={`Skoða mynd: ${label}`}
            >
              <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
            </button>
            <button
              onClick={onRemove}
              disabled={busy}
              style={{ position: "absolute", right: 4, top: 4, zIndex: 3, width: 26, height: 26, border: "1px solid var(--color-divider)", background: "var(--color-bg)", cursor: "pointer", font: "inherit", fontSize: 13, lineHeight: 1, padding: 0 }}
            >
              ✕
            </button>
          </>
        ) : (
          <label style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: busy ? "wait" : "pointer", color: "var(--color-accent-800)", opacity: busy ? 0.5 : 1 }}>
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
              style={{ display: "none" }}
            />
            <span style={{ fontSize: 22, lineHeight: 1 }}>{busy ? "…" : "＋"}</span>
            <span style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase" }}>{busy ? "Hleð upp…" : "Hlaða upp mynd"}</span>
          </label>
        )}
      </div>
    </div>
  );
}

export function PhotoSlots({ unit, onSave }: { unit: Unit; onSave: (field: string, url: string | null) => void }) {
  const [busyField, setBusyField] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const nav = useNavigate();

  const handleFile = async (field: string, file: File) => {
    setBusyField(field);
    try {
      const url = await downscaleAndUpload(file);
      onSave(field, url);
      // Forsíðumyndin fylgir alltaf mynd að utan.
      if (field === "photoUti") onSave("coverPhotoUrl", url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyField(null);
    }
  };

  const handleRemove = (field: string) => {
    onSave(field, null);
    if (field === "photoUti") onSave("coverPhotoUrl", null);
  };

  const populated: LightboxImage[] = SLOTS.filter((s) => unit[s.key]).map((s) => ({ label: s.label, url: unit[s.key] as string }));

  return (
    <BlueprintBox style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <h2 style={{ fontSize: 19, margin: 0 }}>Núverandi ástand</h2>
        <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.5 }}>Að utan og innan</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {SLOTS.map((s) => {
          const url = unit[s.key];
          return (
            <Slot
              key={s.key}
              label={s.label}
              url={url}
              busy={busyField === s.key}
              onFile={(f) => handleFile(s.key, f)}
              onRemove={() => handleRemove(s.key)}
              onOpen={() => setLightboxIndex(populated.findIndex((p) => p.url === url))}
            />
          );
        })}
      </div>
      <Btn variant="secondary" onClick={() => nav(`/detail/damages/new?unitId=${unit.id}`)} style={{ width: "100%", marginTop: 14 }}>
        + Skrá skemmd á þessa einingu
      </Btn>

      {lightboxIndex !== null ? (
        <PhotoLightbox images={populated} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      ) : null}
    </BlueprintBox>
  );
}
