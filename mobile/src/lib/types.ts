// Formas de respuesta de la API. Reflejan lo que devuelve buildings.service.ts.

export type Building = {
  id: string;
  name: string;
  address: string;
  inviteCode: string;
  createdAt: string;
};

export type Unit = {
  id: string;
  label: string;
  residentName: string | null;
};

export type ChargeStatus = 'pending' | 'overdue' | 'paid';

export type Charge = {
  id: string;
  unitLabel: string;
  concept: string;
  period: string;
  amountCents: number;
  dueDate: string;
  paidCents: number;
  remainingCents: number;
  status: ChargeStatus;
};

export type Summary = {
  pendingCents: number;
  overdueCents: number;
  collectedThisMonthCents: number;
  openCharges: number;
};
