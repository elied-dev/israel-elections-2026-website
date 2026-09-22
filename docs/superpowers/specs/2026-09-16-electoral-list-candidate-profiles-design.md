# Electoral List and Candidate Profiles Design

**Issue:** [#19 — Publish Electoral List and Candidate profiles](https://github.com/elied-dev/israel-elections-2026-website/issues/19)

## Goal

Let visitors open an approved Electoral List and inspect its Election Edition, represented Political Parties, complete current official Candidate order, and preserved effective-dated Candidacy history. Every Candidate links to a stable Person identity.

## Scope

This work adds the smallest normalized Political Actor and Candidacy slice needed by issue #19. It does not build full Person or Political Party profiles, profile editing, localization, policy positions, or Public Record content.

## Domain model

### Political Actor identity

`political_actors` stores the stable product identity shared by Persons, Political Parties, and Electoral Lists. Each row has:

- stable numeric ID
- actor type: `person`, `political_party`, or `electoral_list`
- current display name
- current slug

`political_actor_slugs` maps current and historical slugs to one Political Actor. A slug is globally unique. Historical slugs remain resolvable but redirect to the actor's current slug.

`persons` and `political_parties` are typed identity tables keyed to a Political Actor. Existing `electoral_lists` gains a required unique Political Actor reference. Database constraints ensure the referenced actor is unique to that typed record; application writes must use the matching actor type.

### Represented Political Parties

`electoral_list_parties` is a many-to-many relationship between an Electoral List and represented Political Parties. Each relationship stores:

- Electoral List ID
- Political Party ID
- authoritative source ID
- review state

Only approved relationships render publicly. The profile shows party names as distinct organizations, without implying that the Electoral List and Political Party are the same identity. Effective-dated party-representation history is outside issue #19.

### Candidacy and history

`candidacies` is the stable relationship between exactly one Person, one Electoral List, and the Electoral List's Election Edition. A uniqueness constraint prevents duplicate Candidacies for the same Person and list.

`candidacy_revisions` preserves changes without rewriting history. Each append-only row stores:

- Candidacy ID
- official position
- status: `active`, `withdrawn`, `disqualified`, or `replaced`
- effective-from timestamp
- optional effective-to timestamp
- authoritative source ID
- review state

The current public Candidate order consists of approved revisions with no `effective_to` and status `active`, ordered by official position. All other approved revisions display in a separate Candidacy history section grouped by Person. That history includes closed position revisions and open `withdrawn`, `disqualified`, or `replaced` revisions, so former Candidates remain inspectable without appearing in the current ordered slate.

Database constraints prevent more than one open revision for a Candidacy. The schema also carries the Electoral List ID on each revision through a composite foreign key to its Candidacy, allowing a partial unique index to prevent duplicate approved active current positions within one Electoral List. Mutations must close a current revision before appending its replacement. Issue #19 adds reads and fixtures only; editorial mutation workflows arrive in later issues.

## Routes and canonical URLs

One dynamic route, `/electoral-lists/[reference]`, accepts either:

- a numeric Electoral List ID, or
- a current or historical slug.

Resolution behavior:

- Numeric ID: resolve the Electoral List, then redirect to `/electoral-lists/<current-slug>`.
- Current slug: render directly.
- Historical slug: resolve the same Electoral List, then redirect to its current slug.
- Unknown reference, wrong Political Actor type, or unapproved Electoral List: return Next.js `notFound()`.

The Election Edition directory links each Electoral List name to its canonical current-slug route. Numeric identity remains stable even when names or slugs change, while canonical public URLs remain readable and unique.

## Electoral List profile

The server-rendered profile presents:

1. Electoral List name and ballot identifier.
2. The single Election Edition to which it belongs.
3. Represented Political Parties, clearly labelled as separate organizations.
4. Current official Candidate order.
5. Each current Candidate's active status and effective date.
6. A Candidacy history section grouped by Person, containing every approved revision that is not the current active revision.
7. Existing neutral methodology and non-affiliation disclosure.

Missing represented parties or current Candidates use neutral empty states. The product does not infer missing facts.

Candidate names link to `/people/<person-id>`. Issue #19 adds a minimal server-rendered Person identity page containing the stable Person name and a notice that detailed profile information is not yet available. Issue #20 will replace that minimal page with the complete stable Person profile.

## Responsive and accessible presentation

Use semantic headings, lists, links, and tables where appropriate. Candidate history remains in the document flow beneath its Candidate rather than hidden behind client-only interaction. Narrow screens may wrap or horizontally scroll tabular content, but no represented party, Candidate, status, position, effective date, or historical revision disappears. No client-side JavaScript is required for core information.

## Server-side data flow

Server-side query modules perform all reads through Drizzle:

1. Resolve the route reference to a Political Actor and Electoral List.
2. Enforce approved publication state before returning profile data.
3. Load the Election Edition, approved represented-party links, stable Candidacies, approved current revisions, and approved history.
4. Return one page-specific read model to the Server Component.

The existing directory query adds the current slug and emits canonical links. Do not introduce repository interfaces, adapters, a generic profile service, event sourcing, or a client data-fetching layer.

## Provenance and publication boundaries

- An Electoral List must be approved to appear in the directory or resolve through a direct route.
- Represented-party relationships and Candidacy revisions require an authoritative source and explicit review state.
- Only approved relationships and revisions render publicly.
- Pending or rejected records never appear in direct-route output.
- Existing authoritative source metadata remains the provenance boundary for official election facts.

## Testing

The public seam is the rendered Next.js route backed by the real migrated PostgreSQL schema.

Focused tests use disposable PostgreSQL and seed:

- one approved Electoral List with current and historical slugs
- represented Political Parties plus an unapproved relationship
- Persons and Candidacies with current official order
- position changes, withdrawal, disqualification, and replacement history
- an unapproved Electoral List

Tests verify:

- numeric references redirect to the canonical slug
- current slugs render directly
- historical slugs redirect to the current slug
- unknown and unapproved references return 404
- the directory links to canonical slug routes
- represented Political Parties remain distinct from the Electoral List
- every current Candidate appears in official position order and links to a Person
- closed position revisions and open withdrawn, disqualified, or replaced revisions remain visible without entering the current order
- unapproved relationships/revisions remain private
- neutral empty states render when reviewed data is unavailable
- semantic markup retains all information without viewport-dependent JavaScript
- the minimal Person identity route resolves each Candidate link

Verification runs focused tests, the full suite, TypeScript, the production build, and the production smoke path.

## Explicit non-goals

- Full Person profiles, Party Affiliation, Office Tenure, or Current Political Status
- Full Political Party profile routes
- Editorial create/update workflows
- Effective-dated represented-party history
- Translated names or Language Preference behavior
- Styling systems, client-side responsive logic, or mobile-specific content variants
- Candidate photographs
- Policy Positions, Public Claims, or Public Record integration
