import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { DB, type Database } from '../db/database.module.js';
import { buildings, charges, clients, payments } from '../db/schema.js';
import type { CreateBuildingDto, CreateChargeDto, CreateClientDto, RegisterPaymentDto } from './dto.js';

export type ChargeStatus = 'pending' | 'overdue' | 'paid';

// Toda operación verifica que el negocio pertenezca al usuario autenticado.
// La app móvil nunca toca las tablas: todo pasa por aquí.
@Injectable()
export class BuildingsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listBuildings(ownerId: string) {
    return this.db.select().from(buildings).where(eq(buildings.ownerId, ownerId)).orderBy(desc(buildings.createdAt));
  }

  async createBuilding(ownerId: string, dto: CreateBuildingDto) {
    const [building] = await this.db
      .insert(buildings)
      .values({
        ownerId,
        name: dto.name,
        address: dto.address,
        inviteCode: randomBytes(4).toString('hex').toUpperCase(),
      })
      .returning();
    return building;
  }

  async listClients(buildingId: string, ownerId: string) {
    await this.assertOwner(buildingId, ownerId);
    return this.db.select().from(clients).where(eq(clients.buildingId, buildingId)).orderBy(clients.name);
  }

  async createClient(buildingId: string, ownerId: string, dto: CreateClientDto) {
    await this.assertOwner(buildingId, ownerId);
    const [client] = await this.db
      .insert(clients)
      .values({ buildingId, name: dto.name, email: dto.email ?? null, phone: dto.phone ?? null })
      .returning();
    return client;
  }

  async createCharge(buildingId: string, ownerId: string, dto: CreateChargeDto) {
    await this.assertOwner(buildingId, ownerId);
    const [client] = await this.db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, dto.clientId), eq(clients.buildingId, buildingId)))
      .limit(1);
    if (!client) throw new BadRequestException('El cliente no pertenece a este negocio');

    const [charge] = await this.db
      .insert(charges)
      .values({
        buildingId,
        clientId: dto.clientId,
        concept: dto.concept,
        amountCents: dto.amountCents,
        dueDate: dto.dueDate,
      })
      .returning();
    return charge;
  }

  // El estado se calcula en el servidor a partir de pagos y fecha de vencimiento.
  async listCharges(buildingId: string, ownerId: string, status?: ChargeStatus) {
    await this.assertOwner(buildingId, ownerId);
    const rows = await this.db
      .select({
        id: charges.id,
        clientName: clients.name,
        concept: charges.concept,
        amountCents: charges.amountCents,
        dueDate: charges.dueDate,
        paidCents: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int`,
      })
      .from(charges)
      .innerJoin(clients, eq(clients.id, charges.clientId))
      .leftJoin(payments, eq(payments.chargeId, charges.id))
      .where(eq(charges.buildingId, buildingId))
      .groupBy(charges.id, clients.name)
      .orderBy(desc(charges.dueDate));

    const today = new Date().toISOString().slice(0, 10);
    const withStatus = rows.map((r) => {
      const remainingCents = Math.max(r.amountCents - r.paidCents, 0);
      const computed: ChargeStatus =
        remainingCents === 0 ? 'paid' : r.dueDate < today ? 'overdue' : 'pending';
      return { ...r, remainingCents, status: computed };
    });

    return status ? withStatus.filter((c) => c.status === status) : withStatus;
  }

  async summary(buildingId: string, ownerId: string) {
    const all = await this.listCharges(buildingId, ownerId);
    const sumOf = (list: typeof all) => list.reduce((acc, c) => acc + c.remainingCents, 0);

    const [collected] = await this.db
      .select({ total: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int` })
      .from(payments)
      .innerJoin(charges, eq(charges.id, payments.chargeId))
      .where(and(eq(charges.buildingId, buildingId), sql`${payments.paidAt} >= date_trunc('month', now())`));

    return {
      pendingCents: sumOf(all.filter((c) => c.status === 'pending')),
      overdueCents: sumOf(all.filter((c) => c.status === 'overdue')),
      collectedThisMonthCents: collected.total,
      openCharges: all.filter((c) => c.status !== 'paid').length,
    };
  }

  // Idempotente por idempotencyKey: si el pago ya existe, devuelve el mismo registro.
  async registerPayment(chargeId: string, ownerId: string, dto: RegisterPaymentDto) {
    return this.db.transaction(async (tx) => {
      const [owned] = await tx
        .select({ id: charges.id, amountCents: charges.amountCents })
        .from(charges)
        .innerJoin(buildings, eq(buildings.id, charges.buildingId))
        .where(and(eq(charges.id, chargeId), eq(buildings.ownerId, ownerId)))
        .for('update', { of: charges });
      if (!owned) throw new NotFoundException('Cobro no encontrado');

      const [existing] = await tx
        .select()
        .from(payments)
        .where(and(eq(payments.chargeId, chargeId), eq(payments.idempotencyKey, dto.idempotencyKey)));
      if (existing) return existing;

      const [{ paid }] = await tx
        .select({ paid: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int` })
        .from(payments)
        .where(eq(payments.chargeId, chargeId));
      const remaining = owned.amountCents - paid;
      if (remaining <= 0) throw new BadRequestException('El cobro ya está pagado');
      if (dto.amountCents > remaining) {
        throw new BadRequestException(`El monto excede el saldo pendiente de ${remaining} centavos`);
      }

      const [payment] = await tx
        .insert(payments)
        .values({ chargeId, amountCents: dto.amountCents, method: dto.method, idempotencyKey: dto.idempotencyKey })
        .returning();
      return payment;
    });
  }

  private async assertOwner(buildingId: string, ownerId: string) {
    const [building] = await this.db
      .select({ id: buildings.id })
      .from(buildings)
      .where(and(eq(buildings.id, buildingId), eq(buildings.ownerId, ownerId)))
      .limit(1);
    if (!building) throw new NotFoundException('Negocio no encontrado');
  }
}
