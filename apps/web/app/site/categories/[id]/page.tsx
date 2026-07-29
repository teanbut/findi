// Category browse — feature spec §10.2.

export default function CategoryPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h1>Category: {params.id}</h1>
      {/* TODO: GET /listings?categoryId=... , filters (price, distance,
          collection window, dietary tags) */}
    </main>
  );
}
