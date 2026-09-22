import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { inArray } from 'drizzle-orm';
import { renderToStaticMarkup } from 'react-dom/server';
import SourceRecordPage from '../src/app/sources/[id]/page';
import { getDb } from '../src/db/client';
import {
  sourceRecords,
  sourceReuse,
  sourceVersionLocations,
  sourceVersions,
} from '../src/db/schema';

const db = getDb();
const sourceRecordIds = [21_201, 21_202, 21_203];
const versionIds = [21_201, 21_202, 21_203, 21_211, 21_221];

async function removeFixtures() {
  await db.delete(sourceReuse).where(inArray(sourceReuse.sourceVersionId, versionIds));
  await db.delete(sourceVersionLocations).where(inArray(sourceVersionLocations.sourceVersionId, versionIds));
  await db.delete(sourceVersions).where(inArray(sourceVersions.id, versionIds));
  await db.delete(sourceRecords).where(inArray(sourceRecords.id, sourceRecordIds));
}

before(async () => {
  await removeFixtures();
  await db.insert(sourceRecords).values([
    {
      id: sourceRecordIds[0],
      title: 'Election Administration Report',
      sourceType: 'Official record',
      sourceLanguage: 'en',
      author: 'Dana Author',
      publisher: 'Election Office',
      publicationDate: new Date('2026-07-01T00:00:00Z'),
      availability: 'available',
      reviewState: 'approved',
    },
    {
      id: sourceRecordIds[1],
      title: 'Unavailable News Report',
      sourceType: 'Journalism',
      sourceLanguage: 'en',
      author: null,
      publisher: 'Example News',
      publicationDate: null,
      availability: 'unavailable',
      reviewState: 'approved',
    },
    {
      id: sourceRecordIds[2],
      title: 'Pending Private Source',
      sourceType: 'Article',
      sourceLanguage: 'en',
      author: 'Private Author',
      publisher: null,
      publicationDate: null,
      availability: 'available',
      reviewState: 'pending',
    },
  ]);
  await db.insert(sourceVersions).values([
    {
      id: versionIds[0],
      sourceRecordId: sourceRecordIds[0],
      changeType: 'original',
      changeSummary: null,
      previousVersionId: null,
      observedPublishedAt: new Date('2026-07-01T00:00:00Z'),
      retrievedAt: new Date('2026-07-02T00:00:00Z'),
      checksum: 'sha256:original',
      reviewState: 'approved',
    },
    {
      id: versionIds[1],
      sourceRecordId: sourceRecordIds[0],
      changeType: 'correction',
      changeSummary: 'Corrected the reported candidate total.',
      previousVersionId: versionIds[0],
      observedPublishedAt: new Date('2026-07-03T00:00:00Z'),
      retrievedAt: new Date('2026-07-04T00:00:00Z'),
      checksum: 'sha256:correction',
      reviewState: 'approved',
    },
    {
      id: versionIds[2],
      sourceRecordId: sourceRecordIds[0],
      changeType: 'update',
      changeSummary: 'Pending private update.',
      previousVersionId: versionIds[1],
      observedPublishedAt: null,
      retrievedAt: new Date('2026-07-05T00:00:00Z'),
      checksum: null,
      reviewState: 'pending',
    },
    {
      id: versionIds[3],
      sourceRecordId: sourceRecordIds[1],
      changeType: 'original',
      changeSummary: null,
      previousVersionId: null,
      observedPublishedAt: null,
      retrievedAt: new Date('2026-06-15T00:00:00Z'),
      checksum: 'sha256:unavailable',
      reviewState: 'approved',
    },
    {
      id: versionIds[4],
      sourceRecordId: sourceRecordIds[2],
      changeType: 'original',
      changeSummary: null,
      previousVersionId: null,
      observedPublishedAt: null,
      retrievedAt: new Date('2026-05-01T00:00:00Z'),
      checksum: null,
      reviewState: 'approved',
    },
  ]);
  await db.insert(sourceVersionLocations).values([
    { id: 21_201, sourceVersionId: versionIds[0], url: 'https://office.test/report', locationType: 'original', reviewState: 'approved' },
    { id: 21_202, sourceVersionId: versionIds[0], url: 'https://mirror.test/report', locationType: 'mirror', reviewState: 'approved' },
    { id: 21_203, sourceVersionId: versionIds[0], url: 'https://private.test/location', locationType: 'mirror', reviewState: 'pending' },
    { id: 21_211, sourceVersionId: versionIds[3], url: 'https://news.test/missing', locationType: 'original', reviewState: 'approved' },
  ]);
  await db.insert(sourceReuse).values([
    {
      id: 21_201,
      sourceVersionId: versionIds[0],
      materialType: 'Quotation',
      retainedMaterial: 'A short reviewed quotation.',
      reuseBasis: 'Reviewed quotation exception',
      requiredAttribution: 'Dana Author, Election Office',
      reviewState: 'approved',
    },
    {
      id: 21_202,
      sourceVersionId: versionIds[0],
      materialType: 'Quotation',
      retainedMaterial: 'Private pending quotation.',
      reuseBasis: 'Pending basis',
      requiredAttribution: 'Pending attribution',
      reviewState: 'pending',
    },
    {
      id: 21_211,
      sourceVersionId: versionIds[3],
      materialType: 'Quotation',
      retainedMaterial: 'Legally retained excerpt.',
      reuseBasis: 'Reviewed fair-use quotation rationale',
      requiredAttribution: 'Example News',
      reviewState: 'approved',
    },
    {
      id: 21_212,
      sourceVersionId: versionIds[3],
      materialType: 'Article',
      retainedMaterial: 'Entire protected article.',
      reuseBasis: 'Pending legal review',
      requiredAttribution: 'Example News',
      reviewState: 'pending',
    },
  ]);
});

