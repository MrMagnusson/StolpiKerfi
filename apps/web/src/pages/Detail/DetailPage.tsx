import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Btn, Field, Input, Select, Textarea, Chip, BlueprintBox } from "@stolpi/ui";
import { norm, parseIntakePhotos, type Unit } from "@stolpi/shared";
import { fieldConfig, KIND_KICKER, KIND_DEFAULTS, type SelectOpt } from "./fieldConfig.js";
import { buildPanels } from "./panels.js";
import { PhotoSlots } from "./PhotoSlots.js";
import { PhotoLightbox, type LightboxImage } from "./PhotoLightbox.js";
import { useCreate, useItem, useList, useRemove, useUpdate } from "../../api.js";
import { PageHeader } from "../../layout/PageHeader.js";

/** Chip-toggle field with a search box once the option list gets long (e.g. picking units out of a
 * large fleet) — plain flex-wrap chips alone don't scale past a dozen or so options. */
function ChipsField({ label, options, value, onChange }: { label: string; options: SelectOpt[]; value: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState("");
  const filtered = query ? options.filter((o) => norm(o.label).includes(norm(query))) : options;
  return (
    <Field label={label}>
      {options.length > 8 ? (
        <Input style={{ marginBottom: 8 }} placeholder="Leita…" value={query} onChange={(e) => setQuery(e.target.value)} />
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {filtered.map((o) => {
          const on = value.includes(o.value);
          return (
            <Chip key={o.value} label={o.label} active={on} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])} />
          );
        })}
        {filtered.length === 0 ? <span style={{ fontSize: 12.5, opacity: 0.6 }}>Ekkert fannst.</span> : null}
      </div>
    </Field>
  );
}

