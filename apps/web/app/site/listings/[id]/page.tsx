// Deal detail page — feature spec §10.2: photos, description, original vs.
// discounted price, quantity available, collection window, supplier info,
// pickup address, cancellation policy, Findi Approved Seller badge (§5.6).
// Next.js 15+/16: dynamic route params are async — must be awaited.

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h1>Listing {id}</h1>
      {/* TODO: GET /listings/:id, "Add to basket" action */}
    </main>
  );
}
