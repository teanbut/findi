// Checkout — feature spec §10.3 / technical plan §4.1: single payment,
// gateway handoff, then POST /checkout on the API creates the order and
// the payment split once the gateway confirms.

export default function CheckoutPage() {
  return (
    <main>
      <h1>Checkout</h1>
      {/* TODO: order summary (itemised per supplier, Feed It Forward line,
          total), hand off to the payment gateway's hosted checkout (gateway
          choice still open — feature spec §18 decision #2), then on
          confirmation call POST /checkout with the basket + fundraisingCode
          + feedItForward payload defined in packages/shared. */}
    </main>
  );
}
