// Formas de respuesta de la API. Reflejan lo que devuelve buildings.service.ts.

export type Building = {
  id: string;
  name: string;
  address: string;
  inviteCode: string;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type ChargeStatus = 'pending' | 'overdue' | 'paid';

export type Charge = {
  id: string;
  clientName: string;
  concept: string;
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
