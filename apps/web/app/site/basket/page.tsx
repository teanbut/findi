// Multi-supplier basket — feature spec §10.3: grouped by supplier, since
// each has its own collection window/address.
'use client';

import Link from 'next/link';
import { useBasket, type BasketItem } from '../../../lib/basket-context';

function groupBySupplier(items: BasketItem[]) {
  const groups = new Map<string, { supplierName: string; items: BasketItem[] }>();
  for (const item of items) {
    const group = groups.get(item.supplierId) ?? { supplierName: item.supplierName, items: [] };
    group.items.push(item);
    groups.set(item.supplierId, group);
  }
  return Array.from(groups.entries());
}

export default function BasketPage() {
  const { items, updateQuantity, removeItem, subtotal } = useBasket();

  if (items.length === 0) {
    return (
      <main>
        <h1>Your basket</h1>
        <p>
          Nothing here yet — <Link href="/">browse local deals</Link>.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Your basket</h1>
      {groupBySupplier(items).map(([supplierId, group]) => (
        <section key={supplierId} aria-label={`Items from ${group.supplierName}`}>
          <h2>{group.supplierName}</h2>
          <ul>
            {group.items.map((item) => (
              <li key={item.listingId}>
                {item.title} — R{item.unitPrice.toFixed(2)} ×{' '}
                <input
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.listingId, Number(e.target.value))}
                  style={{ width: '3.5rem' }}
                />
                <button type="button" onClick={() => removeItem(item.listingId)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p>Pickup: {group.items[0].pickupAddress}</p>
        </section>
      ))}

      <p>
        <strong>Subtotal: R{subtotal.toFixed(2)}</strong>
      </p>

      {/* Fundraising code + Feed It Forward toggle live on the checkout
          page itself, next to the payment step — feature spec §6.2/§7. */}
      <Link href="/checkout">Proceed to checkout</Link>
    </main>
  );
}
