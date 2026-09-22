import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { inArray } from 'drizzle-orm';
import { renderToStaticMarkup } from 'react-dom/server';
import ElectoralListPage from '../src/app/electoral-lists/[reference]/page';
import PersonIdentityPage from '../src/app/people/[id]/page';
import { getDb } from '../src/db/client';
import {
  authoritativeSources,
  candidacies,
  candidacyRevisions,
  electionEditions,
  electoralListParties,
  electoralLists,
  persons,
  politicalActors,
  politicalActorSlugs,
  politicalParties,
} from '../src/db/schema';

const db = getDb();

const sourceId = 19_201;
const editionId = 19_201;
const listId = 19_201;
const pendingListId = 19_209;
const emptyListId = 19_205;
const approvedPartyId = 19_202;
const pendingPartyId = 19_203;
const personAId = 19_211;
const personBId = 19_212;
const personCId = 19_213;
const personDId = 19_214;
const personEId = 19_215;
const personFId = 19_216;
const personIds = [personAId, personBId, personCId, personDId, personEId, personFId];
const actorIds = [listId, pendingListId, emptyListId, approvedPartyId, pendingPartyId, ...personIds];

async function removeFixtures() {
  await db.delete(candidacyRevisions).where(inArray(candidacyRevisions.electoralListId, [listId]));
  await db.delete(candidacies).where(inArray(candidacies.electoralListId, [listId]));
  await db.delete(electoralListParties).where(inArray(electoralListParties.electoralListId, [listId]));
  await db.delete(electoralLists).where(inArray(electoralLists.id, [listId, pendingListId, emptyListId]));
  await db.delete(politicalParties).where(inArray(politicalParties.id, [approvedPartyId, pendingPartyId]));
  await db.delete(persons).where(inArray(persons.id, personIds));
  await db.delete(politicalActorSlugs).where(inArray(politicalActorSlugs.actorId, actorIds));
  await db.delete(politicalActors).where(inArray(politicalActors.id, actorIds));
  await db.delete(electionEditions).where(inArray(electionEditions.id, [editionId]));
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

  await db.insert(electionEditions).values({
    id: editionId,
    name: '2026 Knesset election',
    status: 'active',
  });

  await db.insert(politicalActors).values([
    { id: listId, type: 'electoral_list', currentDisplayName: 'Future List', currentSlug: 'future-list' },
    { id: pendingListId, type: 'electoral_list', currentDisplayName: 'Pending List', currentSlug: 'pending-list-19209' },
    { id: emptyListId, type: 'electoral_list', currentDisplayName: 'Empty List', currentSlug: 'empty-list-19205' },
    { id: approvedPartyId, type: 'political_party', currentDisplayName: 'Party One', currentSlug: 'party-one-19202' },
    { id: pendingPartyId, type: 'political_party', currentDisplayName: 'Pending Party', currentSlug: 'pending-party-19203' },
    { id: personAId, type: 'person', currentDisplayName: 'Person A', currentSlug: 'person-a-19211' },
    { id: personBId, type: 'person', currentDisplayName: 'Person B', currentSlug: 'person-b-19212' },
    { id: personCId, type: 'person', currentDisplayName: 'Person C', currentSlug: 'person-c-19213' },
    { id: personDId, type: 'person', currentDisplayName: 'Person D', currentSlug: 'person-d-19214' },
    { id: personEId, type: 'person', currentDisplayName: 'Person E', currentSlug: 'person-e-19215' },
    { id: personFId, type: 'person', currentDisplayName: 'Pending Person', currentSlug: 'pending-person-19216' },
  ]);

  await db.insert(politicalActorSlugs).values([
    { slug: 'future-list', actorId: listId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'former-list', actorId: listId, validFrom: new Date('2026-08-01T00:00:00Z'), validTo: new Date('2026-09-01T00:00:00Z') },
    { slug: 'pending-list-19209', actorId: pendingListId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'empty-list-19205', actorId: emptyListId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'party-one-19202', actorId: approvedPartyId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'pending-party-19203', actorId: pendingPartyId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'person-a-19211', actorId: personAId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'person-b-19212', actorId: personBId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'person-c-19213', actorId: personCId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'person-d-19214', actorId: personDId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'person-e-19215', actorId: personEId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'pending-person-19216', actorId: personFId, validFrom: new Date('2026-09-01T00:00:00Z') },
  ]);

  await db.insert(persons).values(personIds.map((id) => ({ id })));
  await db.insert(politicalParties).values([{ id: approvedPartyId }, { id: pendingPartyId }]);

  await db.insert(electoralLists).values([
    {
      id: listId,
      editionId,
      name: 'Future List',
      ballotIdentifier: 'ת',
      sourceId,
      reviewState: 'approved',
    },
    {
      id: pendingListId,
      editionId,
      name: 'Pending List',
      ballotIdentifier: 'פ',
      sourceId,
      reviewState: 'pending',
    },
    {
      // An approved Electoral List with no represented parties, Candidacies, or history yet.
      id: emptyListId,
      editionId,
      name: 'Empty List',
      ballotIdentifier: null,
      sourceId: null,
      reviewState: 'approved',
    },
  ]);

  await db.insert(electoralListParties).values([
    { electoralListId: listId, politicalPartyId: approvedPartyId, sourceId, reviewState: 'approved' },
    { electoralListId: listId, politicalPartyId: pendingPartyId, sourceId, reviewState: 'pending' },
  ]);

  await db.insert(candidacies).values([
    { id: personAId, personId: personAId, electoralListId: listId, editionId },
    { id: personBId, personId: personBId, electoralListId: listId, editionId },
    { id: personCId, personId: personCId, electoralListId: listId, editionId },
    { id: personDId, personId: personDId, electoralListId: listId, editionId },
    { id: personEId, personId: personEId, electoralListId: listId, editionId },
    { id: personFId, personId: personFId, electoralListId: listId, editionId },
  ]);

  await db.insert(candidacyRevisions).values([
    // Person A: closed active position 2, then open active position 1.
    {
      id: 19_221,
      candidacyId: personAId,
      electoralListId: listId,
      position: 2,
      status: 'active',
      effectiveFrom: new Date('2026-08-01T00:00:00Z'),
      effectiveTo: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
    {
      id: 19_222,
      candidacyId: personAId,
      electoralListId: listId,
      position: 1,
      status: 'active',
      effectiveFrom: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
    // Person B: open active position 2.
    {
      id: 19_223,
      candidacyId: personBId,
      electoralListId: listId,
      position: 2,
      status: 'active',
      effectiveFrom: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
    // Person C: closed active position 3, then open withdrawn position 3.
    {
      id: 19_224,
      candidacyId: personCId,
      electoralListId: listId,
      position: 3,
      status: 'active',
      effectiveFrom: new Date('2026-08-01T00:00:00Z'),
      effectiveTo: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
    {
      id: 19_225,
      candidacyId: personCId,
      electoralListId: listId,
      position: 3,
      status: 'withdrawn',
      effectiveFrom: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
    // Person D: open disqualified position 4.
    {
      id: 19_226,
      candidacyId: personDId,
      electoralListId: listId,
      position: 4,
      status: 'disqualified',
      effectiveFrom: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
    // Person E: open replaced position 5.
    {
      id: 19_227,
      candidacyId: personEId,
      electoralListId: listId,
      position: 5,
      status: 'replaced',
      effectiveFrom: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
    // Person F: one pending open active revision that must not render.
    {
      id: 19_228,
      candidacyId: personFId,
      electoralListId: listId,
      position: 6,
      status: 'active',
      effectiveFrom: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'pending',
    },
  ]);
});

after(removeFixtures);

async function digestOf(work: () => Promise<unknown>): Promise<string> {
  try {
    await work();
  } catch (error) {
    if (error instanceof Error && typeof (error as unknown as { digest?: unknown }).digest === 'string') {
      return (error as unknown as { digest: string }).digest;
    }
    throw error;
  }
  throw new Error('Expected a Next.js navigation exception');
}

test('the current-slug page renders the current order, parties, and history, hiding pending records', async () => {
  const html = renderToStaticMarkup(await ElectoralListPage({
    params: Promise.resolve({ reference: 'future-list' }),
  }));

  const candidatesStart = html.indexOf('id="candidates-heading"');
  const historyStart = html.indexOf('id="history-heading"');
  const methodologyStart = html.indexOf('id="methodology-heading"');
  assert.ok(candidatesStart > 0 && historyStart > candidatesStart && methodologyStart > historyStart);
  const currentSection = html.slice(candidatesStart, historyStart);
  const historySection = html.slice(historyStart, methodologyStart);

  assert.ok(html.indexOf('Person A') < html.indexOf('Person B'));
  assert.match(html, /Represented Political Parties/);
  assert.match(html, /Party One/);
  assert.doesNotMatch(html, /Pending Party/);
  assert.match(html, /href="\/people\/19211"/);
  assert.match(html, /Candidacy history/);
  assert.doesNotMatch(html, /Pending Person/);

  // Current order: only the open active revisions for Person A (position 1) and Person B (position 2).
  assert.match(currentSection, /Person A/);
  assert.match(currentSection, /Person B/);
  assert.doesNotMatch(currentSection, /Person C/);
  assert.doesNotMatch(currentSection, /Person D/);
  assert.doesNotMatch(currentSection, /Person E/);

  // History: closed positions plus open withdrawn/disqualified/replaced revisions, but never the current open active ones.
  assert.match(historySection, /Position 2/);
  assert.match(historySection, /Withdrawn/);
  assert.match(historySection, /Disqualified/);
  assert.match(historySection, /Replaced/);
  assert.doesNotMatch(historySection, /Position 1;/);
  assert.doesNotMatch(historySection, /Position 2; Active from 2026-09-01 to Current/);
  assert.doesNotMatch(historySection, /Person B/);
});

test('a numeric reference redirects to the canonical slug', async () => {
  const digest = await digestOf(() => ElectoralListPage({
    params: Promise.resolve({ reference: String(listId) }),
  }));
  assert.match(digest, /^NEXT_REDIRECT;replace;\/electoral-lists\/future-list;/);
});

test('a historical slug redirects to the canonical slug', async () => {
  const digest = await digestOf(() => ElectoralListPage({
    params: Promise.resolve({ reference: 'former-list' }),
  }));
  assert.match(digest, /^NEXT_REDIRECT;replace;\/electoral-lists\/future-list;/);
});

test('an unknown slug produces a 404', async () => {
  const digest = await digestOf(() => ElectoralListPage({
    params: Promise.resolve({ reference: 'no-such-list' }),
  }));
  assert.equal(digest, 'NEXT_HTTP_ERROR_FALLBACK;404');
});

test('an unapproved Electoral List produces a 404', async () => {
  const digest = await digestOf(() => ElectoralListPage({
    params: Promise.resolve({ reference: 'pending-list-19209' }),
  }));
  assert.equal(digest, 'NEXT_HTTP_ERROR_FALLBACK;404');
});

test('an approved Electoral List with no reviewed parties, current Candidates, or history renders all three neutral empty states', async () => {
  const html = renderToStaticMarkup(await ElectoralListPage({
    params: Promise.resolve({ reference: 'empty-list-19205' }),
  }));

  assert.match(html, /No reviewed represented Political Parties are available yet\./);
  assert.match(html, /No reviewed current Candidates are available yet\./);
  assert.match(html, /No reviewed Candidacy history is available yet\./);
});

test('a numeric reference above the PostgreSQL int4 range produces a 404 rather than a 500', async () => {
  const digest = await digestOf(() => ElectoralListPage({
    params: Promise.resolve({ reference: '2147483648' }),
  }));
  assert.equal(digest, 'NEXT_HTTP_ERROR_FALLBACK;404');
});

test('a Person with an approved Candidacy renders their stable name and a neutral notice', async () => {
  const html = renderToStaticMarkup(await PersonIdentityPage({
    params: Promise.resolve({ id: String(personAId) }),
  }));

  assert.match(html, /Person A/);
  assert.match(html, /Detailed profile information is not yet available\./);
});

test('an unknown Person id produces a 404', async () => {
  const digest = await digestOf(() => PersonIdentityPage({
    params: Promise.resolve({ id: '999999999' }),
  }));
  assert.equal(digest, 'NEXT_HTTP_ERROR_FALLBACK;404');
});

test('a nonnumeric Person id produces a 404', async () => {
  const digest = await digestOf(() => PersonIdentityPage({
    params: Promise.resolve({ id: 'not-a-number' }),
  }));
  assert.equal(digest, 'NEXT_HTTP_ERROR_FALLBACK;404');
});

test('a Person without an approved public Candidacy produces a 404', async () => {
  const digest = await digestOf(() => PersonIdentityPage({
    params: Promise.resolve({ id: String(personFId) }),
  }));
  assert.equal(digest, 'NEXT_HTTP_ERROR_FALLBACK;404');
});

test('a Person id above the PostgreSQL int4 range produces a 404 rather than a 500', async () => {
  const digest = await digestOf(() => PersonIdentityPage({
    params: Promise.resolve({ id: '2147483648' }),
  }));
  assert.equal(digest, 'NEXT_HTTP_ERROR_FALLBACK;404');
});
