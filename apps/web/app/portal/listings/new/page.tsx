// Create a listing — feature spec §7.2/§11.2. categoryId must be one the
// supplier already holds an *approved* SupplierCategory for; the API
// enforces this (ListingsService.create()), this form just narrows the
// dropdown to make that visible rather than letting the request fail.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import { createListing, myListings, listCategories, ApiError, type Category } from '../../../../lib/api';

export default function NewListingPage() {
  const { token, role } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('each');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('1');
  const [collectionWindowStart, setCollectionWindowStart] = useState('');
  const [collectionWindowEnd, setCollectionWindowEnd] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // TODO: this lists ALL categories, not just the ones this supplier is
    // approved for — there's no GET /suppliers/me/categories endpoint yet.
    // Submitting an unapproved category still gets rejected server-side,
    // but the dropdown should really only show approved ones.
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createListing({
        categoryId,
        title,
        description,
        photos: [],
        unit,
        originalPrice: Number(originalPrice),
        discountedPrice: Number(discountedPrice),
        quantityAvailable: Number(quantityAvailable),
        collectionWindowStart,
        collectionWindowEnd,
        pickupAddress,
      });
      router.push('/portal/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not create the listing — please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token || role !== 'supplier') {
    return (
      <main>
        <h1>New listing</h1>
        <p>Log in with an approved supplier account to create a listing.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>New listing</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Category
          <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Description
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Unit (e.g. kg, box, loaf, each)
          <input required value={unit} onChange={(e) => setUnit(e.target.value)} />
        </label>
        <label>
          Original price (R)
          <input required type="number" min={0} step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
        </label>
        <label>
          Discounted price (R)
          <input required type="number" min={0} step="0.01" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} />
        </label>
        <label>
          Quantity available
          <input required type="number" min={1} value={quantityAvailable} onChange={(e) => setQuantityAvailable(e.target.value)} />
        </label>
        <label>
          Collection window start
          <input required type="datetime-local" value={collectionWindowStart} onChange={(e) => setCollectionWindowStart(e.target.value)} />
        </label>
        <label>
          Collection window end
          <input required type="datetime-local" value={collectionWindowEnd} onChange={(e) => setCollectionWindowEnd(e.target.value)} />
        </label>
        <label>
          Pickup address
          <input required value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
        </label>

        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create listing'}
        </button>
      </form>
    </main>
  );
}
