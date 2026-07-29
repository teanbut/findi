import type { ReactNode } from 'react';

export const metadata = {
  title: 'Findi — find local, save more.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
