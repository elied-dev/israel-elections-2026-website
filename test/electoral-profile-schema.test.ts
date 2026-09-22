import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { inArray } from 'drizzle-orm';
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

const sourceId = 19_001;
const wrongEditionId = 19_001;
const listId = 19_001;
const partyId = 19_002;
const personAId = 19_011;
const personBId = 19_012;
const unattachedPersonId = 19_019;
const candidacyAId = 19_001;
const candidacyBId = 19_002;

async function removeFixtures() {
  await db.delete(candidacyRevisions).where(inArray(candidacyRevisions.candidacyId, [candidacyAId, candidacyBId]));
  await db.delete(candidacies).where(inArray(candidacies.id, [candidacyAId, candidacyBId]));
  await db.delete(electoralListParties).where(inArray(electoralListParties.electoralListId, [listId]));
  await db.delete(electoralLists).where(inArray(electoralLists.id, [listId]));
  await db.delete(politicalParties).where(inArray(politicalParties.id, [partyId]));
  await db.delete(persons).where(inArray(persons.id, [personAId, personBId, unattachedPersonId]));
  await db.delete(politicalActorSlugs).where(inArray(politicalActorSlugs.actorId, [listId, partyId, personAId, personBId, unattachedPersonId]));
  await db.delete(politicalActors).where(inArray(politicalActors.id, [listId, partyId, personAId, personBId, unattachedPersonId]));
  await db.delete(electionEditions).where(inArray(electionEditions.id, [wrongEditionId]));
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

  // A second Election Edition, used only to prove the mismatched list/edition pair is rejected.
  await db.insert(electionEditions).values({
    id: wrongEditionId,
    name: 'Other election',
    status: 'active',
  });

  await db.insert(politicalActors).values([
    { id: listId, type: 'electoral_list', currentDisplayName: 'Test List', currentSlug: 'test-list-19001' },
    { id: partyId, type: 'political_party', currentDisplayName: 'Test Party', currentSlug: 'test-party-19002' },
    { id: personAId, type: 'person', currentDisplayName: 'Person A', currentSlug: 'person-a-19011' },
    { id: personBId, type: 'person', currentDisplayName: 'Person B', currentSlug: 'person-b-19012' },
    { id: unattachedPersonId, type: 'person', currentDisplayName: 'Person C', currentSlug: 'person-c-19019' },
  ]);

  await db.insert(politicalActorSlugs).values([
    { slug: 'test-list-19001', actorId: listId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'test-party-19002', actorId: partyId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'person-a-19011', actorId: personAId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'person-b-19012', actorId: personBId, validFrom: new Date('2026-09-01T00:00:00Z') },
    { slug: 'person-c-19019', actorId: unattachedPersonId, validFrom: new Date('2026-09-01T00:00:00Z') },
  ]);

  await db.insert(persons).values([{ id: personAId }, { id: personBId }, { id: unattachedPersonId }]);
  await db.insert(politicalParties).values({ id: partyId });

  await db.insert(electoralLists).values({
    id: listId,
    editionId: 1,
    name: 'Test List',
    ballotIdentifier: 'ת',
    sourceId,
    reviewState: 'approved',
  });

  await db.insert(electoralListParties).values({
    electoralListId: listId,
    politicalPartyId: partyId,
    sourceId,
    reviewState: 'approved',
  });

  // Two Candidacies on the same Electoral List/Edition.
  await db.insert(candidacies).values([
    { id: candidacyAId, personId: personAId, electoralListId: listId, editionId: 1 },
    { id: candidacyBId, personId: personBId, electoralListId: listId, editionId: 1 },
  ]);

  // Candidacy A: one closed position revision followed by one open active revision (history + current coexist).
  await db.insert(candidacyRevisions).values([
    {
      id: 19_001,
      candidacyId: candidacyAId,
      electoralListId: listId,
      position: 2,
      status: 'active',
      effectiveFrom: new Date('2026-08-01T00:00:00Z'),
      effectiveTo: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
    {
      id: 19_002,
      candidacyId: candidacyAId,
      electoralListId: listId,
      position: 1,
      status: 'active',
      effectiveFrom: new Date('2026-09-01T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    },
  ]);

  // Candidacy B: a single closed (withdrawn) revision, so it carries history without an open row.
  await db.insert(candidacyRevisions).values({
    id: 19_003,
    candidacyId: candidacyBId,
    electoralListId: listId,
    position: 3,
    status: 'withdrawn',
    effectiveFrom: new Date('2026-08-01T00:00:00Z'),
    effectiveTo: new Date('2026-09-01T00:00:00Z'),
    sourceId,
    reviewState: 'approved',
  });
});

after(removeFixtures);

// Drizzle wraps the underlying pg driver error in `error.cause`; the constraint
// name shows up there, not on the outer `DrizzleQueryError.message`.
function rejectsWithConstraint(constraintName: string) {
  return (error: unknown) => error instanceof Error
    && typeof error.cause === 'object'
    && error.cause !== null
    && 'message' in error.cause
    && typeof error.cause.message === 'string'
    && error.cause.message.includes(constraintName);
}

test('a second current active approved revision at an occupied position is rejected', async () => {
  await assert.rejects(
    db.insert(candidacyRevisions).values({
      id: 19_099,
      candidacyId: candidacyBId,
      electoralListId: listId,
      position: 1,
      status: 'active',
      effectiveFrom: new Date('2026-09-02T00:00:00Z'),
      sourceId,
      reviewState: 'approved',
    }),
    rejectsWithConstraint('candidacy_revision_current_position_unique'),
  );
});

test('a Candidacy referencing a mismatched Electoral List/Edition pair is rejected', async () => {
  await assert.rejects(
    db.insert(candidacies).values({
      id: 19_099,
      personId: unattachedPersonId,
      electoralListId: listId,
      editionId: wrongEditionId,
    }),
    rejectsWithConstraint('candidacy_electoral_list_edition_fk'),
  );
});