export function DetailPage({ isNew }: { isNew: boolean }) {
  const { kind = "", id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();

  const { data: existing } = useItem<any>(kind, isNew ? undefined : id);
  const { data: customers = [] } = useList<{ id: string; name: string }>("customers");
  const { data: projects = [] } = useList<any>("projects");
  const { data: units = [] } = useList<any>("units");
  const { data: contacts = [] } = useList<any>("contacts");
  const { data: damages = [] } = useList<any>("damages");
  const { data: maintenance = [] } = useList<any>("maintenance");
  const { data: requests = [] } = useList<any>("requests");
  const { data: docs = [] } = useList<any>("docs");
  const { data: contracts = [] } = useList<any>("contracts");
  const { data: deals = [] } = useList<any>("deals");
  const { data: activities = [] } = useList<any>("activities");

  const create = useCreate<any>(kind);
  const update = useUpdate<any>(kind);
  const remove = useRemove(kind);

  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isNew) {
      const defaults: Record<string, unknown> = { ...(KIND_DEFAULTS[kind] || {}) };
      if (kind === "damages" && params.get("unitId")) defaults.unitId = params.get("unitId");
      setDraft(defaults);
    } else if (existing) {
      setDraft(existing);
    }
  }, [isNew, existing, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!draft) return <div style={{ padding: 28, opacity: 0.6 }}>Hleð…</div>;

  const setField = (key: string, value: unknown) => setDraft((d) => ({ ...(d as object), [key]: value }));
  const fields = fieldConfig(kind, { customers, projects, units, contacts, contracts });

  const save = async () => {
    try {
      if (isNew) {
        const created = await create.mutateAsync(draft);
        nav(`/detail/${kind}/${(created as any).id}`);
      } else if (id) {
        await update.mutateAsync({ id, data: draft });
      }
    } catch {
      // the QueryClient's default mutation onError already alerted the user
    }
  };
  const savePhoto = async (field: string, url: string | null) => {
    setField(field, url);
    if (!id) return;
    try {
      await update.mutateAsync({ id, data: { [field]: url } });
    } catch {
      // the QueryClient's default mutation onError already alerted the user
    }
  };
  const del = async () => {
    if (!id) return;
    if (!confirm(`Eyða ${title}? Þessu er ekki hægt að breyta til baka.`)) return;
    try {
      await remove.mutateAsync(id);
      nav(-1 as any);
    } catch {
      // the QueryClient's default mutation onError already alerted the user
    }
  };

  const kicker = KIND_KICKER[kind] || kind;
  const title = (draft as any).code || (draft as any).name || (draft as any).title || (draft as any).subject || (draft as any).number || (draft as any).description || `Nýtt — ${kicker}`;
  const panels = isNew ? [] : buildPanels(kind, draft, { units, projects, damages, maintenance, requests, docs, contracts, deals, activities, contacts });

  const galleryTitle = kind === "requests" ? "Myndir úr móttöku" : kind === "damages" ? "Myndir af skemmd" : null;
  const galleryImages: LightboxImage[] =
    kind === "requests"
      ? parseIntakePhotos(((draft as any).photos as string[]) || []).map((p) => ({ label: p.label, url: p.url }))
      : kind === "damages"
        ? (((draft as any).photos as string[]) || []).map((url) => ({ label: "Mynd af skemmd", url }))
        : [];

  return (
    <>
      <PageHeader
        kicker={isNew ? `Ný skráning · ${kicker}` : `${kicker} · Smáatriði`}
        title={title}
        note={isNew ? "Fylltu út reitina og vistaðu — skráningin birtist strax í yfirlitinu." : "Breytingar vistast þegar þú smellir á Vista."}
        extra={<Btn variant="secondary" onClick={() => nav(-1 as any)}>← Til baka</Btn>}
        primary={{ label: "Vista", onClick: save }}
      />
      <div style={{ padding: "26px 28px 64px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 26, alignItems: "start" }}>
        <BlueprintBox style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 15, minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", opacity: 0.5 }}>Skráning</div>
          {fields.map((f) => {
            const v = (draft as any)[f.key];
            if (f.type === "select") {
              return (
                <Field key={f.key} label={f.label}>
                  <Select value={(v ?? "") as string} options={f.options || []} onChange={(e) => setField(f.key, e.target.value)} />
                </Field>
              );
            }
            if (f.type === "textarea") {
              return (
                <Field key={f.key} label={f.label}>
                  <Textarea value={(v ?? "") as string} onChange={(e) => setField(f.key, e.target.value)} />
                </Field>
              );
            }
            if (f.type === "toggle") {
              return (
                <Field key={f.key} label={f.label}>
                  <Btn variant="secondary" onClick={() => setField(f.key, !v)} style={{ alignSelf: "flex-start" }}>
                    {v ? "Já" : "Nei"}
                  </Btn>
                </Field>
              );
            }
            if (f.type === "chips") {
              const list: string[] = Array.isArray(v) ? v : [];
              return (
                <ChipsField key={f.key} label={f.label} options={f.options || []} value={list} onChange={(next) => setField(f.key, next)} />
              );
            }
            return (
              <Field key={f.key} label={f.label}>
                <Input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={(v ?? "") as string | number}
                  onChange={(e) => setField(f.key, f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
                />
              </Field>
            );
          })}
          {!isNew ? (
            <Btn variant="secondary" onClick={del} style={{ alignSelf: "flex-start", color: "#8f4038" }}>
              Eyða
            </Btn>
          ) : null}
        </BlueprintBox>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          {panels.map((p) => (
            <BlueprintBox key={p.title} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 19, margin: 0 }}>{p.title}</h2>
                <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.5 }}>{p.hint}</span>
              </div>
              {p.rows.map((r, i) => {
                const rowInner = (
                  <>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5 }}>{r.label}</span>
                      <span style={{ display: "block", fontSize: 12, opacity: 0.6 }}>{r.note}</span>
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 15, whiteSpace: "nowrap" }}>{r.value}</span>
                  </>
                );
                return r.to ? (
                  <button
                    key={i}
                    onClick={() => nav(r.to!)}
                    style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, padding: "9px 0", borderTop: "1px solid var(--color-divider)", width: "100%", background: "none", border: 0, borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "var(--color-divider)", textAlign: "left", font: "inherit", color: "inherit", cursor: "pointer" }}
                  >
                    {rowInner}
                  </button>
                ) : (
                  <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, padding: "9px 0", borderTop: "1px solid var(--color-divider)" }}>
                    {rowInner}
                  </div>
                );
              })}
              {p.isEmpty ? <div style={{ border: "1px dashed var(--color-divider)", padding: 16, textAlign: "center", fontSize: 12.5, opacity: 0.6, marginTop: 8 }}>{p.emptyText}</div> : null}
            </BlueprintBox>
          ))}
          {galleryTitle && galleryImages.length ? (
            <BlueprintBox style={{ padding: "18px 20px" }}>
              <h2 style={{ fontSize: 19, margin: "0 0 10px" }}>{galleryTitle}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                {galleryImages.map((img, i) => (
                  <button key={i} onClick={() => setLightboxIndex(i)} style={{ padding: 0, border: 0, background: "none", cursor: "zoom-in", display: "flex", flexDirection: "column", gap: 4, font: "inherit" }}>
                    <div style={{ height: 84, background: "var(--color-neutral-200)", overflow: "hidden" }}>
                      <img src={img.url} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                    <span style={{ fontSize: 10.5, opacity: 0.65 }}>{img.label}</span>
                  </button>
                ))}
              </div>
            </BlueprintBox>
          ) : null}
          {kind === "units" && !isNew ? <PhotoSlots unit={draft as unknown as Unit} onSave={savePhoto} /> : null}
        </div>
      </div>
      {lightboxIndex !== null ? (
        <PhotoLightbox images={galleryImages} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      ) : null}
    </>
  );
}
