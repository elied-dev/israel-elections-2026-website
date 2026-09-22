import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import {
  sourceRecords,
  sourceReuse,
  sourceVersionLocations,
  sourceVersions,
} from '../src/db/schema';

const db = getDb();
const sourceRecordId = 21_001;
const versionIds = [21_001, 21_002, 21_099];

async function removeFixtures() {
  await db.delete(sourceReuse).where(inArray(sourceReuse.sourceVersionId, versionIds));
  await db.delete(sourceVersionLocations).where(inArray(sourceVersionLocations.sourceVersionId, versionIds));
  await db.delete(sourceVersions).where(inArray(sourceVersions.id, versionIds));
  await db.delete(sourceRecords).where(eq(sourceRecords.id, sourceRecordId));
}

before(async () => {
  await removeFixtures();
  await db.insert(sourceRecords).values({
    id: sourceRecordId,
    title: 'Reviewed report',
    sourceType: 'official record',
    author: 'Records office',
    publisher: 'Example institution',
    publicationDate: new Date('2026-08-01T00:00:00Z'),
    availability: 'available',
    reviewState: 'approved',
  });
  await db.insert(sourceVersions).values([
    {
      id: versionIds[0],
      sourceRecordId,
      changeType: 'original',
      changeSummary: null,
      previousVersionId: null,
      observedPublishedAt: new Date('2026-08-01T00:00:00Z'),
      retrievedAt: new Date('2026-08-02T00:00:00Z'),
      checksum: 'sha256:first',
      reviewState: 'approved',
    },
    {
      id: versionIds[1],
      sourceRecordId,
      changeType: 'correction',
      changeSummary: 'Corrected the published total.',
      previousVersionId: versionIds[0],
      observedPublishedAt: new Date('2026-08-03T00:00:00Z'),
      retrievedAt: new Date('2026-08-04T00:00:00Z'),
      checksum: 'sha256:second',
      reviewState: 'approved',
    },
  ]);
  await db.insert(sourceVersionLocations).values([
    { id: 21_001, sourceVersionId: versionIds[0], url: 'https://example.test/report', locationType: 'original', reviewState: 'approved' },
    { id: 21_002, sourceVersionId: versionIds[0], url: 'https://mirror.test/report', locationType: 'mirror', reviewState: 'approved' },
  ]);
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

test('material changes are distinct versions while mirrors share one version', async () => {
  const versions = await db.select().from(sourceVersions).where(eq(sourceVersions.sourceRecordId, sourceRecordId));
  const locations = await db.select().from(sourceVersionLocations).where(eq(sourceVersionLocations.sourceVersionId, versionIds[0]));

  assert.equal(versions.length, 2);
  assert.deepEqual(locations.map(({ locationType }) => locationType).sort(), ['mirror', 'original']);
});

test('a materially changed version must identify its predecessor', async () => {
  await assert.rejects(
    db.insert(sourceVersions).values({
      id: versionIds[2],
      sourceRecordId,
      changeType: 'update',
      changeSummary: 'Changed without provenance.',
      previousVersionId: null,
      observedPublishedAt: null,
      retrievedAt: new Date('2026-08-05T00:00:00Z'),
      checksum: null,
      reviewState: 'approved',
    }),
    rejectsWithConstraint('source_version_predecessor_check'),
  );
});
