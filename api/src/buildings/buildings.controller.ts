import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { BuildingsService, type ChargeStatus } from './buildings.service.js';
import {
  CreateBuildingDto,
  CreateUnitDto,
  GenerateChargesDto,
  ListChargesQuery,
  RegisterPaymentDto,
} from './dto.js';

@Controller('buildings')
@UseGuards(AuthGuard)
export class BuildingsController {
  constructor(private readonly buildings: BuildingsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.buildings.listBuildings(req.userId);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateBuildingDto) {
    return this.buildings.createBuilding(req.userId, dto);
  }

  @Get(':id/summary')
  summary(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.buildings.summary(id, req.userId);
  }

  @Get(':id/units')
  units(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.buildings.listUnits(id, req.userId);
  }

  @Post(':id/units')
  createUnit(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreateUnitDto) {
    return this.buildings.createUnit(id, req.userId, dto);
  }

  @Get(':id/charges')
  charges(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query() query: ListChargesQuery) {
    return this.buildings.listCharges(id, req.userId, query.status as ChargeStatus | undefined);
  }

  @Post(':id/charges/generate')
  generate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: GenerateChargesDto) {
    return this.buildings.generateCharges(id, req.userId, dto);
  }

  @Post(':id/charges/:chargeId/payments')
  pay(
    @Req() req: AuthenticatedRequest,
    @Param('chargeId') chargeId: string,
    @Body() dto: RegisterPaymentDto,
  ) {
    return this.buildings.registerPayment(chargeId, req.userId, dto);
  }
}
