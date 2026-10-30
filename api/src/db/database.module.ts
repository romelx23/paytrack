import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export const DB = Symbol('DB');
export const DB_CLIENT = Symbol('DB_CLIENT');
export type Database = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DB_CLIENT,
      inject: [ConfigService],
      // Supabase en modo transacción (puerto 6543) requiere prepare: false.
      // En Vercel cada instancia es una función aislada: max: 1 evita agotar conexiones.
      useFactory: (config: ConfigService) =>
        postgres(config.getOrThrow<string>('DATABASE_URL'), { prepare: false, max: 1 }),
    },
    {
      provide: DB,
      inject: [DB_CLIENT],
      useFactory: (client: ReturnType<typeof postgres>) => drizzle(client, { schema }),
    },
  ],
  exports: [DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DB_CLIENT) private readonly client: ReturnType<typeof postgres>) {}

  async onApplicationShutdown() {
    await this.client.end();
  }
}
