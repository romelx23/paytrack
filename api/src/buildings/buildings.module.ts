import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { BuildingsController } from './buildings.controller.js';
import { BuildingsService } from './buildings.service.js';

@Module({
  controllers: [BuildingsController],
  providers: [BuildingsService, AuthGuard],
})
export class BuildingsModule {}
