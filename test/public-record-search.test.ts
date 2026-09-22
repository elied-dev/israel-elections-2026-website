import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { inArray } from 'drizzle-orm';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from '../src/app/page';
import PublicRecordPage from '../src/app/public-record/page';
import { getDb } from '../src/db/client';
import {
  authoritativeSources,
  candidacies,
  candidacyRevisions,
  electoralLists,
  evidenceCitations,
  personNames,
  persons,
  politicalActorSearchTerms,
  politicalActors,
  publicClaims,
  publicClaimSpeakers,
  publicClaimSubjects,
  publicClaimTags,
  quotations,
  sourceRecords,
  sourceRecordTags,
  sourceVersions,
  tags,
} from '../src/db/schema';

const db = getDb();
const sourceId = 24_001;
const actorIds = [24_001, 24_002, 24_003];
const claimIds = [24_001, 24_002, 24_003];
const sourceRecordIds = [24_001, 24_002, 24_003];
const sourceVersionIds = [24_001, 24_002, 24_003];
const tagIds = [24_001, 24_002, 24_003];

async function removeFixtures() {
  await db.delete(quotations).where(inArray(quotations.id, [24_001, 24_002]));
  await db.delete(evidenceCitations).where(inArray(evidenceCitations.id, [24_001, 24_002, 24_003]));
  await db.delete(publicClaimTags).where(inArray(publicClaimTags.publicClaimId, claimIds));
  await db.delete(sourceRecordTags).where(inArray(sourceRecordTags.sourceRecordId, sourceRecordIds));
  await db.delete(publicClaimSubjects).where(inArray(publicClaimSubjects.publicClaimId, claimIds));
  await db.delete(publicClaimSpeakers).where(inArray(publicClaimSpeakers.publicClaimId, claimIds));
  await db.delete(publicClaims).where(inArray(publicClaims.id, claimIds));
  await db.delete(sourceVersions).where(inArray(sourceVersions.id, sourceVersionIds));
  await db.delete(sourceRecords).where(inArray(sourceRecords.id, sourceRecordIds));
  await db.delete(tags).where(inArray(tags.id, tagIds));
  await db.delete(politicalActorSearchTerms).where(inArray(politicalActorSearchTerms.politicalActorId, actorIds));
  await db.delete(personNames).where(inArray(personNames.id, [24_001, 24_002, 24_003]));
  await db.delete(candidacyRevisions).where(inArray(candidacyRevisions.id, [24_001]));
  await db.delete(candidacies).where(inArray(candidacies.id, [24_001]));
  await db.delete(electoralLists).where(inArray(electoralLists.id, [actorIds[0]]));
  await db.delete(persons).where(inArray(persons.id, [actorIds[1], actorIds[2]]));
  await db.delete(politicalActors).where(inArray(politicalActors.id, actorIds));
  await db.delete(authoritativeSources).where(inArray(authoritativeSources.id, [sourceId]));
}

