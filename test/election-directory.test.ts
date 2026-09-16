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
