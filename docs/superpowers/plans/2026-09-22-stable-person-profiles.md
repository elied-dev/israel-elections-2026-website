# Stable Person Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the minimal Person identity route with a stable, reviewed Person profile containing dated names, Party Affiliations, Office Tenures, Candidacies, Current Political Status, and earlier Political Status history.

**Architecture:** Add normalized effective-dated relationship tables and immutable Reviewer-approved Political Status snapshots to the existing PostgreSQL schema. One server-side Person-profile query reads only public records and returns a page-specific model. The existing `/people/[id]` Server Component formats dates by explicit precision and renders semantic history sections without client code.

**Tech Stack:** TypeScript 7, Next.js 16 App Router, React 19 Server Components, Drizzle ORM 0.45, PostgreSQL 16, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-22-stable-person-profiles-design.md`

## Global Constraints

- Work on `main`, as explicitly authorized by the user.
- Use `Person`, `Party Affiliation`, `Office Tenure`, `Candidacy`, `Current Political Status`, and `Political Actor` as defined in `CONTEXT.md`.
- Public reads include only `review_state = 'approved'` rows at every boundary.
- Store uncertain dates as a date plus exactly one precision: `day`, `month`, `year`, or `unknown`; never invent a missing day or month.
- Current Political Status is Reviewer-approved and never automatically changes from underlying data.
- Permit legitimate current overlaps; do not force one party, office, or Candidacy.
- Do not add Party profile routes, editorial mutation UI, automatic status derivation, translations, Public Claims, client fetching, or a styling dependency.

---

## File Map

- Modify `src/db/schema.ts`: Person names, Party Affiliations, Office Tenures, Political Status snapshots, status items, constraints, and indexes.
- Create `drizzle/0003_stable-person-profiles.sql` and generated Drizzle metadata.
- Modify `test/electoral-profile-schema.test.ts`: fixture cleanup and migration constraint coverage.
- Create `src/date-precision.ts`: exact public date-precision formatter.
- Create `test/date-precision.test.ts`: direct public formatter behavior.
- Create `src/person-profile.ts`: approved-only Person profile read model.
- Modify `src/app/people/[id]/page.tsx`: replace the placeholder identity notice with the full profile.
- Modify `test/electoral-list-profile.test.ts`: fixture new profile data and rendered Person-profile route assertions.

### Task 1: Model dated Person history and Political Status snapshots

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0003_stable-person-profiles.sql`
- Create: `drizzle/meta/0003_snapshot.json`
- Modify: `drizzle/meta/_journal.json`
- Modify: `test/electoral-profile-schema.test.ts`
- Modify: `test/migrations.test.ts`

**Interfaces:**
- Produces `personNames`, `partyAffiliations`, `officeTenures`, `politicalStatuses`, and `politicalStatusItems` exports.
- All date-bearing rows use `{ date: timestamp | null, precision: text }` pairs.
- `politicalStatusItems` references exactly one relationship row and preserves an authoritative source plus review state.

- [ ] **Step 1: Write failing database-constraint tests**

Extend `test/electoral-profile-schema.test.ts` with these imports:

```ts
import {
  officeTenures,
  partyAffiliations,
  personNames,
  politicalStatusItems,
  politicalStatuses,
} from '../src/db/schema';
```

Extend fixture cleanup to delete status items, statuses, names, affiliations, and offices before deleting existing Person fixtures. Add one approved Party Affiliation, Office Tenure, Person name, and approved Political Status snapshot for `personAId`.

Add helper assertions using existing `rejectsWithConstraint()`:

