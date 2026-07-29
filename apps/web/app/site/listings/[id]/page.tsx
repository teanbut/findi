// Deal detail page — feature spec §10.2: photos, description, original vs.
// discounted price, quantity available, collection window, supplier info,
// pickup address, cancellation policy, Findi Approved Seller badge (§5.6).

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h1>Listing {params.id}</h1>
      {/* TODO: GET /listings/:id, "Add to basket" action */}
    </main>
  );
}
