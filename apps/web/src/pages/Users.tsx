// Ported from the "notendur & réttindi" section, Stólpi Kerfi.dc.html lines 612-668.
import { useNavigate } from "react-router-dom";
import { BlueprintBox, DataTable, Tag, type Column } from "@stolpi/ui";
import { PERMS, ROLES, ROLE_MATRIX, type Role, type User } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useList } from "../api.js";

export function Users() {
  const { data: users = [], isLoading } = useList<User>("users");
  const nav = useNavigate();

  const columns: Column<User>[] = [
    { header: "Notandi", render: (u) => u.name },
    { header: "Netfang", render: (u) => <span style={{ opacity: 0.7 }}>{u.email}</span> },
    { header: "Hlutverk", render: (u) => <span className="tag tag-accent">{ROLES[u.role]}</span> },
    { header: "Síðast inn", render: (u) => <span style={{ opacity: 0.7 }}>{u.lastLogin ?? "—"}</span> },
    { header: "Staða", render: (u) => <Tag tone={u.active ? "ok" : "neutral"}>{u.active ? "Virkur" : "Óvirkur"}</Tag> },
    { header: "", align: "right", render: (u) => <button className="btn btn-ghost" onClick={() => nav(`/detail/users/${u.id}`)}>Opna</button> },
  ];

  return (
    <>
      <PageHeader kicker="Kerfi" title="Notendur & réttindi" note="Hverjir hafa aðgang og að hverju." primary={{ label: "Nýr notandi", onClick: () => nav("/detail/users/new") }} />
      <div style={{ padding: "26px 28px 64px", display: "flex", flexDirection: "column", gap: 24 }}>
        {isLoading ? <div style={{ opacity: 0.6 }}>Hleð…</div> : <DataTable columns={columns} rows={users} emptyText="Engir notendur skráðir." />}

        <BlueprintBox style={{ padding: "18px 20px", overflowX: "auto" }}>
          <h2 style={{ fontSize: 20, margin: "0 0 4px" }}>Réttindi eftir hlutverki</h2>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>● full réttindi · ◐ lesa · — enginn aðgangur</div>
          <table className="table">
            <thead>
              <tr>
                <th>Hlutverk</th>
                {PERMS.map((p) => (
                  <th key={p} style={{ textAlign: "center" }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(ROLES) as Role[]).map((k) => (
                <tr key={k}>
                  <td>{ROLES[k]}</td>
                  {ROLE_MATRIX[k].map((v, i) => (
                    <td key={i} style={{ textAlign: "center", color: v === 2 ? "var(--color-accent-800)" : v === 1 ? "var(--color-accent-500)" : "var(--color-neutral-400)" }}>
                      {v === 2 ? "●" : v === 1 ? "◐" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </BlueprintBox>
      </div>
    </>
  );
}
