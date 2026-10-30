import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Fuente de verdad del esquema. La migración equivalente vive en supabase/migrations.
// Los importes se guardan en centavos (enteros) para evitar errores de punto flotante.

export const buildings = pgTable('buildings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(), // id del usuario en Supabase Auth
  name: text('name').notNull(), // nombre del negocio o cuenta
  address: text('address').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id')
    .notNull()
    .references(() => buildings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const charges = pgTable('charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id')
    .notNull()
    .references(() => buildings.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  concept: text('concept').notNull(), // p. ej. "Diseño de logo", "Mantenimiento de octubre"
  amountCents: integer('amount_cents').notNull(),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  chargeId: uuid('charge_id')
    .notNull()
    .references(() => charges.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  method: text('method').notNull(), // "efectivo", "transferencia", ...
  idempotencyKey: text('idempotency_key').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
});
