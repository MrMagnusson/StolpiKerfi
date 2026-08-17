import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// In local dev the api and vettvangur apps share an origin via the Vite proxy (vite.config.ts), so
// "" (relative) works. In production they're deployed as separate services with different origins —
// VITE_API_URL must then be set to the API's own origin (e.g. https://stolpi-api.up.railway.app),
// no trailing slash. See DEPLOY.md.
const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const BASE = `${API_ORIGIN}/api`;

/** Photo URLs come back as paths relative to the API (e.g. "/uploads/x.jpg") — resolve against the
 * API's origin so `<img>` tags work when the frontend and API are on different hosts. */
export function resolveUploadUrl(path: string): string {
  return `${API_ORIGIN}${path}`;
}

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

export function useUnits() {
  return useQuery({ queryKey: ["vettvangur-units"], queryFn: () => request<VettvangurUnit[]>("/units") });
}

export interface NewRequestPayload {
  title: string;
  type: string;
  unitId: string | null;
  priority: string;
  description: string | null;
  assignedTo: string | null;
  dueDate: string | null;
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NewRequestPayload) => request<VettvangurRequest>("/requests", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vettvangur-requests"] }),
  });
}

export async function uploadPhoto(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("photo", blob, "photo.jpg");
  const res = await request<{ url: string }>("/uploads", { method: "POST", body: form });
  return resolveUploadUrl(res.url);
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

export interface CompleteSimplePayload {
  note?: string | null;
  photos?: string[];
  location?: string | null;
}

export function completeSimpleRequest(id: string, payload: CompleteSimplePayload) {
  return request<any>(`/vettvangur/requests/${id}/complete-simple`, { method: "POST", body: JSON.stringify(payload) });
}
