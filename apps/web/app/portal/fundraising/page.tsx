// Fundraising organisation dashboard — feature spec §7: total raised,
// supporter count, order count, all read-only and scoped to the caller's
// own organisation (req.user.orgId server-side, never a URL param).
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { myFundraisingDashboard, ApiError, type FundraisingDashboard } from '../../../lib/api';

export default function FundraisingDashboardPage() {
  const { token, role } = useAuth();
  const [dashboard, setDashboard] = useState<FundraisingDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || role !== 'fundraising_org') return;
    myFundraisingDashboard()
      .then(setDashboard)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 403
            ? 'Your application is still pending admin approval.'
            : 'No fundraising organisation activated on this account yet.',
        ),
      );
  }, [token, role]);

  if (!token) {
    return (
      <main>
        <h1>Fundraising dashboard</h1>
        <p>
          <Link href="/portal/login">Log in</Link> to see your dashboard.
        </p>
      </main>
    );
  }

  if (role !== 'fundraising_org') {
    return (
      <main>
        <h1>Fundraising dashboard</h1>
        <p>This account isn't a fundraising organisation account.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Fundraising dashboard</h1>
        <p>{error}</p>
        <p>
          <Link href="/portal/fundraising/apply">Apply</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Fundraising dashboard</h1>
      {dashboard ? (
        <ul>
          <li>Total raised: R{dashboard.totalRaised.toFixed(2)}</li>
          <li>Supporters: {dashboard.supporterCount}</li>
          <li>Orders: {dashboard.orderCount}</li>
        </ul>
      ) : (
        <p>Loading…</p>
      )}
      {/* TODO: monthly exportable reports (feature spec §7) */}
    </main>
  );
}
