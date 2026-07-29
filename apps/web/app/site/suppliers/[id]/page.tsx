// Supplier storefront — feature spec §10.2: photo, bio, location, tier,
// Findi Approved Seller badge, all active listings, ratings.
// Next.js 15+/16: dynamic route params are async — must be awaited.

export default async function SupplierStorefrontPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h1>Supplier {id}</h1>
      {/* TODO: GET /listings?supplierId=..., GET /reviews/supplier/:id */}
    </main>
  );
}
