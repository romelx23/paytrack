import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min, MaxLength } from 'class-validator';

export class CreateBuildingDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsString() @IsNotEmpty() @MaxLength(200)
  address!: string;
}

export class CreateUnitDto {
  @IsString() @IsNotEmpty() @MaxLength(40)
  label!: string;

  @IsOptional() @IsString() @MaxLength(120)
  residentName?: string;
}

export class GenerateChargesDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'period debe tener formato AAAA-MM' })
  period!: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  concept!: string;

  @Type(() => Number) @IsInt() @Min(1)
  amountCents!: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(28)
  dueDay!: number;
}

export class RegisterPaymentDto {
  @Type(() => Number) @IsInt() @Min(1)
  amountCents!: number;

  @IsString() @IsNotEmpty() @MaxLength(40)
  method!: string;

  // El cliente genera un UUID por intento: si la red falla y reintenta, no se cobra dos veces.
  @IsString() @IsNotEmpty() @MaxLength(80)
  idempotencyKey!: string;
}

export class ListChargesQuery {
  @IsOptional() @Matches(/^(pending|overdue|paid)$/)
  status?: 'pending' | 'overdue' | 'paid';
}
