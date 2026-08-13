import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE = "/api";

/** Formats the API's error shape (a plain string, or a zod .flatten() object) into one readable line. */
function formatApiError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const flat = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const parts = [...(flat.formErrors ?? []), ...Object.values(flat.fieldErrors ?? {}).flat()];
    if (parts.length) return parts.join(" · ");
  }
  return "Óþekkt villa";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? formatApiError(body.error) : `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useList<T>(kind: string) {
  return useQuery({ queryKey: [kind], queryFn: () => request<T[]>(`/${kind}`) });
}

export function useItem<T>(kind: string, id: string | undefined) {
  return useQuery({
    queryKey: [kind, id],
    queryFn: () => request<T>(`/${kind}/${id}`),
    enabled: !!id,
  });
}

export function useCreate<T>(kind: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<T>) => request<T>(`/${kind}`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [kind] }),
  });
}

export function useUpdate<T>(kind: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
      request<T>(`/${kind}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [kind] });
      qc.invalidateQueries({ queryKey: [kind, vars.id] });
    },
  });
}

export function useRemove(kind: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<void>(`/${kind}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [kind] }),
  });
}

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: () => request<any>("/dashboard") });
}

export function useMatch(projectId: string | undefined) {
  return useQuery({
    queryKey: ["match", projectId],
    queryFn: () => request<any>(`/match/${projectId}`),
    enabled: !!projectId,
  });
}

export function useSalesPlan(owner: string) {
  return useQuery({ queryKey: ["sales-plan", owner], queryFn: () => request<any>(`/sales/plan?owner=${encodeURIComponent(owner)}`) });
}

export function useSalesPipeline(owner: string) {
  return useQuery({ queryKey: ["sales-pipeline", owner], queryFn: () => request<any>(`/sales/pipeline?owner=${encodeURIComponent(owner)}`) });
}

export { request };
