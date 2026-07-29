// Multi-supplier basket — feature spec §10.3: grouped by supplier, since
// each has its own collection window/address.

export default function BasketPage() {
  return (
    <main>
      <h1>Your basket</h1>
      {/* TODO: client-side basket state (items grouped by supplier),
          Fundraising code field, Feed It Forward contribution toggle
          (round-up or R1/R5/R10), "Proceed to checkout" -> /checkout */}
    </main>
  );
}
