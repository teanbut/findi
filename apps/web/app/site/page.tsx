// Home feed — feature spec §10.2: deals near the user, sorted by distance/
// expiry/newest, plus the "Why Buy From Findi?" Impact Dashboard counters
// (feature spec §4.1).
import Link from 'next/link';
import { browseListings } from '../../lib/api';
import { AddToBasketButton } from './_components/AddToBasketButton';

export default async function HomePage() {
  // TODO: filter by the pilot area (Cape Town Northern Suburbs) once
  // location capture exists — GET /listings takes categoryId/supplierId
  // filters today, not a geo radius yet.
  const listings = await browseListings().catch(() => []);

  return (
    <main>
      <h1>Find local. Save more.</h1>

      {/* TODO: Impact Dashboard — local suppliers supported, food rescued,
          money saved, families helped, schools supported, money raised
          (feature spec §4.1) — populate once the ledger/analytics
          endpoints exist. */}
      <section aria-label="Impact Dashboard" />

      {/* TODO: category quick-links, Local Boxes featured section (feature
          spec §8) above the listing grid below. */}
      <section aria-label="Nearby deals">
        {listings.length === 0 ? (
          <p>No listings yet — the first ones show up here once a supplier is approved and lists something.</p>
        ) : (
          <ul>
            {listings.map((listing) => (
              <li key={listing.id}>
                <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
                {' — '}
                <span>{listing.supplier.businessName}</span>
                {' — '}
                <span>R{listing.discountedPrice}</span>
                {' '}
                <span style={{ textDecoration: 'line-through' }}>R{listing.originalPrice}</span>
                <AddToBasketButton listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
