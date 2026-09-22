import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { inArray } from 'drizzle-orm';
import { renderToStaticMarkup } from 'react-dom/server';
import PublicClaimPage from '../src/app/claims/[id]/page';
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
const actorIds = [22_201, 22_202, 22_203];
const claimIds = [22_201, 22_202, 22_203];
const citationIds = [22_201, 22_202, 22_203];
const quotationIds = [22_201, 22_202];
const sourceRecordId = 22_201;
const sourceVersionId = 22_201;

async function removeFixtures() {
  await db.delete(quotationTranslations).where(inArray(quotationTranslations.quotationId, quotationIds));
  await db.delete(quotations).where(inArray(quotations.id, quotationIds));
  await db.delete(evidenceCitations).where(inArray(evidenceCitations.id, citationIds));
  await db.delete(publicClaimSubjects).where(inArray(publicClaimSubjects.publicClaimId, claimIds));
  await db.delete(publicClaimSpeakers).where(inArray(publicClaimSpeakers.publicClaimId, claimIds));
  await db.delete(publicClaims).where(inArray(publicClaims.id, claimIds));
  await db.delete(sourceVersions).where(inArray(sourceVersions.id, [sourceVersionId]));
  await db.delete(sourceRecords).where(inArray(sourceRecords.id, [sourceRecordId]));
  await db.delete(politicalActors).where(inArray(politicalActors.id, actorIds));
}

