import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & { userId: string };

// Valida el access token de Supabase Auth delegando en su endpoint /auth/v1/user.
// Así no dependemos del formato de firma (HS256 o JWKS) que use el proyecto.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Falta el token de acceso');

    const res = await fetch(`${this.config.getOrThrow<string>('SUPABASE_URL')}/auth/v1/user`, {
      headers: {
        apikey: this.config.getOrThrow<string>('SUPABASE_ANON_KEY'),
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new UnauthorizedException('Sesión no válida');

    const user = (await res.json()) as { id: string };
    req.userId = user.id;
    return true;
  }
}
