import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min, MaxLength } from 'class-validator';

export class CreateBuildingDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsString() @IsNotEmpty() @MaxLength(200)
  address!: string;
}

export class CreateClientDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsOptional() @IsEmail() @MaxLength(160)
  email?: string;

  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;
}

export class CreateChargeDto {
  @IsUUID()
  clientId!: string;

  @IsString() @IsNotEmpty() @MaxLength(120)
  concept!: string;

  @Type(() => Number) @IsInt() @Min(1)
  amountCents!: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate debe tener formato AAAA-MM-DD' })
  dueDate!: string;
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
