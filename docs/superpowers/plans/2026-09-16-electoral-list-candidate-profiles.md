# Electoral List and Candidate Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish approved Electoral List profiles with represented Political Parties, canonical ID/slug routing, complete current Candidate order, preserved Candidacy history, and working Person identity links.

**Architecture:** Extend the existing PostgreSQL model with the smallest normalized Political Actor, slug, represented-party, Candidacy, and immutable-revision tables required by issue #19. Resolve numeric and historical references server-side, redirect them to the current slug, and render one server-side profile read model. Keep the directory and minimal Person identity routes thin and server-rendered.

**Tech Stack:** TypeScript 7, Next.js 16 App Router, React 19 Server Components, Drizzle ORM 0.45, PostgreSQL 16, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-electoral-list-candidate-profiles-design.md`

## Global Constraints

- Work on `main`, as explicitly authorized by the user.
- Use the domain terms `Political Actor`, `Political Party`, `Electoral List`, `Person`, `Candidate`, and `Candidacy` exactly as defined in `CONTEXT.md`.
- Publish only approved Electoral Lists, represented-party links, and Candidacy revisions.
- Numeric and historical-slug routes redirect to the current slug; unknown and unapproved references return 404.
- The current Candidate order contains only approved, open, active revisions ordered by official position.
- Every other approved revision remains visible in Candidacy history.
- Do not add a repository interface, generic profile framework, client fetch layer, styling dependency, or full Person profile.

---

## File Map

- Modify `src/db/schema.ts`: normalized Political Actor, slug, represented-party, Candidacy, and revision tables and constraints.
- Create `drizzle/0002_electoral-list-profiles.sql` and update `drizzle/meta/*`: generated migration plus safe backfill for existing Electoral Lists.
- Modify `test/election-directory.test.ts`: satisfy the new Political Actor foreign key and verify canonical links.
- Create `test/electoral-list-profile.test.ts`: route-level profile, redirect, privacy, ordering, and history coverage.
- Create `src/electoral-list-profile.ts`: route resolution and page-specific Drizzle read model.
- Create `src/app/electoral-lists/[reference]/page.tsx`: canonical profile route.
- Modify `src/election-directory.ts`: include current slugs.
- Modify `src/app/page.tsx`: link directory entries to canonical profiles.
- Create `src/person-identity.ts`: minimal public Person lookup constrained to publicly visible Candidacies.
- Create `src/app/people/[id]/page.tsx`: minimal Person identity page owned by issue #19.

### Task 1: Add the normalized profile schema

**Files:**
- Modify: `src/db/schema.ts`
- Create: `test/electoral-profile-schema.test.ts`
- Create: `drizzle/0002_electoral-list-profiles.sql`
- Create: `drizzle/meta/0002_snapshot.json`
- Modify: `drizzle/meta/_journal.json`
- Modify: `test/election-directory.test.ts`

**Interfaces:**
- Produces tables exported as `politicalActors`, `politicalActorSlugs`, `persons`, `politicalParties`, `electoralListParties`, `candidacies`, and `candidacyRevisions`.
- Keeps `electoralLists.id` as both Electoral List ID and Political Actor ID, avoiding a second identity column.
- `candidacyRevisions` repeats `electoralListId` under a composite foreign key to support a database-enforced unique current position.

- [ ] **Step 1: Write the failing schema behavior test**

Create `test/electoral-profile-schema.test.ts` with one fixture that inserts an Electoral List Political Actor, two Person actors, one Political Party actor, represented-party provenance, two Candidacies, and revisions. Assert:

```ts
await assert.rejects(
  db.insert(candidacyRevisions).values({
    id: 19_099,
    candidacyId: 19_002,
    electoralListId: 19_001,
    position: 1,
    status: 'active',
    effectiveFrom: new Date('2026-09-02T00:00:00Z'),
    sourceId: 19_001,
    reviewState: 'approved',
  }),
  /candidacy_revision_current_position_unique/,
);

await assert.rejects(
  db.insert(candidacies).values({
    id: 19_099,
    personId: 19_011,
    electoralListId: 19_001,
    editionId: 19_001,
  }),
  /candidacy_electoral_list_edition_fk/,
);
```

Use IDs in the `19_000` range, insert a second Election Edition with ID `19_001` before testing the mismatched list/edition pair, and delete fixtures in reverse foreign-key order in `after()`. The successful fixture must include one closed position revision followed by one open active revision so the migration proves history can coexist with a current state.

- [ ] **Step 2: Run the schema test and verify RED**

Run against a migrated disposable PostgreSQL database:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/electoral-profile-schema.test.ts
```

Expected: FAIL because the new schema exports and database tables do not exist.

- [ ] **Step 3: Extend `src/db/schema.ts` minimally**

Add `sql` from `drizzle-orm` and the required Drizzle builders (`check`, `foreignKey`, `primaryKey`, `unique`, `uniqueIndex`). Define:

```ts
export const politicalActors = pgTable('political_actors', {
  id: integer('id').primaryKey(),
  type: text('type').notNull(),
  currentDisplayName: text('current_display_name').notNull(),
  currentSlug: text('current_slug').notNull().unique(),
}, (table) => [
  check('political_actor_type_check', sql`${table.type} in ('person', 'political_party', 'electoral_list')`),
  check('political_actor_slug_not_numeric_check', sql`${table.currentSlug} !~ '^[0-9]+$'`),
]);

export const politicalActorSlugs = pgTable('political_actor_slugs', {
  slug: text('slug').primaryKey(),
  actorId: integer('actor_id').notNull().references(() => politicalActors.id),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validTo: timestamp('valid_to', { withTimezone: true }),
}, (table) => [
  check('political_actor_slug_dates_check', sql`${table.validTo} is null or ${table.validTo} > ${table.validFrom}`),
]);

export const persons = pgTable('persons', {
  id: integer('id').primaryKey().references(() => politicalActors.id),
});

export const politicalParties = pgTable('political_parties', {
  id: integer('id').primaryKey().references(() => politicalActors.id),
});
```

Change `electoralLists.id` to reference `politicalActors.id`, and add a named unique constraint over `(id, editionId)`.

Define `electoralListParties` with a composite primary key over `(electoralListId, politicalPartyId)`, required `sourceId`, and required `reviewState`.

Define `candidacies` with `id`, `personId`, `electoralListId`, and `editionId`; add:

- unique `(personId, electoralListId)`
- unique `(id, electoralListId)`
- composite FK `(electoralListId, editionId)` → `electoralLists(id, editionId)` named `candidacy_electoral_list_edition_fk`

Define `candidacyRevisions` with `id`, `candidacyId`, `electoralListId`, positive `position`, constrained `status`, `effectiveFrom`, optional `effectiveTo`, required `sourceId`, and required `reviewState`. Add:

```ts
foreignKey({
  columns: [table.candidacyId, table.electoralListId],
  foreignColumns: [candidacies.id, candidacies.electoralListId],
  name: 'candidacy_revision_candidacy_list_fk',
}),
uniqueIndex('candidacy_revision_open_unique')
  .on(table.candidacyId)
  .where(sql`${table.effectiveTo} is null`),
uniqueIndex('candidacy_revision_current_position_unique')
  .on(table.electoralListId, table.position)
  .where(sql`${table.effectiveTo} is null and ${table.status} = 'active' and ${table.reviewState} = 'approved'`),
check('candidacy_revision_position_check', sql`${table.position} > 0`),
check('candidacy_revision_status_check', sql`${table.status} in ('active', 'withdrawn', 'disqualified', 'replaced')`),
check('candidacy_revision_dates_check', sql`${table.effectiveTo} is null or ${table.effectiveTo} > ${table.effectiveFrom}`),
```

- [ ] **Step 4: Generate and make the migration safe for existing lists**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:generate -- --name electoral-list-profiles
```

Confirm Drizzle creates `drizzle/0002_electoral-list-profiles.sql` and snapshot/journal changes. Before the generated foreign key from `electoral_lists.id` to `political_actors.id`, insert safe identities for any existing lists:

```sql
INSERT INTO "political_actors" ("id", "type", "current_display_name", "current_slug")
SELECT "id", 'electoral_list', "name", 'electoral-list-' || "id"
FROM "electoral_lists";
--> statement-breakpoint
INSERT INTO "political_actor_slugs" ("slug", "actor_id", "valid_from")
SELECT 'electoral-list-' || "id", "id", now()
FROM "electoral_lists";
--> statement-breakpoint
```

Do not seed Political Parties, Persons, or Candidacies.

- [ ] **Step 5: Update the existing directory fixture**

In `test/election-directory.test.ts`, insert three `politicalActors` and `politicalActorSlugs` before inserting Electoral Lists. Use current slugs `approved-complete-list`, `approved-incomplete-list`, and `pending-list`. Delete slug and actor fixtures after deleting Electoral Lists. This preserves issue #18 coverage under the new FK.

- [ ] **Step 6: Verify GREEN and migration compatibility**

Recreate the disposable database from empty, then run:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/electoral-profile-schema.test.ts test/election-directory.test.ts
```

Expected: both test files pass; duplicate current positions and mismatched Election Editions are rejected by named constraints.

- [ ] **Step 7: Commit the schema slice**

```bash
git add src/db/schema.ts drizzle test/electoral-profile-schema.test.ts test/election-directory.test.ts
git commit -m "feat: model Electoral List candidacy history"
```

### Task 2: Resolve and render Electoral List profiles

**Files:**
- Create: `test/electoral-list-profile.test.ts`
- Create: `src/electoral-list-profile.ts`
- Create: `src/app/electoral-lists/[reference]/page.tsx`

**Interfaces:**
- Produces `getElectoralListProfile(reference: string)` returning `null` or `{ canonicalSlug, list: { id, name, ballotIdentifier }, edition: { id, name }, parties: Array<{ id, name }>, currentCandidates: Array<{ personId, personName, position, status, effectiveFrom }>, history: Array<{ personId, personName, revisions: Array<{ id, position, status, effectiveFrom, effectiveTo }> }> }`.
- Route input type: `{ params: Promise<{ reference: string }> }`.
- Redirects and 404s remain route responsibilities; the query returns data only.

- [ ] **Step 1: Write the failing profile-route test**

Seed one approved Electoral List actor with current slug `future-list`, historical slug `former-list`, two approved represented Political Parties, one pending represented party, and these Candidacies:

- Person A: closed active position 2, then open active position 1.
- Person B: open active position 2.
- Person C: closed active position 3, then open withdrawn position 3.
- Person D: open disqualified position 4.
- Person E: open replaced position 5.
- Person F: one pending open active revision that must not render.

Render the current-slug page directly:

```ts
const html = renderToStaticMarkup(await ElectoralListPage({
  params: Promise.resolve({ reference: 'future-list' }),
}));

assert.ok(html.indexOf('Person A') < html.indexOf('Person B'));
assert.match(html, /Represented Political Parties/);
assert.match(html, /Party One/);
assert.doesNotMatch(html, /Pending Party/);
assert.match(html, /href="\/people\/19211"/);
assert.match(html, /Candidacy history/);
assert.match(html, /Position 2/);
assert.match(html, /Withdrawn/);
assert.match(html, /Disqualified/);
assert.match(html, /Replaced/);
assert.doesNotMatch(html, /Pending Person/);
```

Add a helper that captures Next navigation exceptions by their `digest` string, then assert:

- numeric `19201` redirects to `/electoral-lists/future-list`
- historical `former-list` redirects to `/electoral-lists/future-list`
- unknown slug produces a 404 digest
- an unapproved Electoral List produces a 404 digest

- [ ] **Step 2: Run the focused route test and verify RED**

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/electoral-list-profile.test.ts
```

Expected: FAIL because the profile query and route do not exist.

- [ ] **Step 3: Implement the page-specific profile query**

Create `src/electoral-list-profile.ts`.

Resolve numeric references by `electoralLists.id`; resolve text references through `politicalActorSlugs.slug`. Both branches must join `politicalActors`, `electoralLists`, and `electionEditions`, and require `electoralLists.reviewState = 'approved'`.

Load approved represented parties ordered by Political Actor display name. Load approved Candidacy revisions joined to `candidacies`, `persons`, and Person `politicalActors`, ordered by Person name then effective date.

Split revisions in application code:

```ts
const currentCandidates = revisions
  .filter((revision) => revision.status === 'active' && revision.effectiveTo === null)
  .sort((left, right) => left.position - right.position);

const historicalRevisions = revisions.filter(
  (revision) => revision.status !== 'active' || revision.effectiveTo !== null,
);
const groupedHistory = new Map<number, {
  personId: number;
  personName: string;
  revisions: typeof historicalRevisions;
}>();
for (const revision of historicalRevisions) {
  const group = groupedHistory.get(revision.personId) ?? {
    personId: revision.personId,
    personName: revision.personName,
    revisions: [],
  };
  group.revisions.push(revision);
  groupedHistory.set(revision.personId, group);
}
const history = [...groupedHistory.values()];
```

Return `canonicalSlug` from the Electoral List Political Actor. Do not format dates or status labels in the query.

- [ ] **Step 4: Implement the canonical profile route**

Create `src/app/electoral-lists/[reference]/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation';
import { getElectoralListProfile } from '@/electoral-list-profile';

export default async function ElectoralListPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const profile = await getElectoralListProfile(reference);
  if (!profile) notFound();
  if (reference !== profile.canonicalSlug) redirect(`/electoral-lists/${profile.canonicalSlug}`);
  const date = (value: Date) => value.toISOString().slice(0, 10);
  const label = (value: string) => value[0].toUpperCase() + value.slice(1);

  return (
    <main>
      <h1>{profile.list.name}</h1>
      <p>Ballot identifier: {profile.list.ballotIdentifier ?? 'Not yet available'}</p>
      <p>Election Edition: {profile.edition.name}</p>

      <section aria-labelledby="parties-heading">
        <h2 id="parties-heading">Represented Political Parties</h2>
        {profile.parties.length ? (
          <ul>{profile.parties.map((party) => <li key={party.id}>{party.name}</li>)}</ul>
        ) : <p>No reviewed represented Political Parties are available yet.</p>}
      </section>

      <section aria-labelledby="candidates-heading">
        <h2 id="candidates-heading">Current official Candidate order</h2>
        {profile.currentCandidates.length ? (
          <ol>{profile.currentCandidates.map((candidate) => (
            <li key={candidate.personId}>
              <a href={`/people/${candidate.personId}`}>{candidate.personName}</a>
              {' — '}Position {candidate.position}; {label(candidate.status)} from {date(candidate.effectiveFrom)}
            </li>
          ))}</ol>
        ) : <p>No reviewed current Candidates are available yet.</p>}
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Candidacy history</h2>
        {profile.history.length ? profile.history.map((candidate) => (
          <section key={candidate.personId} aria-labelledby={`person-${candidate.personId}-history`}>
            <h3 id={`person-${candidate.personId}-history`}>{candidate.personName}</h3>
            <ul>{candidate.revisions.map((revision) => (
              <li key={revision.id}>
                Position {revision.position}; {label(revision.status)} from {date(revision.effectiveFrom)} to {revision.effectiveTo ? date(revision.effectiveTo) : 'Current'}
              </li>
            ))}</ul>
          </section>
        )) : <p>No reviewed Candidacy history is available yet.</p>}
      </section>

      <section aria-labelledby="methodology-heading">
        <h2 id="methodology-heading">Methodology and non-affiliation</h2>
        <p>This profile presents reviewed official election facts. It does not rank, endorse, or recommend any Electoral List or Candidate. This is an independent information service, not an official CEC service or political campaign.</p>
      </section>
    </main>
  );
}
```

Keep all content in server-rendered document flow; add no viewport-specific branches or Client Components.

- [ ] **Step 5: Verify GREEN**

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/electoral-list-profile.test.ts
```

Expected: profile, redirect, privacy, ordering, and history assertions pass.

- [ ] **Step 6: Commit the profile slice**

```bash
git add src/electoral-list-profile.ts src/app/electoral-lists test/electoral-list-profile.test.ts
git commit -m "feat: publish Electoral List profiles"
```

### Task 3: Link the directory and publish minimal Person identities

**Files:**
- Modify: `src/election-directory.ts`
- Modify: `src/app/page.tsx`
- Modify: `test/election-directory.test.ts`
- Create: `src/person-identity.ts`
- Create: `src/app/people/[id]/page.tsx`
- Modify: `test/electoral-list-profile.test.ts`

**Interfaces:**
- Directory list entries add `currentSlug: string`.
- Produces `getPublicPersonIdentity(id: number): Promise<{ id: number; name: string } | null>`.
- Person route input type: `{ params: Promise<{ id: string }> }`.

- [ ] **Step 1: Extend tests and verify RED**

In `test/election-directory.test.ts`, assert:

```ts
assert.match(html, /href="\/electoral-lists\/approved-complete-list"/);
```

In `test/electoral-list-profile.test.ts`, render Person A's route and assert its stable name and the neutral notice `Detailed profile information is not yet available.` Also assert unknown, nonnumeric, and Person identities without an approved public Candidacy produce 404.

Run both focused files. Expected: FAIL because directory entries are not links and the Person route does not exist.

- [ ] **Step 2: Add canonical directory links**

In `src/election-directory.ts`, join `politicalActors` on `electoralLists.id = politicalActors.id` and select `currentSlug`. In `src/app/page.tsx`, replace each list heading with:

```tsx
<h3><a href={`/electoral-lists/${list.currentSlug}`}>{list.name}</a></h3>
```

Use a plain anchor; no client navigation behavior is required.

- [ ] **Step 3: Add the minimal public Person query and page**

Create `src/person-identity.ts`. Parse no route strings here; accept a number. Join `persons` to `politicalActors`, `candidacies`, `candidacyRevisions`, and approved `electoralLists`. Return a distinct Person only when at least one approved Candidacy revision belongs to an approved Electoral List.

Create `src/app/people/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getPublicPersonIdentity } from '@/person-identity';

export default async function PersonIdentityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const person = await getPublicPersonIdentity(Number(id));
  if (!person) notFound();

  return (
    <main>
      <h1>{person.name}</h1>
      <p>Detailed profile information is not yet available.</p>
    </main>
  );
}
```

- [ ] **Step 4: Verify focused behavior**

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/election-directory.test.ts test/electoral-list-profile.test.ts
```

Expected: canonical directory link, profile links, and minimal Person routes pass.

- [ ] **Step 5: Run full verification**

With a fresh disposable PostgreSQL database:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm test
npm run typecheck
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run build
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm start
SMOKE_URL=http://localhost:3000 npm run smoke
```

Expected: all tests pass, TypeScript and production build exit zero, `/` remains dynamic server-rendered output, and smoke passes.

- [ ] **Step 6: Run two-axis code review**

Run `/code-review` from fixed point `b092044` against issue #19 and repository standards. Fix confirmed Standards or Spec findings, then repeat Step 5.

- [ ] **Step 7: Commit the final slice**

```bash
git add src/election-directory.ts src/app/page.tsx test/election-directory.test.ts src/person-identity.ts src/app/people test/electoral-list-profile.test.ts
git commit -m "feat: link Candidates to Person identities"
```

- [ ] **Step 8: Close issue #19**

```bash
gh issue comment 19 --body "Published canonical Electoral List profiles with represented Political Parties, complete current Candidate ordering, preserved effective-dated Candidacy history, and stable Person links. Full tests, typecheck, build, and production smoke pass."
gh issue close 19
```
