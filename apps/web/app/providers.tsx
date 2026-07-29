'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth-context';
import { BasketProvider } from '../lib/basket-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BasketProvider>{children}</BasketProvider>
    </AuthProvider>
  );
}
