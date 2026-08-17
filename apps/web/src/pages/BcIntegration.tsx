// Ported from the "BC-tenging" section, Stólpi Kerfi.dc.html lines 749-806.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Btn, BlueprintBox, Field, Input, Select, Tag } from "@stolpi/ui";
import { PageHeader } from "../layout/PageHeader.js";
import { request } from "../api.js";

const SCHEDULES = ["1. hvers mánaðar kl. 06:00", "Daglega kl. 06:00", "Vikulega — mánudaga", "Handvirkt"];

const BC_MAPPING = [
  { from: "Viðskiptavinur + kennitala", to: "Customer No." },
  { from: "Reikningsnúmer", to: "Document No." },
  { from: "Leiga á einingum + tímabil", to: "Line Description" },
  { from: "Fjöldi eininga / mánaðarverð", to: "Quantity / Unit Price" },
  { from: "Samningsnúmer", to: "Shortcut Dimension 1" },
];

export function BcIntegration() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["bc-settings"], queryFn: () => request<any>("/bc/settings") });
  const { data: log = [] } = useQuery({ queryKey: ["bc-log"], queryFn: () => request<any[]>("/bc/log") });

  const setField = async (key: string, value: unknown) => {
    if (!settings) return;
    try {
      await request("/bc/settings", { method: "PUT", body: JSON.stringify({ ...settings, [key]: value }) });
      qc.invalidateQueries({ queryKey: ["bc-settings"] });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const test = async () => {
    try {
      await request("/bc/test", { method: "POST" });
      qc.invalidateQueries({ queryKey: ["bc-log"] });
    } catch (e) {
      alert((e as Error).message);
    }
  };
  const sync = async () => {
    try {
      await request("/bc/sync", { method: "POST" });
      qc.invalidateQueries({ queryKey: ["bc-log"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (!settings) {
    return (
      <>
        <PageHeader kicker="Kerfi" title="Business Central tenging" note="Sjálfvirk sendinng leigulína í BC — stöðuvakt, áætlun og reitakortlagning." />
        <div style={{ padding: 28, opacity: 0.6 }}>Hleð…</div>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Kerfi" title="Business Central tenging" note="Sjálfvirk sendinng leigulína í BC — stöðuvakt, áætlun og reitakortlagning." />
      <div style={{ padding: "26px 28px 64px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 24, alignItems: "start" }}>
        <BlueprintBox style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 15, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ fontSize: 21, margin: 0 }}>Business Central</h2>
            <Tag tone={settings.connected === false ? "bad" : "ok"}>{settings.connected === false ? "Ótengt" : "Tengt"}</Tag>
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.65, lineHeight: 1.4 }}>
            Sjálfvirk tenging um OAuth 2.0 við BC API v2.0. Leigulínur eru sendar sem Sales Invoice á þar til gerðri áætlun — engin handvirk CSV-keyrsla.
          </div>
          <Field label="Environment">
            <Input value={settings.environment} onChange={(e) => setField("environment", e.target.value)} />
          </Field>
          <Field label="Félag (Company)">
            <Input value={settings.company} onChange={(e) => setField("company", e.target.value)} />
          </Field>
          <Field label="Tenant ID">
            <Input value={settings.tenant} onChange={(e) => setField("tenant", e.target.value)} />
          </Field>
          <Field label="Keyrsla">
            <Select value={settings.schedule} options={SCHEDULES.map((s) => ({ value: s, label: s }))} onChange={(e) => setField("schedule", e.target.value)} />
          </Field>
          <Field label="Bóka reikninga sjálfkrafa í BC">
            <Btn variant="secondary" onClick={() => setField("autopost", !settings.autopost)} style={{ alignSelf: "flex-start" }}>
              {settings.autopost ? "Já — bókaðir sjálfkrafa" : "Nei — sendir sem drög"}
            </Btn>
          </Field>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 6 }}>
            <Btn variant="secondary" onClick={test}>Prófa tengingu</Btn>
            <Btn variant="primary" onClick={sync}>Samstilla núna</Btn>
          </div>
        </BlueprintBox>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <BlueprintBox style={{ padding: "18px 20px" }}>
            <h2 style={{ fontSize: 19, margin: "0 0 6px" }}>Samstillingarsaga</h2>
            {log.map((l: any) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "9px 0", borderTop: "1px solid var(--color-divider)" }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5 }}>{l.title}</span>
                  <span style={{ display: "block", fontSize: 12, opacity: 0.6 }}>{l.time}</span>
                </span>
                <Tag tone={l.tone}>{l.status}</Tag>
              </div>
            ))}
          </BlueprintBox>
          <BlueprintBox style={{ padding: "18px 20px" }}>
            <h2 style={{ fontSize: 19, margin: "0 0 6px" }}>Reitakortlagning</h2>
            {BC_MAPPING.map((m) => (
              <div key={m.from} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "8px 0", borderTop: "1px solid var(--color-divider)", fontSize: 13 }}>
                <span style={{ opacity: 0.7 }}>{m.from}</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>→ {m.to}</span>
              </div>
            ))}
          </BlueprintBox>
        </div>
      </div>
    </>
  );
}
