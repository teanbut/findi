// One login system for suppliers, fundraising organisations and admin staff
// (feature spec §1) — role decoded from the token decides which dashboard
// to redirect to.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { ApiError } from '../../../lib/api';

const REDIRECT_BY_ROLE: Record<string, string> = {
  supplier: '/portal/dashboard',
  fundraising_org: '/portal/fundraising',
  admin: '/portal/admin',
};

export default function PortalLoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      // Read the role straight back off the token we just stored, rather
      // than threading it through login()'s return value.
      const token = window.localStorage.getItem('findi_token');
      const role = token ? JSON.parse(atob(token.split('.')[1])).role : null;
      router.push(REDIRECT_BY_ROLE[role] ?? '/portal/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in — check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Findi Portal</h1>
      <p>For suppliers, fundraising organisations and Findi staff.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>
        New supplier? <Link href="/portal/apply">Apply to sell on Findi</Link>
      </p>
    </main>
  );
}