before(async () => {
  await removeFixtures();
  await db.insert(politicalActors).values([
    { id: actorIds[0], type: 'person', currentDisplayName: 'First Speaker', currentSlug: 'first-speaker' },
    { id: actorIds[1], type: 'person', currentDisplayName: 'Second Speaker', currentSlug: 'second-speaker' },
    { id: actorIds[2], type: 'electoral_list', currentDisplayName: 'Concerned List', currentSlug: 'concerned-list' },
  ]);
  await db.insert(sourceRecords).values({
    id: sourceRecordId,
    title: 'Reviewed interview',
    sourceType: 'Interview',
    author: 'Reporter',
    publisher: 'Example News',
    publicationDate: new Date('2026-01-10T00:00:00Z'),
    availability: 'available',
    reviewState: 'approved',
  });
  await db.insert(sourceVersions).values({
    id: sourceVersionId,
    sourceRecordId,
    changeType: 'original',
    observedPublishedAt: new Date('2026-01-11T00:00:00Z'),
    retrievedAt: new Date('2026-01-12T00:00:00Z'),
    reviewState: 'approved',
  });
  await db.insert(publicClaims).values([
    {
      id: claimIds[0],
      summary: 'The speakers made a reviewed public statement.',
      statementFrom: new Date('2025-05-01T00:00:00Z'),
      statementFromPrecision: 'month',
      statementTo: null,
      statementToPrecision: 'unknown',
      reviewedAt: new Date('2026-01-15T00:00:00Z'),
      reviewState: 'approved',
    },
    {
      id: claimIds[1],
      summary: 'Approved but unsupported claim.',
      statementFrom: null,
      statementFromPrecision: 'unknown',
      statementTo: null,
      statementToPrecision: 'unknown',
      reviewedAt: new Date('2026-01-15T00:00:00Z'),
      reviewState: 'approved',
    },
    {
      id: claimIds[2],
      summary: 'Pending private claim.',
      statementFrom: null,
      statementFromPrecision: 'unknown',
      statementTo: null,
      statementToPrecision: 'unknown',
      reviewedAt: null,
      reviewState: 'pending',
    },
  ]);
  await db.insert(publicClaimSpeakers).values([
    { publicClaimId: claimIds[0], politicalActorId: actorIds[0] },
    { publicClaimId: claimIds[0], politicalActorId: actorIds[1] },
  ]);
  await db.insert(publicClaimSubjects).values([
    { publicClaimId: claimIds[0], politicalActorId: actorIds[1] },
    { publicClaimId: claimIds[0], politicalActorId: actorIds[2] },
  ]);
  await db.insert(evidenceCitations).values([
    {
      id: citationIds[0],
      publicClaimId: claimIds[0],
      sourceVersionId,
      locatorType: 'timestamp',
      locator: '00:01:24–00:01:31',
      locatorPrecision: 'exact',
      reviewState: 'approved',
    },
    {
      id: citationIds[1],
      publicClaimId: claimIds[0],
      sourceVersionId,
      locatorType: 'section',
      locator: 'Pending private locator',
      locatorPrecision: 'exact',
      reviewState: 'pending',
    },
    {
      id: citationIds[2],
      publicClaimId: claimIds[2],
      sourceVersionId,
      locatorType: 'page',
      locator: '7',
      locatorPrecision: 'exact',
      reviewState: 'approved',
    },
  ]);
  await db.insert(quotations).values([
    {
      id: quotationIds[0],
      evidenceCitationId: citationIds[0],
      sourceLanguage: 'he',
      textDirection: 'rtl',
      text: 'ציטוט מקורי',
      reviewState: 'approved',
    },
    {
      id: quotationIds[1],
      evidenceCitationId: citationIds[0],
      sourceLanguage: 'he',
      textDirection: 'rtl',
      text: 'Pending private quotation',
      reviewState: 'pending',
    },
  ]);
  await db.insert(quotationTranslations).values([
    {
      id: 22_201,
      quotationId: quotationIds[0],
      language: 'en',
      textDirection: 'ltr',
      text: 'Reviewed English translation.',
      machineAssisted: true,
      reviewState: 'approved',
    },
    {
      id: 22_202,
      quotationId: quotationIds[0],
      language: 'fr',
      textDirection: 'ltr',
      text: 'Pending private translation.',
      machineAssisted: false,
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

test('a Public Claim page separates dates and actor roles and traces precise evidence to its Source Version', async () => {
  const html = renderToStaticMarkup(await PublicClaimPage({
    params: Promise.resolve({ id: String(claimIds[0]) }),
  }));

  assert.match(html, /The speakers made a reviewed public statement/);
  assert.match(html, /Statement date[\s\S]*May 2025/);
  assert.match(html, /Claim reviewed[\s\S]*2026-01-15/);
  assert.match(html, /Speakers[\s\S]*First Speaker[\s\S]*Second Speaker/);
  assert.match(html, /Subjects[\s\S]*Concerned List/);
  assert.match(html, /Subjects[\s\S]*Second Speaker/);
  assert.match(html, /Timestamp[\s\S]*00:01:24–00:01:31/);
  assert.match(html, /Source publication[\s\S]*2026-01-10/);
  assert.match(html, /Observed publication or update[\s\S]*2026-01-11/);
  assert.match(html, /Retrieved[\s\S]*2026-01-12/);
  assert.match(html, new RegExp(`href="/sources/${sourceRecordId}#version-${sourceVersionId}"`));
  assert.doesNotMatch(html, /Pending private locator/);
});

test('an original Source Language Quotation remains beside only reviewed translations', async () => {
  const html = renderToStaticMarkup(await PublicClaimPage({
    params: Promise.resolve({ id: String(claimIds[0]) }),
  }));

  assert.match(html, /Original quotation \(he\)[\s\S]*dir="rtl"[\s\S]*ציטוט מקורי/);
  assert.match(html, /Reviewed translation \(en, machine-assisted\)[\s\S]*Reviewed English translation/);
  assert.doesNotMatch(html, /Pending private quotation|Pending private translation/);
});

test('unapproved, uncited, and invalid Public Claims produce 404', async () => {
  assert.equal(await digestOf(() => PublicClaimPage({ params: Promise.resolve({ id: String(claimIds[1]) }) })), 'NEXT_HTTP_ERROR_FALLBACK;404');
  assert.equal(await digestOf(() => PublicClaimPage({ params: Promise.resolve({ id: String(claimIds[2]) }) })), 'NEXT_HTTP_ERROR_FALLBACK;404');
  assert.equal(await digestOf(() => PublicClaimPage({ params: Promise.resolve({ id: 'not-a-number' }) })), 'NEXT_HTTP_ERROR_FALLBACK;404');
  assert.equal(await digestOf(() => PublicClaimPage({ params: Promise.resolve({ id: '2147483648' }) })), 'NEXT_HTTP_ERROR_FALLBACK;404');
});
