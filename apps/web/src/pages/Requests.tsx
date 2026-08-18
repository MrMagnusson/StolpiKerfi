import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlueprintButton, Tag } from "@stolpi/ui";
import { REQ_STATUS, REQ_TYPE, PRIORITY, norm, type ServiceRequest, type Unit, type ReqStatus } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useList } from "../api.js";

const COLUMNS: ReqStatus[] = ["ny", "i_vinnslu", "tilbuin", "lokid"];

export function Requests() {
  const { data: requests = [], isLoading } = useList<ServiceRequest>("requests");
  const { data: units = [] } = useList<Unit>("units");
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const uCodes = (ids: string[]) => ids.map((id) => units.find((u) => u.id === id)?.code).filter(Boolean).join(", ") || "—";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        kicker="Þjónusta"
        title="Beiðnir"
        note="Standsetning, viðgerðir og flutningar."
        search={{ value: q, onChange: setQ }}
        primary={{ label: "Ný beiðni", onClick: () => nav("/detail/requests/new") }}
      />
      <div style={{ padding: "26px 28px 64px" }}>
        {isLoading ? (
          <div style={{ opacity: 0.6 }}>Hleð…</div>
        ) : (
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }}>
            {COLUMNS.map((st) => {
              const items = requests.filter((r) => r.status === st && (!q || norm(r.title).includes(norm(q))));
              return (
                <div key={st} style={{ width: 266, flex: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid var(--color-text)", paddingBottom: 6 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, letterSpacing: ".04em", textTransform: "uppercase" }}>{REQ_STATUS[st].label}</span>
                    <span style={{ fontSize: 11, opacity: 0.55 }}>{items.length}</span>
                  </div>
                  {items.map((r) => {
                    const overdue = r.dueDate && r.dueDate < today && st !== "lokid";
                    return (
                      <BlueprintButton key={r.id} onClick={() => nav(`/detail/requests/${r.id}`)} style={{ padding: "12px 13px", display: "flex", flexDirection: "column", gap: 7 }}>
                        <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 14, lineHeight: 1.25 }}>{r.title}</span>
                          <Tag tone={r.priority === "ha" ? "bad" : r.priority === "medal" ? "warn" : "neutral"}>{PRIORITY[r.priority]}</Tag>
                        </span>
                        <span style={{ fontSize: 12, opacity: 0.65 }}>{REQ_TYPE[r.type]} · {uCodes(r.unitIds)} · {r.assignedTo ?? "—"}</span>
                        <span style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.55 }}>
                          {r.dueDate ? `Skiladagur ${r.dueDate}${overdue ? " · yfir tíma" : ""}` : "Enginn skiladagur"}
                        </span>
                      </BlueprintButton>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
