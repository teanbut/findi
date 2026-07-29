import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Registered globally (technical plan §5: "a supplier token should be
 * structurally incapable of hitting /admin/*, not just blocked by a UI
 * that hides the button"). Every route requires a valid token by default;
 * @Public() is the explicit, visible opt-out.
 *
 * For role === 'supplier', also resolves the caller's SupplierProfile.id
 * and attaches it as req.user.supplierId — several routes (listings,
 * category requests) were written assuming this exists and previously had
 * nothing populating it.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const token = extractBearerToken(req.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    let payload: { sub: string; role: string };
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    req.user = { sub: payload.sub, role: payload.role };

    if (payload.role === 'supplier') {
      const supplier = await this.prisma.supplierProfile.findUnique({ where: { userId: payload.sub } });
      if (supplier) req.user.supplierId = supplier.id;
    }

    if (payload.role === 'fundraising_org') {
      const org = await this.prisma.fundraisingOrganisation.findUnique({ where: { userId: payload.sub } });
      if (org) req.user.orgId = org.id;
    }

    return true;
  }
}

function extractBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}
