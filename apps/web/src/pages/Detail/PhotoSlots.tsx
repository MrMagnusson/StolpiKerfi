// Ported from the unit detail page's "Ástandsmyndir" panel, Stólpi Kerfi.dc.html lines 888-927 —
// 4 photo slots (við móttöku / eftir standsetningu / nærmynd af skemmd / núverandi ástand). The
// prototype used a bundled <image-slot> custom element; here each slot is a plain upload + preview
// wired to POST /api/uploads via downscaleAndUpload, with the URL saved onto the Unit record.
// Extended with: a "forsíðumynd" (cover photo) pick shown on the Einingar list cards, and a
// click-to-open lightbox that steps through whichever slots are populated.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlueprintBox, Btn } from "@stolpi/ui";
import type { Unit } from "@stolpi/shared";
import { downscaleAndUpload } from "../../photo.js";
import { PhotoLightbox, type LightboxImage } from "./PhotoLightbox.js";

const SLOTS: { key: keyof Pick<Unit, "photoMottaka" | "photoStandsett" | "photoSkemmd" | "photoAstand">; label: string }[] = [
  { key: "photoMottaka", label: "Við móttöku" },
  { key: "photoStandsett", label: "Eftir standsetningu" },
  { key: "photoSkemmd", label: "Skemmd — nærmynd" },
  { key: "photoAstand", label: "Núverandi ástand" },
];

function Slot({
  label,
  url,
  busy,
  isCover,
  onFile,
  onRemove,
  onOpen,
  onSetCover,
}: {
  label: string;
  url: string | null;
  busy: boolean;
  isCover: boolean;
  onFile: (f: File) => void;
  onRemove: () => void;
  onOpen: () => void;
  onSetCover: () => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.6 }}>{label}</div>
        {url ? (
          <button
            onClick={onSetCover}
            title={isCover ? "Þetta er forsíðumyndin" : "Nota sem forsíðumynd"}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontSize: 14, color: isCover ? "var(--color-accent)" : "var(--color-neutral-500)" }}
          >
            {isCover ? "★ Forsíðumynd" : "☆ Velja sem forsíðu"}
          </button>
        ) : null}
      </div>
      <div className="blueprint duotone" style={{ height: 150, position: "relative", overflow: "hidden" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        {url ? (
          <>
            <button
              onClick={onOpen}
              style={{ width: "100%", height: "100%", border: 0, padding: 0, background: "none", cursor: "zoom-in", display: "block" }}
              aria-label={`Skoða mynd: ${label}`}
            >
              <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
      // First photo uploaded on a unit with no cover yet becomes the cover automatically.
      if (!unit.coverPhotoUrl) onSave("coverPhotoUrl", url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyField(null);
    }
  };

  const handleRemove = (field: string, url: string | null) => {
    onSave(field, null);
    if (url && unit.coverPhotoUrl === url) onSave("coverPhotoUrl", null);
  };

  const populated: LightboxImage[] = SLOTS.filter((s) => unit[s.key]).map((s) => ({ label: s.label, url: unit[s.key] as string }));

  return (
    <BlueprintBox style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <h2 style={{ fontSize: 19, margin: 0 }}>Ástandsmyndir</h2>
        <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.5 }}>Móttaka og standsetning</span>
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
              isCover={!!url && url === unit.coverPhotoUrl}
              onFile={(f) => handleFile(s.key, f)}
              onRemove={() => handleRemove(s.key, url)}
              onOpen={() => setLightboxIndex(populated.findIndex((p) => p.url === url))}
              onSetCover={() => onSave("coverPhotoUrl", url)}
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
