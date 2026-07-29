// Deal detail page — feature spec §10.2: photos, description, original vs.
// discounted price, quantity available, collection window, supplier info,
// pickup address, cancellation policy, Findi Approved Seller badge (§5.6).
// Next.js 15+/16: dynamic route params are async — must be awaited.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListing } from '../../../../lib/api';
import { AddToBasketButton } from '../../_components/AddToBasketButton';

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id).catch(() => null);
  if (!listing) notFound();

  return (
    <main>
      <h1>{listing.title}</h1>
      <p>
        <Link href={`/suppliers/${listing.supplier.id}`}>{listing.supplier.businessName}</Link>
        {' · '}
        {listing.category.name}
      </p>
      <p>{listing.description}</p>
      <p>
        <span>R{listing.discountedPrice}</span>{' '}
        <span style={{ textDecoration: 'line-through' }}>R{listing.originalPrice}</span> / {listing.unit}
      </p>
      <p>{listing.quantityAvailable} available</p>
      <p>
        Collect between {new Date(listing.collectionWindowStart).toLocaleString()} and{' '}
        {new Date(listing.collectionWindowEnd).toLocaleString()}
      </p>
      <p>Pickup: {listing.pickupAddress}</p>
      {/* TODO: Findi Approved Seller badge (§5.6), photo gallery, cancellation policy copy */}
      <AddToBasketButton listing={listing} />
    </main>
  );
}
