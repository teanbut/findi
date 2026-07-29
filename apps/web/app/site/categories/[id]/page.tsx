// Category browse — feature spec §10.2.
// Next.js 15+/16: dynamic route params are async — must be awaited.

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h1>Category: {id}</h1>
      {/* TODO: GET /listings?categoryId=... , filters (price, distance,
          collection window, dietary tags) */}
    </main>
  );
}
