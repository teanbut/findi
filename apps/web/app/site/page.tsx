// Home feed — feature spec §10.2: deals near the user, sorted by distance/
// expiry/newest, plus the "Why Buy From Findi?" Impact Dashboard counters
// (feature spec §4.1).

async function getNearbyListings() {
  // TODO: call GET /listings from the API, filtered by the pilot area
  // (Cape Town Northern Suburbs) once location capture exists.
  return [];
}

export default async function HomePage() {
  const listings = await getNearbyListings();

  return (
    <main>
      <h1>Find local. Save more.</h1>

      {/* TODO: Impact Dashboard — local suppliers supported, food rescued,
          money saved, families helped, schools supported, money raised */}
      <section aria-label="Impact Dashboard" />

      {/* TODO: category quick-links, Local Boxes featured section (feature
          spec §8), then the listing grid below */}
      <section aria-label="Nearby deals">
        {listings.length === 0 ? (
          <p>No deals loaded yet — wire this up to GET /listings.</p>
        ) : null}
      </section>
    </main>
  );
}
