import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import {
  evidenceCitations,
  politicalActors,
  publicClaims,
  publicClaimSpeakers,
  publicClaimSubjects,
  quotationTranslations,
  quotations,
  sourceRecords,
  sourceVersions,
} from '../src/db/schema';

const db = getDb();
const actorIds = [22_001, 22_002, 22_003];
const publicClaimId = 22_001;
const sourceRecordId = 22_001;
const sourceVersionId = 22_001;

async function removeFixtures() {
  await db.delete(quotationTranslations).where(eq(quotationTranslations.quotationId, 22_001));
  await db.delete(quotations).where(eq(quotations.evidenceCitationId, 22_001));
  await db.delete(evidenceCitations).where(eq(evidenceCitations.publicClaimId, publicClaimId));
  await db.delete(publicClaimSubjects).where(eq(publicClaimSubjects.publicClaimId, publicClaimId));
  await db.delete(publicClaimSpeakers).where(eq(publicClaimSpeakers.publicClaimId, publicClaimId));
  await db.delete(publicClaims).where(eq(publicClaims.id, publicClaimId));
  await db.delete(sourceVersions).where(eq(sourceVersions.id, sourceVersionId));
  await db.delete(sourceRecords).where(eq(sourceRecords.id, sourceRecordId));
  await db.delete(politicalActors).where(inArray(politicalActors.id, actorIds));
}

before(async () => {
  await removeFixtures();
  await db.insert(politicalActors).values(actorIds.map((id, index) => ({
    id,
    type: index === 2 ? 'political_party' : 'person',
    currentDisplayName: `Actor ${index + 1}`,
    currentSlug: `claim-schema-actor-${index + 1}`,
  })));
  await db.insert(sourceRecords).values({
    id: sourceRecordId,
    title: 'Claim evidence source',
    sourceType: 'Official record',
    publicationDate: new Date('2026-01-10T00:00:00Z'),
    availability: 'available',
    reviewState: 'approved',
  });
  await db.insert(sourceVersions).values({
    id: sourceVersionId,
    sourceRecordId,
    changeType: 'original',
    retrievedAt: new Date('2026-01-11T00:00:00Z'),
    reviewState: 'approved',
  });
  await db.insert(publicClaims).values({
    id: publicClaimId,
    summary: 'A reviewed statement.',
    statementFrom: new Date('2025-12-01T00:00:00Z'),
    statementFromPrecision: 'month',
    statementTo: null,
    statementToPrecision: 'unknown',
    reviewedAt: new Date('2026-01-12T00:00:00Z'),
    reviewState: 'approved',
  });
});

after(removeFixtures);

function rejectsWithConstraint(constraintName: string) {
  return (error: unknown) => error instanceof Error
    && typeof error.cause === 'object'
    && error.cause !== null
    && 'message' in error.cause
    && typeof error.cause.message === 'string'
    && error.cause.message.includes(constraintName);
}

test('speakers and subjects are independent many-to-many Political Actor relationships', async () => {
  await db.insert(publicClaimSpeakers).values([
    { publicClaimId, politicalActorId: actorIds[0] },
    { publicClaimId, politicalActorId: actorIds[1] },
  ]);
  await db.insert(publicClaimSubjects).values([
    { publicClaimId, politicalActorId: actorIds[1] },
    { publicClaimId, politicalActorId: actorIds[2] },
  ]);

  const speakers = await db.select().from(publicClaimSpeakers).where(eq(publicClaimSpeakers.publicClaimId, publicClaimId));
  const subjects = await db.select().from(publicClaimSubjects).where(eq(publicClaimSubjects.publicClaimId, publicClaimId));

  assert.deepEqual(speakers.map(({ politicalActorId }) => politicalActorId).sort(), [actorIds[0], actorIds[1]]);
  assert.deepEqual(subjects.map(({ politicalActorId }) => politicalActorId).sort(), [actorIds[1], actorIds[2]]);
});

test('a best-available Evidence Citation requires a precise locator and Reviewer explanation', async () => {
  await assert.rejects(
    db.insert(evidenceCitations).values({
      id: 22_099,
      publicClaimId,
      sourceVersionId,
      locatorType: 'section',
      locator: ' ',
      locatorPrecision: 'best_available',
      precisionExplanation: null,
      reviewState: 'approved',
    }),
    rejectsWithConstraint('evidence_citation_locator_check'),
  );
});
