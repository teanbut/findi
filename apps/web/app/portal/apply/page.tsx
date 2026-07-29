// Supplier application — feature spec §5.2 stage 1 (Application). Kicks
// off the pipeline: Application → Pending Review → Approved → Categories
// Assigned → Login Activated. Nothing here grants access by itself.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { applySupplier, listCategories, ApiError, type Category } from '../../../lib/api';

function CreateSupplierAccount() {
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
      // Creates the User with role='supplier' — the application form
      // below (rendered once `role === 'supplier'`) is what creates the
      // actual SupplierProfile (feature spec §5.2 stage 1).
      await register({ email, password, role: 'supplier' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create an account — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Become a Findi supplier</h1>
      <p>First, create a supplier account — the application form follows right after.</p>
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
          {submitting ? 'Creating account…' : 'Create supplier account'}
        </button>
      </form>
      <p>
        Already have a supplier account? <a href="/portal/login">Log in</a>
      </p>
    </main>
  );
}

const TIERS = [
  { value: 'farmer', label: 'Findi Farmer' },
  { value: 'local_business', label: 'Findi Local Business' },
  { value: 'community_seller', label: 'Findi Community Seller' },
  { value: 'rescue_partner', label: 'Findi Rescue Partner' },
];

export default function SupplierApplyPage() {
  const { token, role } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [tier, setTier] = useState(TIERS[0].value);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await applySupplier({ businessName, tier, categoryIds });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the application — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return <CreateSupplierAccount />;
  }

  if (role !== 'supplier') {
    return (
      <main>
        <h1>Become a Findi supplier</h1>
        <p>This account isn't registered as a supplier. Create a separate account with the supplier role to apply.</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main>
        <h1>Application submitted</h1>
        <p>
          Your application — and each category you requested — is now pending review (feature spec §5.2). We'll be in
          touch once a decision's made.
        </p>
        <p>
          <a href="/portal/dashboard">Go to your dashboard</a>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Become a Findi supplier</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Business name
          <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </label>

        <fieldset>
          <legend>Which tier best describes you?</legend>
          {TIERS.map((t) => (
            <label key={t.value}>
              <input type="radio" name="tier" checked={tier === t.value} onChange={() => setTier(t.value)} />
              {t.label}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Which categories do you want to sell in?</legend>
          {categories.length === 0 ? (
            <p>No categories set up yet.</p>
          ) : (
            categories.map((c) => (
              <label key={c.id}>
                <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                {c.name}
              </label>
            ))
          )}
          <p>
            Each category goes through its own review (feature spec §4.3 — is this category already covered?), not a
            blanket approval.
          </p>
        </fieldset>

        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={submitting || categoryIds.length === 0}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}
