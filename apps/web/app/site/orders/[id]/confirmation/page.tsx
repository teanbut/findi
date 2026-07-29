// Order confirmation — feature spec §10.3: confirmation screen after
// checkout, with collection instructions per supplier.
// Next.js 15+/16: dynamic route params are async — must be awaited.
import Link from 'next/link';

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h1>Order confirmed</h1>
      <p>Order #{id} is in. A receipt has been emailed to you.</p>
      {/* TODO: GET /orders/:id (not yet implemented — see orders.controller.ts
          TODOs) to show the real itemised summary, per-supplier collection
          windows/addresses, and QR/PIN collection codes (feature spec §10.3). */}
      <p>
        <Link href="/">Keep browsing</Link>
      </p>
    </main>
  );
}
