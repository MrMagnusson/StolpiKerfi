import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlueprintButton, FilterPill, Tag } from "@stolpi/ui";
import { UNIT_STATUS, norm, type Unit, type UnitStatus } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useList } from "../api.js";

export function Units() {
  const { data: units = [], isLoading } = useList<Unit>("units");
  const { data: customers = [] } = useList<{ id: string; name: string }>("customers");
  const [filter, setFilter] = useState<"all" | UnitStatus>("all");
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "Óráðstafað";

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const k of Object.keys(UNIT_STATUS)) c[k] = units.filter((u) => u.status === k).length;
    return c;
  }, [units]);

  const filtered = units.filter((u) => {
    if (filter !== "all" && u.status !== filter) return false;
    if (q && !norm(`${u.code} ${u.location} ${(u.equipment || []).join(" ")}`).includes(norm(q))) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        kicker="Birgðir"
        title="Einingar"
        note="Allur flotinn með stöðu, búnaði og staðsetningu."
        search={{ value: q, onChange: setQ }}
        primary={{ label: "Ný eining", onClick: () => nav("/detail/units/new") }}
      />
      <div style={{ padding: "26px 28px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <FilterPill label="Allar" count={units.length} active={filter === "all"} onClick={() => setFilter("all")} />
          {(Object.keys(UNIT_STATUS) as UnitStatus[]).map((k) => (
            <FilterPill key={k} label={UNIT_STATUS[k].label} count={counts[k]} active={filter === k} onClick={() => setFilter(k)} />
          ))}
        </div>

        {isLoading ? (
          <div style={{ opacity: 0.6 }}>Hleð…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(266px, 1fr))", gap: 22 }}>
            {filtered.map((u) => (
              <BlueprintButton key={u.id} onClick={() => nav(`/detail/units/${u.id}`)} style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    height: 110,
                    borderBottom: "1px solid var(--color-divider)",
                    position: "relative",
                    overflow: "hidden",
                    background: u.coverPhotoUrl
                      ? "var(--color-neutral-200)"
                      : "repeating-linear-gradient(45deg, transparent, transparent 7px, var(--color-neutral-200) 7px, var(--color-neutral-200) 8px)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {u.coverPhotoUrl ? (
                    <img src={u.coverPhotoUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : null}
                  <div style={{ position: "relative", border: "1px solid var(--color-accent-600)", background: "var(--color-bg)", padding: "8px 18px", fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1, color: "var(--color-accent-800)" }}>
                    {u.sizeM2} m²
                  </div>
                  <span style={{ position: "absolute", left: 10, top: 9, fontSize: 11, letterSpacing: ".14em", opacity: 0.6, color: u.coverPhotoUrl ? "var(--color-bg)" : undefined, textShadow: u.coverPhotoUrl ? "0 1px 3px rgba(0,0,0,.6)" : undefined }}>
                    {u.location}
                  </span>
                </div>
                <div style={{ padding: "13px 15px 15px", display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 20, lineHeight: 1, letterSpacing: ".03em" }}>{u.code}</span>
                    <Tag tone={UNIT_STATUS[u.status].tone}>{UNIT_STATUS[u.status].label}</Tag>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {u.hasToilet ? "Með klósetti" : "Án klósetts"} · {cName(u.customerId)}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {(u.equipment || []).slice(0, 4).map((e) => (
                      <span key={e} className="tag tag-neutral">{e}</span>
                    ))}
                  </div>
                </div>
              </BlueprintButton>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