before(async () => {
  await removeFixtures();
  await db.insert(authoritativeSources).values({
    id: sourceId,
    title: 'Reviewed identity source',
    url: 'https://example.test/identity',
    retrievedAt: new Date('2026-01-01T00:00:00Z'),
  });
  await db.insert(politicalActors).values([
    { id: actorIds[0], type: 'electoral_list', currentDisplayName: 'Renewal List', currentSlug: 'renewal-list-24001' },
    { id: actorIds[1], type: 'person', currentDisplayName: 'בנימין נתניהו', currentSlug: 'binyamin-netanyahu-24002' },
    { id: actorIds[2], type: 'person', currentDisplayName: 'Private Pending Person', currentSlug: 'private-pending-person-24003' },
  ]);
  await db.insert(electoralLists).values({
    id: actorIds[0], editionId: 1, name: 'Renewal List', ballotIdentifier: 'ר', sourceId, reviewState: 'approved',
  });
  await db.insert(persons).values([{ id: actorIds[1] }, { id: actorIds[2] }]);
  await db.insert(candidacies).values({ id: 24_001, personId: actorIds[1], electoralListId: actorIds[0], editionId: 1 });
  await db.insert(candidacyRevisions).values({
    id: 24_001,
    candidacyId: 24_001,
    electoralListId: actorIds[0],
    position: 1,
    status: 'active',
    effectiveFrom: new Date('2026-01-01T00:00:00Z'),
    sourceId,
    reviewState: 'approved',
  });
  await db.insert(personNames).values([
    {
      id: 24_001, personId: actorIds[1], name: 'בנימין מיליקובסקי', nameType: 'name',
      validFrom: new Date('1949-01-01T00:00:00Z'), validFromPrecision: 'year',
      validTo: new Date('1972-01-01T00:00:00Z'), validToPrecision: 'year', sourceId, reviewState: 'approved',
    },
    {
      id: 24_002, personId: actorIds[1], name: 'Private pending alias', nameType: 'alias',
      validFrom: null, validFromPrecision: 'unknown', validTo: null, validToPrecision: 'unknown', sourceId, reviewState: 'pending',
    },
    {
      id: 24_003, personId: actorIds[1], name: 'ביבי', nameType: 'alias',
      validFrom: null, validFromPrecision: 'unknown', validTo: null, validToPrecision: 'unknown', sourceId, reviewState: 'approved',
    },
  ]);
  await db.insert(politicalActorSearchTerms).values([
    { id: 24_001, politicalActorId: actorIds[1], term: 'Binyamin Netanyahu', termType: 'transliteration', language: 'en', sourceId, reviewState: 'approved' },
    { id: 24_002, politicalActorId: actorIds[1], term: 'Benjamin Netanyahoo', termType: 'spelling_variant', language: 'en', sourceId, reviewState: 'approved' },
    { id: 24_003, politicalActorId: actorIds[1], term: 'בנימין נתנייהו', termType: 'spelling_variant', language: 'he', sourceId, reviewState: 'approved' },
    { id: 24_004, politicalActorId: actorIds[2], term: 'Private pending search term', termType: 'alias', language: 'en', sourceId, reviewState: 'pending' },
  ]);
  await db.insert(tags).values([
    { id: tagIds[0], name: 'Security', language: 'en', reviewState: 'approved' },
    { id: tagIds[1], name: 'כלכלה', language: 'he', reviewState: 'approved' },
    { id: tagIds[2], name: 'Private pending tag', language: 'en', reviewState: 'pending' },
  ]);
  await db.insert(sourceRecords).values([
    {
      id: sourceRecordIds[0], title: 'Ceasefire proposal with inspection terms archive', sourceType: 'Interview', sourceLanguage: 'en',
      author: 'Dana Reporter', publisher: 'Public Radio', publicationDate: new Date('2026-04-05T00:00:00Z'),
      availability: 'available', reviewState: 'approved',
    },
    {
      id: sourceRecordIds[1], title: 'דוח כלכלי', sourceType: 'Report', sourceLanguage: 'he',
      author: 'כתבת', publisher: 'העיתון', publicationDate: new Date('2024-05-01T00:00:00Z'),
      availability: 'available', reviewState: 'approved',
    },
    {
      id: sourceRecordIds[2], title: 'Private dossier', sourceType: 'Report', sourceLanguage: 'en',
      author: null, publisher: null, publicationDate: new Date('2026-04-05T00:00:00Z'),
      availability: 'available', reviewState: 'pending',
    },
  ]);
  await db.insert(sourceVersions).values(sourceVersionIds.map((id, index) => ({
    id,
    sourceRecordId: sourceRecordIds[index],
    changeType: 'original',
    retrievedAt: new Date('2026-04-06T00:00:00Z'),
    reviewState: 'approved',
  })));
  await db.insert(publicClaims).values([
    {
      id: claimIds[0], summary: 'Ceasefire proposal with inspection terms', language: 'en',
      statementFrom: new Date('2026-03-20T00:00:00Z'), statementFromPrecision: 'day',
      statementTo: null, statementToPrecision: 'unknown', reviewedAt: new Date('2026-04-07T00:00:00Z'), reviewState: 'approved',
    },
    {
      id: claimIds[1], summary: 'הצהרה על הכלכלה', language: 'he',
      statementFrom: new Date('2024-04-01T00:00:00Z'), statementFromPrecision: 'month',
      statementTo: null, statementToPrecision: 'unknown', reviewedAt: new Date('2024-05-02T00:00:00Z'), reviewState: 'approved',
    },
    {
      id: claimIds[2], summary: 'Private pending claim', language: 'en',
      statementFrom: null, statementFromPrecision: 'unknown', statementTo: null, statementToPrecision: 'unknown',
      reviewedAt: null, reviewState: 'pending',
    },
  ]);
  await db.insert(publicClaimSpeakers).values(claimIds.map((publicClaimId) => ({ publicClaimId, politicalActorId: actorIds[1] })));
  await db.insert(publicClaimSubjects).values([
    { publicClaimId: claimIds[0], politicalActorId: actorIds[0] },
    { publicClaimId: claimIds[1], politicalActorId: actorIds[0] },
  ]);
  await db.insert(evidenceCitations).values([
    { id: 24_001, publicClaimId: claimIds[0], sourceVersionId: sourceVersionIds[0], locatorType: 'section', locator: 'Security', locatorPrecision: 'exact', reviewState: 'approved' },
    { id: 24_002, publicClaimId: claimIds[1], sourceVersionId: sourceVersionIds[1], locatorType: 'page', locator: '2', locatorPrecision: 'exact', reviewState: 'approved' },
    { id: 24_003, publicClaimId: claimIds[2], sourceVersionId: sourceVersionIds[2], locatorType: 'page', locator: '1', locatorPrecision: 'exact', reviewState: 'approved' },
  ]);
  await db.insert(quotations).values([
    { id: 24_001, evidenceCitationId: 24_001, sourceLanguage: 'en', textDirection: 'ltr', text: 'Reviewed ceasefire quotation', reviewState: 'approved' },
    { id: 24_002, evidenceCitationId: 24_002, sourceLanguage: 'he', textDirection: 'rtl', text: 'ציטוט כלכלי', reviewState: 'approved' },
  ]);
  await db.insert(publicClaimTags).values([
    { publicClaimId: claimIds[0], tagId: tagIds[0], reviewState: 'approved' },
    { publicClaimId: claimIds[1], tagId: tagIds[1], reviewState: 'approved' },
    { publicClaimId: claimIds[2], tagId: tagIds[2], reviewState: 'pending' },
  ]);
  await db.insert(sourceRecordTags).values([
    { sourceRecordId: sourceRecordIds[0], tagId: tagIds[0], reviewState: 'approved' },
    { sourceRecordId: sourceRecordIds[1], tagId: tagIds[1], reviewState: 'approved' },
    { sourceRecordId: sourceRecordIds[2], tagId: tagIds[2], reviewState: 'pending' },
  ]);
});

