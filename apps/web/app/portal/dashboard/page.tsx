// Supplier dashboard shell — feature spec §11.4 "Supplier Insights":
// today's orders, sales snapshot, Findi Wallet balance.

export default function SupplierDashboardPage() {
  return (
    <main>
      <h1>Supplier dashboard</h1>
      {/* TODO: GET /wallet/:supplierId, order queue, sales trends —
          only reachable once SuppliersService.assertCanAccessPortal()
          passes (feature spec §5.2 stage 4, "Login Activated") */}
    </main>
  );
}
