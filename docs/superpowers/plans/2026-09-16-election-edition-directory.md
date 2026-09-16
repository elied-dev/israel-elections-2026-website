# Election Edition Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish every approved Electoral List in the 2026 Election Edition with neutral ordering, authoritative provenance, explicit unavailable states, and methodology disclosures.

**Architecture:** Keep the existing PostgreSQL schema and server-rendered Next.js route. Move the Drizzle read into one server-side query module, filter publication to `review_state = 'approved'`, order by stable list ID, and let the `/` page render the returned data. Verify behavior through the rendered page against the real migrated PostgreSQL schema.

**Tech Stack:** TypeScript 7, Next.js 16 App Router, React 19 server rendering, Drizzle ORM, PostgreSQL 16, Node test runner.

**Spec:** GitHub issue [#18 — Publish the 2026 Election Edition directory](https://github.com/elied-dev/israel-elections-2026-website/issues/18)

## Global Constraints

- Publish only Electoral Lists whose `review_state` is exactly `approved`.
- Do not rank, preselect, or popularity-filter Electoral Lists; use ascending database ID solely for deterministic source order.
- Display `Not yet available` for each missing ballot identifier, source, or retrieval date.
- Keep the existing methodology and non-affiliation disclosure.
- Do not seed Electoral Lists, add dependencies, add styling, or build profile navigation in this issue.
- Use the domain terms `Election Edition`, `Electoral List`, and `Authoritative Source` as defined in `CONTEXT.md`.

---

## File Map

- Create `src/election-directory.ts`: server-side Drizzle query for the current Election Edition and its approved Electoral Lists.
- Modify `src/app/page.tsx`: render query results and explicit unavailable provenance fields.
- Modify `src/db/client.ts`: let idle PostgreSQL pools stop the Node test process without changing runtime query behavior.
- Create `test/election-directory.test.ts`: seed disposable records, render `/`, and assert the public behavior from issue #18.
- No schema or migration changes: `drizzle/0001_green_barracuda.sql` already contains the required tables and empty Election Edition seed.

### Task 1: Publish the approved Election Edition directory

**Files:**
- Create: `test/election-directory.test.ts`
- Create: `src/election-directory.ts`
- Modify: `src/app/page.tsx:1-56`
- Modify: `src/db/client.ts:8`

**Interfaces:**
- Consumes: `getDb()` from `src/db/client.ts`; `electionEditions`, `electoralLists`, and `authoritativeSources` from `src/db/schema.ts`.
- Produces: `getElectionDirectory(): Promise<{ edition: typeof electionEditions.$inferSelect | undefined; lists: Array<{ id: number; name: string; ballotIdentifier: string | null; reviewState: string; sourceTitle: string | null; sourceUrl: string | null; retrievedAt: Date | null }> }>`.
- Public seam: the server-rendered `/` page.

- [ ] **Step 1: Write the failing rendered-page test**

Create `test/election-directory.test.ts`:

```tsx
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { inArray } from 'drizzle-orm';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from '../src/app/page';
import { getDb } from '../src/db/client';
import { authoritativeSources, electoralLists } from '../src/db/schema';

const db = getDb();
const sourceId = 18_001;
const listIds = [18_001, 18_002, 18_003];

async function removeFixtures() {
  await db.delete(electoralLists).where(inArray(electoralLists.id, listIds));
  await db.delete(authoritativeSources).where(inArray(authoritativeSources.id, [sourceId]));
}

before(async () => {
  await removeFixtures();
  await db.insert(authoritativeSources).values({
    id: sourceId,
    title: 'Central Elections Committee',
    url: 'https://www.gov.il/en/departments/units/central-elections-committee',
    retrievedAt: new Date('2026-09-15T00:00:00Z'),
  });
  await db.insert(electoralLists).values([
    {
      id: 18_001,
      editionId: 1,
      name: 'Approved Complete List',
      ballotIdentifier: 'א',
      sourceId,
      reviewState: 'approved',
    },
    {
      id: 18_002,
      editionId: 1,
      name: 'Approved Incomplete List',
      ballotIdentifier: null,
      sourceId: null,
      reviewState: 'approved',
    },
    {
      id: 18_003,
      editionId: 1,
      name: 'Pending List',
      ballotIdentifier: 'ב',
      sourceId,
      reviewState: 'pending',
    },
  ]);
});

after(removeFixtures);

test('the Election Edition directory publishes every approved list with neutral provenance', async () => {
  const html = renderToStaticMarkup(await HomePage());

  assert.match(html, /Approved Complete List/);
  assert.match(html, /Approved Incomplete List/);
  assert.doesNotMatch(html, /Pending List/);
  assert.ok(html.indexOf('Approved Complete List') < html.indexOf('Approved Incomplete List'));
  assert.match(html, /Ballot identifier: א/);
  assert.match(html, /Ballot identifier: Not yet available/);
  assert.match(html, /Central Elections Committee/);
  assert.match(html, /Retrieved: 2026-09-15/);
  assert.match(html, /Source: Not yet available/);
  assert.match(html, /Retrieved: Not yet available/);
  assert.match(html, /does not rank, endorse, or recommend any Electoral List/);
  assert.match(html, /not an official CEC service or political campaign/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run with a migrated disposable PostgreSQL database:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run db:migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/election-directory.test.ts
```

Expected: FAIL because the current page includes `Pending List` and does not render a separate `Retrieved: Not yet available` field.

- [ ] **Step 3: Make idle database pools test-process friendly**

Change `src/db/client.ts` to preserve the existing interface while allowing Node to exit after PostgreSQL becomes idle:

```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  return drizzle(new Pool({ connectionString, allowExitOnIdle: true }), { schema });
}
```

- [ ] **Step 4: Add the server-side directory query**

Create `src/election-directory.ts` (the repository does not install the optional `server-only` marker package, so keep this module server-side by importing it only from the Server Component):

```ts
import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { authoritativeSources, electionEditions, electoralLists } from '@/db/schema';

export async function getElectionDirectory() {
  const db = getDb();
  const edition = (
    await db.select().from(electionEditions).orderBy(asc(electionEditions.id)).limit(1)
  )[0];

  if (!edition) return { edition, lists: [] };

  const lists = await db
    .select({
      id: electoralLists.id,
      name: electoralLists.name,
      ballotIdentifier: electoralLists.ballotIdentifier,
      reviewState: electoralLists.reviewState,
      sourceTitle: authoritativeSources.title,
      sourceUrl: authoritativeSources.url,
      retrievedAt: authoritativeSources.retrievedAt,
    })
    .from(electoralLists)
    .leftJoin(authoritativeSources, eq(electoralLists.sourceId, authoritativeSources.id))
    .where(
      and(
        eq(electoralLists.editionId, edition.id),
        eq(electoralLists.reviewState, 'approved'),
      ),
    )
    .orderBy(asc(electoralLists.id));

  return { edition, lists };
}
```

- [ ] **Step 5: Render the query result with independent unavailable fields**

Replace `src/app/page.tsx` with:

```tsx
import { getElectionDirectory } from '@/election-directory';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { edition, lists } = await getElectionDirectory();

  return (
    <main>
      <h1>{edition?.name ?? '2026 Knesset election'}</h1>
      <p>Neutral election information with inspectable sources.</p>
      <section aria-labelledby="methodology-heading">
        <h2 id="methodology-heading">Methodology and non-affiliation</h2>
        <p>This directory presents reviewed official election facts. It does not rank, endorse, or recommend any Electoral List. This is an independent information service, not an official CEC service or political campaign.</p>
      </section>
      <section aria-labelledby="lists-heading">
        <h2 id="lists-heading">Electoral Lists</h2>
        {lists.length === 0 ? (
          <p role="status">No reviewed Electoral Lists are available yet.</p>
        ) : (
          <ul>
            {lists.map((list) => (
              <li key={list.id}>
                <h3>{list.name}</h3>
                <p>Ballot identifier: {list.ballotIdentifier ?? 'Not yet available'}</p>
                <p>Review state: {list.reviewState}</p>
                <p>
                  Source:{' '}
                  {list.sourceUrl ? <a href={list.sourceUrl}>{list.sourceTitle}</a> : 'Not yet available'}
                </p>
                <p>Retrieved: {list.retrievedAt?.toISOString().slice(0, 10) ?? 'Not yet available'}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Run the focused test and verify GREEN**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npx tsx --test test/election-directory.test.ts
```

Expected: PASS with one passing test.

- [ ] **Step 7: Run repository verification**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm test
npm run typecheck
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm run build
```

Expected: all tests pass, TypeScript exits zero, and Next.js reports `/` as a dynamic server-rendered route.

- [ ] **Step 8: Run the local deployable smoke path**

With the migrated database and production server running:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elections_test npm start
SMOKE_URL=http://localhost:3000 npm run smoke
```

Expected: `Smoke check passed: http://localhost:3000`.

- [ ] **Step 9: Review against standards and issue #18**

Run the repository `/code-review` flow against the task’s starting commit. Resolve any Standards or Spec findings, then repeat Steps 6–8.

- [ ] **Step 10: Commit the implementation**

```bash
git add src/election-directory.ts src/app/page.tsx src/db/client.ts test/election-directory.test.ts
git commit -m "feat: publish approved Election Edition directory"
```

- [ ] **Step 11: Record completion in GitHub**

```bash
gh issue comment 18 --body "Implemented the approved Election Edition directory with authoritative provenance, explicit unavailable states, neutral ordering, and rendered-page coverage. Tests, typecheck, build, and smoke check pass."
gh issue close 18
```
