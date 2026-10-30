import { date, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

// Fuente de verdad del esquema. La migración equivalente vive en supabase/migrations.
// Los importes se guardan en centavos (enteros) para evitar errores de punto flotante.

export const buildings = pgTable('buildings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(), // id del usuario en Supabase Auth
  name: text('name').notNull(),
  address: text('address').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const units = pgTable(
  'units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buildingId: uuid('building_id')
      .notNull()
      .references(() => buildings.id, { onDelete: 'cascade' }),
    label: text('label').notNull(), // p. ej. "Dpto 301"
    residentName: text('resident_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('units_building_label_key').on(t.buildingId, t.label)],
);

export const charges = pgTable(
  'charges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buildingId: uuid('building_id')
      .notNull()
      .references(() => buildings.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    period: text('period').notNull(), // "2026-10"
    concept: text('concept').notNull(), // p. ej. "Mantenimiento"
    amountCents: integer('amount_cents').notNull(),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('charges_unit_period_concept_key').on(t.unitId, t.period, t.concept)],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chargeId: uuid('charge_id')
      .notNull()
      .references(() => charges.id, { onDelete: 'cascade' }),
    amountCents: integer('amount_cents').notNull(),
    method: text('method').notNull(), // "efectivo", "transferencia", ...
    idempotencyKey: text('idempotency_key').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('payments_charge_idempotency_key').on(t.chargeId, t.idempotencyKey)],
);
