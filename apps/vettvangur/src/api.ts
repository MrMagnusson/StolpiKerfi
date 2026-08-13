import { useQuery, useQueryClient } from "@tanstack/react-query";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface VettvangurUnit {
  id: string;
  code: string;
  sizeM2: number;
  location: string;
  status: string;
}

export interface VettvangurRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  dueDate: string | null;
  unitId: string | null;
  unit: VettvangurUnit | null;
}

export function useRequests() {
  return useQuery({ queryKey: ["vettvangur-requests"], queryFn: () => request<VettvangurRequest[]>("/vettvangur/requests"), refetchInterval: 15_000 });
}

export function useRequestsInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["vettvangur-requests"] });
}

export async function uploadPhoto(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("photo", blob, "photo.jpg");
  const res = await request<{ url: string }>("/uploads", { method: "POST", body: form });
  return res.url;
}

export interface CompletePayload {
  location: string;
  damage?: {
    description: string;
    cause: string;
    responsible?: string | null;
    costIsk: number;
  } | null;
}

export function completeRequest(id: string, payload: CompletePayload) {
  return request<any>(`/vettvangur/requests/${id}/complete`, { method: "POST", body: JSON.stringify(payload) });
}
