// Checkout — feature spec §10.3 / technical plan §4.1: single payment,
// then POST /checkout on the API creates the order and the payment split.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBasket } from '../../../lib/basket-context';
import { useAuth } from '../../../lib/auth-context';
import { checkout, ApiError } from '../../../lib/api';

type FeedItForwardChoice = 'none' | 'round_up' | 'fixed_1' | 'fixed_5' | 'fixed_10';

export default function CheckoutPage() {
  const { items, subtotal, clear } = useBasket();
  const { token } = useAuth();
  const router = useRouter();

  const [fundraisingCode, setFundraisingCode] = useState('');
  const [feedItForward, setFeedItForward] = useState<FeedItForwardChoice>('none');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedItForwardEstimate =
    feedItForward === 'round_up'
      ? Math.ceil(subtotal / 10) * 10 - subtotal
      : feedItForward === 'fixed_1'
        ? 1
        : feedItForward === 'fixed_5'
          ? 5
          : feedItForward === 'fixed_10'
            ? 10
            : 0;

  if (items.length === 0) {
    return (
      <main>
        <h1>Checkout</h1>
        <p>
          Your basket is empty — <Link href="/">browse local deals</Link>.
        </p>
      </main>
    );
  }

  if (!token) {
    return (
      <main>
        <h1>Checkout</h1>
        <p>
          <Link href="/login?next=/checkout">Log in</Link> to complete your order — the deal stays in your basket.
        </p>
      </main>
    );
  }

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    try {
      // NOTE: real payment capture happens here in production, before this
      // call — the gateway choice is still open (feature spec §18 #2). This
      // calls the API directly, matching how OrdersService.checkout()
      // currently assumes payment is already authorised.
      const result = await checkout({
        items: items.map((i) => ({ listingId: i.listingId, quantity: i.quantity })),
        fundraisingCode: fundraisingCode || undefined,
        feedItForward:
          feedItForward === 'none'
            ? undefined
            : feedItForward === 'round_up'
              ? { mode: 'round_up' }
              : { mode: 'fixed', amount: Number(feedItForward.split('_')[1]) },
      });
      clear();
      router.push(`/orders/${result.order.id}/confirmation`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong placing the order — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Checkout</h1>

      <section aria-label="Order summary">
        <h2>Order summary</h2>
        <ul>
          {items.map((item) => (
            <li key={item.listingId}>
              {item.title} × {item.quantity} — R{(item.unitPrice * item.quantity).toFixed(2)}
            </li>
          ))}
        </ul>
        <p>Subtotal: R{subtotal.toFixed(2)}</p>
      </section>

      <section aria-label="Fundraising">
        <label>
          Support a school, church or club (optional)
          <input
            type="text"
            value={fundraisingCode}
            onChange={(e) => setFundraisingCode(e.target.value)}
            placeholder="Fundraising code"
          />
        </label>
      </section>

      <section aria-label="Feed It Forward">
        <p>Feed It Forward — help a family nearby (optional)</p>
        <label>
          <input type="radio" name="fif" checked={feedItForward === 'none'} onChange={() => setFeedItForward('none')} />
          No thanks
        </label>
        <label>
          <input
            type="radio"
            name="fif"
            checked={feedItForward === 'round_up'}
            onChange={() => setFeedItForward('round_up')}
          />
          Round up
        </label>
        <label>
          <input type="radio" name="fif" checked={feedItForward === 'fixed_1'} onChange={() => setFeedItForward('fixed_1')} />
          +R1
        </label>
        <label>
          <input type="radio" name="fif" checked={feedItForward === 'fixed_5'} onChange={() => setFeedItForward('fixed_5')} />
          +R5
        </label>
        <label>
          <input type="radio" name="fif" checked={feedItForward === 'fixed_10'} onChange={() => setFeedItForward('fixed_10')} />
          +R10
        </label>
      </section>

      <p>
        <strong>Total: R{(subtotal + feedItForwardEstimate).toFixed(2)}</strong>
      </p>

      {error ? <p role="alert">{error}</p> : null}

      <button type="button" onClick={handlePay} disabled={submitting}>
        {submitting ? 'Placing order…' : 'Pay now'}
      </button>
    </main>
  );
}
