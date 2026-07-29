'use client';

import { useState } from 'react';
import { useBasket } from '../../../lib/basket-context';
import type { ListingWithSupplier } from '../../../lib/api';

export function AddToBasketButton({ listing }: { listing: ListingWithSupplier }) {
  const { addItem } = useBasket();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      listingId: listing.id,
      title: listing.title,
      unitPrice: Number(listing.discountedPrice),
      supplierId: listing.supplier.id,
      supplierName: listing.supplier.businessName,
      collectionWindowStart: listing.collectionWindowStart,
      collectionWindowEnd: listing.collectionWindowEnd,
      pickupAddress: listing.pickupAddress,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button type="button" onClick={handleAdd}>
      {added ? 'Added' : 'Add to basket'}
    </button>
  );
}
