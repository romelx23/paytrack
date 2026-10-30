import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { DB, type Database } from '../db/database.module.js';
import { buildings, charges, payments, units } from '../db/schema.js';
import type { CreateBuildingDto, CreateUnitDto, GenerateChargesDto, RegisterPaymentDto } from './dto.js';

export type ChargeStatus = 'pending' | 'overdue' | 'paid';

// Toda operación verifica que el edificio pertenezca al usuario autenticado.
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

  async listUnits(buildingId: string, ownerId: string) {
    await this.assertOwner(buildingId, ownerId);
    return this.db.select().from(units).where(eq(units.buildingId, buildingId)).orderBy(units.label);
  }

  async createUnit(buildingId: string, ownerId: string, dto: CreateUnitDto) {
    await this.assertOwner(buildingId, ownerId);
    const [unit] = await this.db
      .insert(units)
      .values({ buildingId, label: dto.label, residentName: dto.residentName ?? null })
      .returning();
    return unit;
  }

  // Genera un cargo por departamento. Es idempotente: volver a ejecutarlo para el mismo
  // periodo y concepto no duplica cargos gracias a la restricción única.
  async generateCharges(buildingId: string, ownerId: string, dto: GenerateChargesDto) {
    await this.assertOwner(buildingId, ownerId);
    const buildingUnits = await this.db.select({ id: units.id }).from(units).where(eq(units.buildingId, buildingId));
    if (buildingUnits.length === 0) throw new BadRequestException('El edificio no tiene departamentos');

    const dueDate = `${dto.period}-${String(dto.dueDay).padStart(2, '0')}`;
    const inserted = await this.db
      .insert(charges)
      .values(
        buildingUnits.map((u) => ({
          buildingId,
          unitId: u.id,
          period: dto.period,
          concept: dto.concept,
          amountCents: dto.amountCents,
          dueDate,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: charges.id });

    return { created: inserted.length };
  }

  // Calcula el estado en el servidor a partir de pagos y fecha de vencimiento.
  async listCharges(buildingId: string, ownerId: string, status?: ChargeStatus) {
    await this.assertOwner(buildingId, ownerId);
    const rows = await this.db
      .select({
        id: charges.id,
        unitLabel: units.label,
        concept: charges.concept,
        period: charges.period,
        amountCents: charges.amountCents,
        dueDate: charges.dueDate,
        paidCents: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int`,
      })
      .from(charges)
      .innerJoin(units, eq(units.id, charges.unitId))
      .leftJoin(payments, eq(payments.chargeId, charges.id))
      .where(eq(charges.buildingId, buildingId))
      .groupBy(charges.id, units.label)
      .orderBy(desc(charges.dueDate), units.label);

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
      .where(
        and(
          eq(charges.buildingId, buildingId),
          sql`${payments.paidAt} >= date_trunc('month', now())`,
        ),
      );

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
      if (!owned) throw new NotFoundException('Cargo no encontrado');

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
      if (remaining <= 0) throw new BadRequestException('El cargo ya está pagado');
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
    if (!building) throw new NotFoundException('Edificio no encontrado');
  }
}
