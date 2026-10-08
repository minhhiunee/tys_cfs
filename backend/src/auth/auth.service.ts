import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service.js';

export interface JwtPayload {
  sub: string;        // admin id
  email: string;
  role: string;
}

export interface AdminInfo {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Validate credentials and return a signed JWT. */
  async login(email: string, password: string): Promise<{ token: string; admin: AdminInfo }> {
    const admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const token = await this.jwt.signAsync(payload);

    return {
      token,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    };
  }

  /** Verify a JWT and return the admin info. */
  async verifyToken(token: string): Promise<AdminInfo> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);

      // Ensure admin still exists in DB (e.g. not deleted).
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });

      if (!admin) {
        throw new UnauthorizedException('Admin account no longer exists.');
      }

      return admin;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  /** Hash a plaintext password. Exported for seed script usage. */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
