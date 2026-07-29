// One login system for suppliers, fundraising organisations and admin staff
// (feature spec §1) — role returned by POST /auth/login decides which
// dashboard renders next.

export default function PortalLoginPage() {
  return (
    <main>
      <h1>Findi Portal</h1>
      {/* TODO: email/password form -> POST /auth/login, then redirect by
          role: supplier -> /portal/dashboard, fundraising_org ->
          /portal/fundraising, admin -> /portal/admin */}
    </main>
  );
}
