// Full-size photo viewer for the unit detail page's Ástandsmyndir slots — click a photo to open it,
// arrow keys / on-screen buttons step through the other populated slots without closing.
import { useEffect } from "react";

export interface LightboxImage {
  label: string;
  url: string;
}

export function PhotoLightbox({ images, index, onClose, onNavigate }: { images: LightboxImage[]; index: number; onClose: () => void; onNavigate: (i: number) => void }) {
  const current = images[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNavigate]);

  if (!current) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "color-mix(in srgb, var(--color-neutral-900) 85%, transparent)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div style={{ position: "absolute", top: 18, left: 24, right: 24, display: "flex", justifyContent: "space-between", alignItems: "baseline", color: "var(--color-bg)" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>{current.label}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {index + 1} / {images.length}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{ position: "absolute", top: 14, right: 24, width: 36, height: 36, border: "1px solid var(--color-bg)", background: "transparent", color: "var(--color-bg)", cursor: "pointer", fontSize: 16 }}
      >
        ✕
      </button>

      {images.length > 1 ? (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + images.length) % images.length);
            }}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, border: "1px solid var(--color-bg)", background: "transparent", color: "var(--color-bg)", cursor: "pointer", fontSize: 20 }}
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % images.length);
            }}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, border: "1px solid var(--color-bg)", background: "transparent", color: "var(--color-bg)", cursor: "pointer", fontSize: 20 }}
          >
            ›
          </button>
        </>
      ) : null}

      <img
        src={current.url}
        alt={current.label}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "min(90vw, 900px)", maxHeight: "80vh", objectFit: "contain", border: "1px solid var(--color-bg)" }}
      />
    </div>
  );
}