```ts
test('a known-precision name requires its date', async () => {
  await assert.rejects(
    db.insert(personNames).values({
      id: 20_099,
      personId: personAId,
      name: 'Undated known name',
      nameType: 'name',
      validFrom: null,
      validFromPrecision: 'year',
      validTo: null,
      validToPrecision: 'unknown',
      sourceId,
      reviewState: 'approved',
    }),
    rejectsWithConstraint('person_name_valid_from_precision_check'),
  );
});

test('a Political Status item references exactly one underlying record', async () => {
  await assert.rejects(
    db.insert(politicalStatusItems).values({
      id: 20_099,
      politicalStatusId: 20_001,
      partyAffiliationId: 20_001,
      officeTenureId: 20_001,
      candidacyId: null,
      sourceId,
      reviewState: 'approved',
    }),
    rejectsWithConstraint('political_status_item_one_reference_check'),
  );
});

test('a Person has at most one approved current Political Status', async () => {
  await assert.rejects(
    db.insert(politicalStatuses).values({
      id: 20_099,
      personId: personAId,
      summary: 'Duplicate current status',
      verifiedAt: new Date('2026-09-02T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
      supersededAt: null,
    }),
    rejectsWithConstraint('political_status_current_approved_unique'),
  );
});
```

- [ ] **Step 2: Run focused tests and verify RED**

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/electoral-profile-schema.test.ts
```

Expected: FAIL because the schema exports and database tables do not exist.

- [ ] **Step 3: Add the schema exports and constraints**

In `src/db/schema.ts`, add:

```ts
export const personNames = pgTable('person_names', {
  id: integer('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id),
  name: text('name').notNull(),
  nameType: text('name_type').notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validFromPrecision: text('valid_from_precision').notNull(),
  validTo: timestamp('valid_to', { withTimezone: true }),
  validToPrecision: text('valid_to_precision').notNull(),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('person_name_type_check', sql`${table.nameType} in ('name', 'alias')`),
  check('person_name_valid_from_precision_check', sql`(${table.validFromPrecision} = 'unknown') = (${table.validFrom} is null)`),
  check('person_name_valid_to_precision_check', sql`(${table.validToPrecision} = 'unknown') = (${table.validTo} is null)`),
  check('person_name_precision_check', sql`${table.validFromPrecision} in ('day', 'month', 'year', 'unknown') and ${table.validToPrecision} in ('day', 'month', 'year', 'unknown')`),
  check('person_name_dates_check', sql`${table.validTo} is null or ${table.validFrom} is null or ${table.validTo} >= ${table.validFrom}`),
]);
```

Define `partyAffiliations` and `officeTenures` with the same `validFrom`, `validFromPrecision`, `validTo`, `validToPrecision`, `sourceId`, and `reviewState` fields and equivalent named precision/date checks. `partyAffiliations` additionally references `politicalParties.id`; `officeTenures` has required `officeTitle: text`.

Define:

```ts
export const politicalStatuses = pgTable('political_statuses', {
  id: integer('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id),
  summary: text('summary').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull(),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
  supersededAt: timestamp('superseded_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('political_status_current_approved_unique')
    .on(table.personId)
    .where(sql`${table.reviewState} = 'approved' and ${table.supersededAt} is null`),
]);

export const politicalStatusItems = pgTable('political_status_items', {
  id: integer('id').primaryKey(),
  politicalStatusId: integer('political_status_id').notNull().references(() => politicalStatuses.id),
  partyAffiliationId: integer('party_affiliation_id').references(() => partyAffiliations.id),
  officeTenureId: integer('office_tenure_id').references(() => officeTenures.id),
  candidacyId: integer('candidacy_id').references(() => candidacies.id),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('political_status_item_one_reference_check', sql`((case when ${table.partyAffiliationId} is null then 0 else 1 end) + (case when ${table.officeTenureId} is null then 0 else 1 end) + (case when ${table.candidacyId} is null then 0 else 1 end)) = 1`),
  uniqueIndex('political_status_item_party_unique').on(table.politicalStatusId, table.partyAffiliationId).where(sql`${table.partyAffiliationId} is not null`),
  uniqueIndex('political_status_item_office_unique').on(table.politicalStatusId, table.officeTenureId).where(sql`${table.officeTenureId} is not null`),
  uniqueIndex('political_status_item_candidacy_unique').on(table.politicalStatusId, table.candidacyId).where(sql`${table.candidacyId} is not null`),
]);
```

- [ ] **Step 4: Generate migration and check it applies cleanly**

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:generate -- --name stable-person-profiles
```

Keep Drizzle's generated `0003_*` file and metadata. Do not add seed rows: every new table is additive and nullable only where the design requires it.

- [ ] **Step 5: Add migration-shape protection**

In `test/migrations.test.ts`, add a test that reads `drizzle/0003_stable-person-profiles.sql` and asserts:

```ts
assert.match(migration, /CREATE TABLE "person_names"/);
assert.match(migration, /CREATE TABLE "party_affiliations"/);
assert.match(migration, /CREATE TABLE "office_tenures"/);
assert.match(migration, /CREATE TABLE "political_statuses"/);
assert.match(migration, /CREATE TABLE "political_status_items"/);
assert.match(migration, /political_status_current_approved_unique/);
assert.match(migration, /political_status_item_one_reference_check/);
```

- [ ] **Step 6: Verify GREEN from an empty database**

Recreate the disposable database, then run:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/electoral-profile-schema.test.ts test/migrations.test.ts
```

Expected: all old and new database-invariant tests pass.

- [ ] **Step 7: Commit the schema slice**

```bash
git add src/db/schema.ts drizzle test/electoral-profile-schema.test.ts test/migrations.test.ts
git commit -m "feat: model stable Person history"
```

### Task 2: Format date precision and publish the complete Person profile

**Files:**
- Create: `src/date-precision.ts`
- Create: `test/date-precision.test.ts`
- Create: `src/person-profile.ts`
- Modify: `src/app/people/[id]/page.tsx`
- Modify: `test/electoral-list-profile.test.ts`

**Interfaces:**
- Produces `formatDatePrecision(date: Date | null, precision: 'day' | 'month' | 'year' | 'unknown'): string`.
- Produces `getPublicPersonProfile(id: number)` returning `null` or a read model with current status, earlier statuses, names, Party Affiliations, Office Tenures, and Candidacies.
- Keeps route parsing/404 behavior in the page and leaves all database queries in `src/person-profile.ts`.

- [ ] **Step 1: Write formatter tests and verify RED**

Create `test/date-precision.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDatePrecision } from '../src/date-precision';

const date = new Date('2026-09-22T00:00:00Z');

test('formats public dates by declared precision without inventing detail', () => {
  assert.equal(formatDatePrecision(date, 'day'), '2026-09-22');
  assert.equal(formatDatePrecision(date, 'month'), 'September 2026');
  assert.equal(formatDatePrecision(date, 'year'), '2026');
  assert.equal(formatDatePrecision(null, 'unknown'), 'Date unknown');
});
```

Run:

```bash
npx tsx --test test/date-precision.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the minimal date formatter**

Create `src/date-precision.ts`:

```ts
export type DatePrecision = 'day' | 'month' | 'year' | 'unknown';

export function formatDatePrecision(date: Date | null, precision: DatePrecision) {
  if (precision === 'unknown' || !date) return 'Date unknown';
  if (precision === 'day') return date.toISOString().slice(0, 10);
  if (precision === 'year') return String(date.getUTCFullYear());
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
```

- [ ] **Step 3: Verify formatter GREEN**

```bash
npx tsx --test test/date-precision.test.ts
```

Expected: one passing test.

- [ ] **Step 4: Write failing rendered-profile coverage**

Extend the existing `test/electoral-list-profile.test.ts` fixture for `personAId` with:

- approved former name (`name`, year precision, 2024);
- approved alias (`alias`, month precision, March 2025);
- approved name with unknown start date;
- pending name `Private Pending Name`;
- two overlapping approved Party Affiliations to two Political Parties;
- one pending Party Affiliation;
- two overlapping approved Office Tenures, one with `unknown` end date;
- one pending Office Tenure;
- an approved current Political Status `Current public roles`, verified `2026-09-15`, with one approved item for each relationship type;
- approved earlier status `Earlier public role`, superseded `2026-09-15`;
- pending status `Pending private status` and pending status item;
- a public Person with only an approved Candidacy and no optional profile data to verify all Person-profile empty states.

Replace the old minimal identity-page assertion with one rendered `PersonIdentityPage` assertion that requires:

```ts
assert.match(html, /Person A/);
assert.match(html, /Current Political Status/);
assert.match(html, /Current public roles/);
assert.match(html, /Last verified: 2026-09-15/);
assert.match(html, /September 2025/);
assert.match(html, /2024/);
assert.match(html, /Date unknown/);
assert.match(html, /Names and aliases/);
assert.match(html, /Party Affiliation history/);
assert.match(html, /Office Tenure history/);
assert.match(html, /Candidacy history/);
assert.match(html, /Earlier Political Statuses/);
assert.match(html, /Earlier public role/);
assert.doesNotMatch(html, /Private Pending Name|Pending private status|Pending Office/);
```

Add a second public Person fixture with no approved names, affiliations, offices, or statuses and assert the neutral unavailable messages for every optional profile section. Keep the existing 404 tests unchanged.

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/electoral-list-profile.test.ts
```

Expected: FAIL because the minimal page renders only name and placeholder text.

- [ ] **Step 5: Implement the approved-only read model**

Create `src/person-profile.ts`.

Start with the existing public identity joins to prove the Person has an approved Candidacy revision on an approved Electoral List. Return `null` when no such row exists.

Select the Person's current display name and then issue focused approved-only queries for:

- `personNames`, ordered by `validFrom` then ID;
- Party Affiliations joined to Political Party display names, ordered by `validFrom` then ID;
- Office Tenures, ordered by `validFrom` then ID;
- Candidacies joined to Electoral List name and approved revisions, ordered by revision effective date;
- Political Status snapshots with approved status items.

For each status item, join exactly its non-null linked relationship and include only an item when its own review state and the underlying relationship's review state are both `approved`. Build current status from `supersededAt === null`, and earlier statuses from `supersededAt !== null`, ordering earlier statuses descending by `verifiedAt`. Do not derive status text or silently include an affiliation, office, or Candidacy absent from an approved item.

- [ ] **Step 6: Replace the minimal Person page**

In `src/app/people/[id]/page.tsx`, retain `dynamic`, numeric validation, and `notFound()`. Replace `getPublicPersonIdentity` with `getPublicPersonProfile`.

Render semantic sections with the formatter:

```tsx
<section aria-labelledby="status-heading">
  <h2 id="status-heading">Current Political Status</h2>
  {person.currentStatus ? (
    <>
      <p>{person.currentStatus.summary}</p>
      <p>Last verified: {formatDatePrecision(person.currentStatus.verifiedAt, 'day')}</p>
      <ul>{person.currentStatus.items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
    </>
  ) : <p>No reviewed Current Political Status is available yet.</p>}
</section>
```

Render **Names and aliases**, **Party Affiliation history**, **Office Tenure history**, **Candidacy history**, and **Earlier Political Statuses** using the same empty-state pattern. Every dated row prints `from <formatted start> to <formatted end>`. Preserve the Server Component only; add no Client Component.

- [ ] **Step 7: Verify focused behavior GREEN**

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/date-precision.test.ts test/electoral-list-profile.test.ts
```

Expected: date formatting, full profile rendering, privacy filtering, neutral empty states, and existing route behavior all pass.

- [ ] **Step 8: Commit the public profile slice**

```bash
git add src/date-precision.ts test/date-precision.test.ts src/person-profile.ts src/app/people/[id]/page.tsx test/electoral-list-profile.test.ts
git commit -m "feat: publish stable Person profiles"
```

### Task 3: Review and release the Person profile

**Files:**
- No planned source changes unless review finds a confirmed defect.

- [ ] **Step 1: Run complete verification against a fresh database**

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm test
npm run typecheck
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run build
HOSTNAME=127.0.0.1 PORT=3000 DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test node .next/standalone/server.js
SMOKE_URL=http://127.0.0.1:3000 npm run smoke
```

Expected: migration chain, all tests, typecheck, build, and homepage smoke pass.

- [ ] **Step 2: Run two-axis review and production verification**

Run `/code-review` from fixed point `0167124` against issue #20. Resolve confirmed findings, then repeat Step 1. After the user authorizes deployment, apply `npm run db:migrate` to production using the production `DATABASE_URL` and verify the production homepage. A profile-specific production smoke is deferred until a reviewed Person exists.

- [ ] **Step 3: Close issue #20**

```bash
gh issue comment 20 --body "Published stable Person profiles with reviewed date-precision history and Current Political Status. Full tests, typecheck, build, and production smoke pass."
gh issue close 20
```