after(removeFixtures);

async function digestOf(work: () => Promise<unknown>): Promise<string> {
  try {
    await work();
  } catch (error) {
    if (error instanceof Error && typeof (error as { digest?: unknown }).digest === 'string') {
      return (error as unknown as { digest: string }).digest;
    }
    throw error;
  }
  throw new Error('Expected a Next.js navigation exception');
}

test('a permanent Source Record page publishes approved provenance, distinct versions, mirrors, reuse, and corrections', async () => {
  const html = renderToStaticMarkup(await SourceRecordPage({
    params: Promise.resolve({ id: String(sourceRecordIds[0]) }),
  }));

  assert.match(html, /Election Administration Report/);
  assert.match(html, /Official record/);
  assert.match(html, /Dana Author/);
  assert.match(html, /Election Office/);
  assert.match(html, /2026-07-01/);
  assert.match(html, /Available/);
  assert.match(html, /Retrieved: 2026-07-02/);
  assert.match(html, new RegExp(`id="version-${versionIds[0]}"`));
  assert.match(html, /Retrieved: 2026-07-04/);
  assert.match(html, /Original/);
  assert.match(html, /Correction/);
  assert.match(html, /href="https:\/\/office\.test\/report"/);
  assert.match(html, /href="https:\/\/mirror\.test\/report"/);
  assert.match(html, /Mirror/);
  assert.match(html, /Corrected the reported candidate total/);
  assert.match(html, /Reviewed quotation exception/);
  assert.match(html, /Dana Author, Election Office/);
  assert.match(html, /A short reviewed quotation/);
  assert.doesNotMatch(html, /Pending private update|private\.test|Private pending quotation/);
  assert.doesNotMatch(html, /reliability|truth score/i);
});

test('an unavailable Source Record keeps a warning and approved legally retained material only', async () => {
  const html = renderToStaticMarkup(await SourceRecordPage({
    params: Promise.resolve({ id: String(sourceRecordIds[1]) }),
  }));

  assert.match(html, /role="alert"/);
  assert.match(html, /external source is unavailable/i);
  assert.match(html, /Legally retained excerpt/);
  assert.match(html, /Reviewed fair-use quotation rationale/);
  assert.match(html, /Example News/);
  assert.doesNotMatch(html, /Entire protected article|Pending legal review/);
  assert.match(html, /Author[\s\S]*Not known/);
  assert.match(html, /Publication date[\s\S]*Not known/);
});

test('unapproved and invalid Source Record IDs produce 404', async () => {
  assert.equal(await digestOf(() => SourceRecordPage({ params: Promise.resolve({ id: String(sourceRecordIds[2]) }) })), 'NEXT_HTTP_ERROR_FALLBACK;404');
  assert.equal(await digestOf(() => SourceRecordPage({ params: Promise.resolve({ id: 'not-a-number' }) })), 'NEXT_HTTP_ERROR_FALLBACK;404');
  assert.equal(await digestOf(() => SourceRecordPage({ params: Promise.resolve({ id: '2147483648' }) })), 'NEXT_HTTP_ERROR_FALLBACK;404');
});
