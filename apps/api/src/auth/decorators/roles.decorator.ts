import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to specific roles, checked by RolesGuard against the
 * `role` JwtAuthGuard attaches to req.user. Applied per-controller or
 * per-route — e.g. @Roles('admin') on the whole AdminController.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
