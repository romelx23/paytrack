import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Building, Charge, ChargeStatus, Client, Summary } from './types';

// Tras cualquier escritura, refrescamos todo lo que depende del negocio.
function invalidateBusinessData(queryClient: QueryClient) {
  const keys = new Set(['buildings', 'summary', 'charges', 'clients']);
  return queryClient.invalidateQueries({ predicate: (q) => keys.has(String(q.queryKey[0])) });
}

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: () => api<Building[]>('/buildings'),
  });
}

// Por ahora la app trabaja con un negocio: el primero del usuario.
export function useCurrentBuilding() {
  const query = useBuildings();
  return { ...query, building: query.data?.[0] };
}

export function useSummary(buildingId?: string) {
  return useQuery({
    queryKey: ['summary', buildingId],
    queryFn: () => api<Summary>(`/buildings/${buildingId}/summary`),
    enabled: !!buildingId,
  });
}

export function useCharges(buildingId?: string, status?: ChargeStatus) {
  return useQuery({
    queryKey: ['charges', buildingId, status ?? 'all'],
    queryFn: () => api<Charge[]>(`/buildings/${buildingId}/charges${status ? `?status=${status}` : ''}`),
    enabled: !!buildingId,
  });
}

export function useClients(buildingId?: string) {
  return useQuery({
    queryKey: ['clients', buildingId],
    queryFn: () => api<Client[]>(`/buildings/${buildingId}/clients`),
    enabled: !!buildingId,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; address: string }) =>
      api<Building>('/buildings', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => invalidateBusinessData(queryClient),
  });
}

export function useCreateClient(buildingId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email?: string; phone?: string }) =>
      api<Client>(`/buildings/${buildingId}/clients`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => invalidateBusinessData(queryClient),
  });
}

export function useCreateCharge(buildingId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { clientId: string; concept: string; amountCents: number; dueDate: string }) =>
      api<Charge>(`/buildings/${buildingId}/charges`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => invalidateBusinessData(queryClient),
  });
}

export function usePayCharge(buildingId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { chargeId: string; amountCents: number; idempotencyKey: string }) =>
      api(`/buildings/${buildingId}/charges/${vars.chargeId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amountCents: vars.amountCents,
          method: 'efectivo',
          idempotencyKey: vars.idempotencyKey,
        }),
      }),
    onSuccess: () => invalidateBusinessData(queryClient),
  });
}
