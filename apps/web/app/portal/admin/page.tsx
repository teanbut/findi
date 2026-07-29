// Admin console — feature spec §12: approval queues, category capacity
// view, order oversight, commission/payout runs, Feed It Forward ledger,
// Fundraising administration. This pass covers the approval queues and
// revenue view; order oversight/moderation/ledgers are still TODO.
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import {
  adminPendingSuppliers,
  adminPendingCategoryRequests,
  adminApproveSupplier,
  adminApproveCategory,
  adminRevenue,
  ApiError,
  type SupplierProfile,
} from '../../../lib/api';

interface PendingCategoryRequest {
  supplierId: string;
  categoryId: string;
  supplier: SupplierProfile;
  category: { id: string; name: string };
}

export default function AdminConsolePage() {
  const { token, role } = useAuth();
  const [pendingSuppliers, setPendingSuppliers] = useState<SupplierProfile[]>([]);
  const [pendingCategories, setPendingCategories] = useState<PendingCategoryRequest[]>([]);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    try {
      const [suppliers, categories] = await Promise.all([adminPendingSuppliers(), adminPendingCategoryRequests()]);
      setPendingSuppliers(suppliers);
      setPendingCategories(categories as PendingCategoryRequest[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the approval queues.');
    }

    // Last 30 days, purely illustrative window for this pass.
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    adminRevenue(from, to)
      .then((r) => setRevenue(r.findiCommissionRevenue))
      .catch(() => setRevenue(null));
  }

  useEffect(() => {
    if (token && role === 'admin') refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  async function handleApproveSupplier(id: string) {
    setBusyId(id);
    try {
      await adminApproveSupplier(id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve this supplier.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleApproveCategory(supplierId: string, categoryId: string) {
    const key = `${supplierId}:${categoryId}`;
    setBusyId(key);
    try {
      await adminApproveCategory(supplierId, categoryId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve this category.');
    } finally {
      setBusyId(null);
    }
  }

  if (!token || role !== 'admin') {
    return (
      <main>
        <h1>Findi Admin</h1>
        <p>Admin access only.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Findi Admin</h1>
      {error ? <p role="alert">{error}</p> : null}

      <section aria-label="Revenue">
        <h2>Findi commission, last 30 days</h2>
        <p>{revenue === null ? 'Loading…' : `R${revenue.toFixed(2)}`}</p>
      </section>

      <section aria-label="Pending suppliers">
        <h2>Pending supplier applications</h2>
        {pendingSuppliers.length === 0 ? (
          <p>Nothing waiting.</p>
        ) : (
          <ul>
            {pendingSuppliers.map((s) => (
              <li key={s.id}>
                {s.businessName} — {s.tier}
                <button type="button" disabled={busyId === s.id} onClick={() => handleApproveSupplier(s.id)}>
                  {busyId === s.id ? 'Approving…' : 'Approve profile'}
                </button>
                {/* Approving the profile does NOT approve any category —
                    feature spec §5.3: "not free to list anything." Each
                    category below still needs its own approval. */}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Pending category requests">
        <h2>Pending category requests</h2>
        <p>
          Approve here only once you've checked category capacity (feature spec §4.3/§4.5 — does this category
          already have enough quality suppliers?). That check isn't automated in this pass; it's a judgement call
          for now.
        </p>
        {pendingCategories.length === 0 ? (
          <p>Nothing waiting.</p>
        ) : (
          <ul>
            {pendingCategories.map((req) => {
              const key = `${req.supplierId}:${req.categoryId}`;
              return (
                <li key={key}>
                  {req.supplier?.businessName ?? req.supplierId} — {req.category.name}
                  <button
                    type="button"
                    disabled={busyId === key}
                    onClick={() => handleApproveCategory(req.supplierId, req.categoryId)}
                  >
                    {busyId === key ? 'Approving…' : 'Approve category'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* TODO: listing moderation, order oversight, dispute queue, Feed It
          Forward ledger, Fundraising administration (feature spec §12) */}
    </main>
  );
}
