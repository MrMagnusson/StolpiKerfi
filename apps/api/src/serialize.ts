// SQLite has no native array type — a handful of fields (equipment, unitIds,
// requiredEquipment) are stored as JSON strings in Prisma and need to be
// parsed/stringified at the API boundary so JSON clients see real arrays.

const JSON_ARRAY_FIELDS: Record<string, string[]> = {
  units: ["equipment"],
  projects: ["requiredEquipment"],
  contracts: ["unitIds"],
};

export function outbound(kind: string, row: Record<string, unknown>): Record<string, unknown> {
  const fields = JSON_ARRAY_FIELDS[kind];
  if (!fields) return row;
  const copy = { ...row };
  for (const f of fields) {
    if (typeof copy[f] === "string") {
      try {
        copy[f] = JSON.parse(copy[f] as string);
      } catch {
        copy[f] = [];
      }
    }
  }
  return copy;
}

export function inbound(kind: string, body: Record<string, unknown>): Record<string, unknown> {
  const fields = JSON_ARRAY_FIELDS[kind];
  if (!fields) return body;
  const copy = { ...body };
  for (const f of fields) {
    if (Array.isArray(copy[f])) {
      copy[f] = JSON.stringify(copy[f]);
    }
  }
  return copy;
}
