import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module.js';
import { BuildingsModule } from './buildings/buildings.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, BuildingsModule],
})
export class AppModule {}
