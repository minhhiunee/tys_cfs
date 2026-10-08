import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type AdminInfo } from './auth.service.js';
import { AUTH_COOKIE_NAME } from './auth.constants.js';

/**
 * Guard that verifies the JWT from the HttpOnly cookie.
 * Attaches the admin payload to `request.admin`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }

    const admin = await this.authService.verifyToken(token);
    (request as AuthenticatedRequest).admin = admin;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    // Primary: HttpOnly cookie
    const cookieToken = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
    if (cookieToken) return cookieToken;

    // Fallback: Authorization header (useful for API testing / non-browser clients)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return undefined;
  }
}

/** Extended Request type with admin info attached by AuthGuard. */
export interface AuthenticatedRequest extends Request {
  admin: AdminInfo;
}
