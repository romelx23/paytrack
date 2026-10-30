import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Building, Charge, ChargeStatus, Summary, Unit } from './types';

// Tras cualquier escritura, refrescamos todo lo que depende del edificio.
function invalidateBuildingData(queryClient: QueryClient) {
  const keys = new Set(['buildings', 'summary', 'charges', 'units']);
  return queryClient.invalidateQueries({ predicate: (q) => keys.has(String(q.queryKey[0])) });
}

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: () => api<Building[]>('/buildings'),
  });
}

// Por ahora la app trabaja con un edificio: el primero del encargado.
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

export function useUnits(buildingId?: string) {
  return useQuery({
    queryKey: ['units', buildingId],
    queryFn: () => api<Unit[]>(`/buildings/${buildingId}/units`),
    enabled: !!buildingId,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; address: string }) =>
      api<Building>('/buildings', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => invalidateBuildingData(queryClient),
  });
}

export function useCreateUnit(buildingId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { label: string; residentName?: string }) =>
      api<Unit>(`/buildings/${buildingId}/units`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => invalidateBuildingData(queryClient),
  });
}

export function useGenerateCharges(buildingId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { period: string; concept: string; amountCents: number; dueDay: number }) =>
      api<{ created: number }>(`/buildings/${buildingId}/charges/generate`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidateBuildingData(queryClient),
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
    onSuccess: () => invalidateBuildingData(queryClient),
  });
}
