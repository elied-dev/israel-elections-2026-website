import { and, asc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  sourceRecords,
  sourceReuse,
  sourceVersionLocations,
  sourceVersions,
} from '@/db/schema';

export async function getPublicSourceRecord(id: number) {
  const db = getDb();
  const record = (
    await db.select().from(sourceRecords).where(and(
      eq(sourceRecords.id, id),
      eq(sourceRecords.reviewState, 'approved'),
    )).limit(1)
  )[0];

  if (!record) return null;

  const versions = await db
    .select()
    .from(sourceVersions)
    .where(and(
      eq(sourceVersions.sourceRecordId, id),
      eq(sourceVersions.reviewState, 'approved'),
    ))
    .orderBy(asc(sourceVersions.retrievedAt), asc(sourceVersions.id));

  if (!versions.length) return { ...record, versions: [], reuse: [] };

  const versionIds = versions.map(({ id: versionId }) => versionId);
  const locations = await db
    .select()
    .from(sourceVersionLocations)
    .where(and(
      inArray(sourceVersionLocations.sourceVersionId, versionIds),
      eq(sourceVersionLocations.reviewState, 'approved'),
    ))
    .orderBy(asc(sourceVersionLocations.id));
  const reuse = await db
    .select()
    .from(sourceReuse)
    .where(and(
      inArray(sourceReuse.sourceVersionId, versionIds),
      eq(sourceReuse.reviewState, 'approved'),
    ))
    .orderBy(asc(sourceReuse.id));

  return {
    ...record,
    versions: versions.map((version) => ({
      ...version,
      locations: locations.filter(({ sourceVersionId }) => sourceVersionId === version.id),
    })),
    reuse,
  };
}
