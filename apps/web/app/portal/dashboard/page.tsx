// Supplier dashboard — feature spec §11.4 "Supplier Insights": today's
// orders, sales snapshot, Findi Wallet balance. Only reachable once
// SuppliersService.assertCanAccessPortal() would pass (feature spec §5.2
// stage 4, "Login Activated") — enforced server-side by each endpoint
// this page calls, not by this page itself.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { myWalletBalance, myListings, myWithdraw, ApiError, type WalletBalance, type ListingWithSupplier } from '../../../lib/api';

export default function SupplierDashboardPage() {
  const { token, role } = useAuth();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [listings, setListings] = useState<ListingWithSupplier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);

  function load() {
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
  }

  useEffect(() => {
    if (!token || role !== 'supplier') return;
    load();
  }, [token, role]);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawMessage(null);
    try {
      // NOTE: this records the withdrawal and reduces the available
      // balance — it does not trigger a real bank transfer yet, which
      // needs the payment gateway/banking integration (still open,
      // feature spec §18 #2).
      await myWithdraw(Number(withdrawAmount));
      setWithdrawAmount('');
      setWithdrawMessage('Withdrawal recorded — the actual bank transfer step is still manual for now.');
      load();
    } catch (err) {
      setWithdrawMessage(err instanceof ApiError ? err.message : 'Could not process the withdrawal.');
    } finally {
      setWithdrawing(false);
    }
  }

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
        <form onSubmit={handleWithdraw}>
          <label>
            Withdraw amount (R)
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </label>
          <button type="submit" disabled={withdrawing}>
            {withdrawing ? 'Processing…' : 'Withdraw'}
          </button>
        </form>
        {withdrawMessage ? <p role="status">{withdrawMessage}</p> : null}
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
