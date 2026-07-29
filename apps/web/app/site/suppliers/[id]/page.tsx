// Supplier storefront — feature spec §10.2: photo, bio, location, tier,
// Findi Approved Seller badge, all active listings, ratings.

export default function SupplierStorefrontPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h1>Supplier {params.id}</h1>
      {/* TODO: GET /listings?supplierId=..., GET /reviews/supplier/:id */}
    </main>
  );
}
