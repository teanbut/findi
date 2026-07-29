import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opt-out of the global JwtAuthGuard for routes that must work without a
 * token — register/login, and guest browsing (feature spec §10.1: "Guest
 * browsing with a login gate at checkout", so browse/search stays open).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
