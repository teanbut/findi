import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata = {
  title: 'Findi — find local, save more.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