after(removeFixtures);

const render = async (searchParams: Record<string, string> = {}) => renderToStaticMarkup(await PublicRecordPage({
  searchParams: Promise.resolve(searchParams),
}));

test('the home page links the top-level Public Record', async () => {
  const html = renderToStaticMarkup(await HomePage());
  assert.match(html, /href="\/public-record"[^>]*>Public Record<\/a>/);
});

test('the server-rendered Public Record browses approved actors, claims, Tags, and source metadata', async () => {
  const html = await render();

  assert.match(html, /<form[^>]*action="\/public-record"/);
  assert.match(html, /name="q"/);
  assert.match(html, /name="actorType"/);
  assert.match(html, /name="tag"/);
  assert.match(html, /name="dateFrom"/);
  assert.match(html, /name="dateTo"/);
  assert.match(html, /name="language"/);
  assert.match(html, /בנימין נתניהו/);
  assert.match(html, /Ceasefire proposal with inspection terms/);
  assert.match(html, /Security/);
  assert.match(html, /Ceasefire proposal with inspection terms archive/);
  assert.doesNotMatch(html, /Private pending Person|Private pending claim|Private pending tag|Private dossier|Private pending alias|Private pending search term/);
});

test('current and historical names, aliases, transliterations, Hebrew variants, Tags, claims, and source metadata are searchable', async () => {
  for (const q of ['בנימין נתניהו', 'בנימין מיליקובסקי', 'ביבי', 'Binyamin Netanyahu', 'Benjamin Netanyahoo', 'בנימין נתנייהו']) {
    assert.match(await render({ q }), /בנימין נתניהו/);
  }

  const tagHtml = await render({ q: 'Security' });
  assert.match(tagHtml, /Tag[\s\S]*Security/);
  assert.match(tagHtml, /Ceasefire proposal with inspection terms/);
  assert.match(tagHtml, /Ceasefire proposal with inspection terms archive/);

  const sourceHtml = await render({ q: 'Public Radio' });
  assert.match(sourceHtml, /Ceasefire proposal with inspection terms/);
  assert.match(sourceHtml, /Ceasefire proposal with inspection terms archive/);

  assert.match(await render({ q: 'inspection terms' }), /Ceasefire proposal with inspection terms/);
});

test('Political Actor type, Tag, date, and language filters narrow linked public results explicitly', async () => {
  const actorTypeHtml = await render({ actorType: 'person' });
  assert.match(actorTypeHtml, /בנימין נתניהו/);
  assert.match(actorTypeHtml, /Ceasefire proposal with inspection terms/);
  assert.doesNotMatch(actorTypeHtml, /href="\/electoral-lists\/renewal-list-24001">Renewal List|<article><p>Tag<\/p>/);

  const tagHtml = await render({ tag: String(tagIds[0]) });
  assert.match(tagHtml, /Ceasefire proposal with inspection terms/);
  assert.match(tagHtml, /Ceasefire proposal with inspection terms archive/);
  assert.doesNotMatch(tagHtml, /הצהרה על הכלכלה|דוח כלכלי/);

  const dateHtml = await render({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });
  assert.match(dateHtml, /Ceasefire proposal with inspection terms/);
  assert.match(dateHtml, /Ceasefire proposal with inspection terms archive/);
  assert.doesNotMatch(dateHtml, /הצהרה על הכלכלה|דוח כלכלי/);

  const languageHtml = await render({ language: 'he' });
  assert.match(languageHtml, /בנימין נתניהו/);
  assert.match(languageHtml, /הצהרה על הכלכלה/);
  assert.match(languageHtml, /כלכלה/);
  assert.match(languageHtml, /דוח כלכלי/);
  assert.doesNotMatch(languageHtml, /Ceasefire proposal with inspection terms(?: archive)?/);
});

test('invalid calendar dates are ignored instead of reaching PostgreSQL casts', async () => {
  const html = await render({ dateFrom: '2026-02-31' });
  assert.match(html, /Ceasefire proposal with inspection terms/);
});

test('search ordering uses textual relevance with neutral deterministic ties', async () => {
  const html = await render({ q: 'Ceasefire proposal with inspection terms' });
  assert.ok(html.indexOf('Ceasefire proposal with inspection terms') < html.indexOf('Ceasefire proposal with inspection terms archive'));
  assert.doesNotMatch(html, /prominence|popularity|featured/i);
});
