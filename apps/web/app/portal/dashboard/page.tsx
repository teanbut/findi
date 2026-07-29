// Supplier dashboard — feature spec §11.4 "Supplier Insights": today's
// orders, sales snapshot, Findi Wallet balance. Only reachable once
// SuppliersService.assertCanAccessPortal() would pass (feature spec §5.2
// stage 4, "Login Activated") — enforced server-side by each endpoint
// this page calls, not by this page itself.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { myWalletBalance, myListings, type WalletBalance, type ListingWithSupplier } from '../../../lib/api';

export default function SupplierDashboardPage() {
  const { token, role } = useAuth();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [listings, setListings] = useState<ListingWithSupplier[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || role !== 'supplier') return;
    Promise.all([myWalletBalance(), myListings()])
      .then(([w, l]) => {
        setWallet(w);
        setListings(l);
      })
      .catch(() => {
        // Most likely: approved but with zero approved categories yet, so
        // JwtAuthGuard never attached a supplierId — see assertCanAccessPortal().
        setError('No supplier profile activated on this account yet — apply first, then wait for approval.');
      });
  }, [token, role]);

  if (!token) {
    return (
      <main>
        <h1>Supplier dashboard</h1>
        <p>
          <Link href="/portal/login">Log in</Link> to see your dashboard.
        </p>
      </main>
    );
  }

  if (role !== 'supplier') {
    return (
      <main>
        <h1>Supplier dashboard</h1>
        <p>This account isn't a supplier account.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Supplier dashboard</h1>
        <p>{error}</p>
        <p>
          <Link href="/portal/apply">Apply as a supplier</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Supplier dashboard</h1>

      <section aria-label="Findi Wallet">
        <h2>Findi Wallet</h2>
        {wallet ? (
          <p>
            Available: R{wallet.availableBalance} · Pending: R{wallet.pendingBalance}
          </p>
        ) : (
          <p>Loading…</p>
        )}
      </section>

      <section aria-label="Your listings">
        <h2>Your listings</h2>
        <p>
          <Link href="/portal/listings/new">+ New listing</Link>
        </p>
        {listings.length === 0 ? (
          <p>No listings yet.</p>
        ) : (
          <ul>
            {listings.map((l) => (
              <li key={l.id}>
                {l.title} — R{l.discountedPrice} — {l.category.name}
                {/* TODO: status badge, pause action, edit */}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* TODO: order queue, sales trends & best-selling products, repeat
          customers & conversion rate (feature spec §11.4 Phase 2 items) */}
    </main>
  );
}
