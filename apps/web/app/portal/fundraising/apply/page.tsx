// Fundraising organisation application — feature spec §7, decision #13.
// Same "nothing is live until reviewed" shape as supplier onboarding
// (§5.2), just one approval step rather than per-category.
'use client';

import { useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { applyFundraisingOrg, ApiError } from '../../../../lib/api';

const TYPES = [
  { value: 'school', label: 'School' },
  { value: 'church', label: 'Church' },
  { value: 'club', label: 'Sports club' },
  { value: 'ngo', label: 'NGO' },
];

function CreateFundraisingAccount() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ email, password, role: 'fundraising_org' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create an account — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Register your organisation with Findi</h1>
      <p>First, create an account — the application form follows right after.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already registered? <a href="/portal/login">Log in</a>
      </p>
    </main>
  );
}

export default function FundraisingApplyPage() {
  const { token, role } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState(TYPES[0].value);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const org = await applyFundraisingOrg(name, type);
      setCode(org.code);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the application — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) return <CreateFundraisingAccount />;

  if (role !== 'fundraising_org') {
    return (
      <main>
        <h1>Register your organisation</h1>
        <p>This account isn't registered as a fundraising organisation.</p>
      </main>
    );
  }

  if (code) {
    return (
      <main>
        <h1>Application submitted</h1>
        <p>
          Your fundraising code is <strong>{code}</strong> — it's pending admin approval (feature spec §7, decision
          #13) before supporters can use it at checkout.
        </p>
        <p>
          <a href="/portal/fundraising">Go to your dashboard</a>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Register your organisation</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Organisation name
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <fieldset>
          <legend>Type</legend>
          {TYPES.map((t) => (
            <label key={t.value}>
              <input type="radio" name="type" checked={type === t.value} onChange={() => setType(t.value)} />
              {t.label}
            </label>
          ))}
        </fieldset>
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}
