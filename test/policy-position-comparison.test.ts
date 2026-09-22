import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { inArray } from 'drizzle-orm';
import { renderToStaticMarkup } from 'react-dom/server';
import PolicyPositionComparisonPage from '../src/app/policy-positions/page';
import { getDb } from '../src/db/client';
import {
  electionEditions,
  electoralLists,
  evidenceCitations,
  policyPositions,
  politicalActors,
  publicClaims,
  publicClaimSpeakers,
  quotationTranslations,
  quotations,
  sourceRecords,
  sourceVersions,
} from '../src/db/schema';

const db = getDb();
const editionId = 1;
const listIds = [23_001, 23_002, 23_003, 23_004];
const claimIds = [23_001, 23_002, 23_003];
const citationIds = [23_001, 23_002, 23_003];
const quotationIds = [23_001, 23_002, 23_003];
const sourceRecordId = 23_001;
const sourceVersionId = 23_001;

async function removeFixtures() {
  await db.delete(quotationTranslations).where(inArray(quotationTranslations.quotationId, quotationIds));
  await db.delete(quotations).where(inArray(quotations.id, quotationIds));
  await db.delete(evidenceCitations).where(inArray(evidenceCitations.id, citationIds));
  await db.delete(policyPositions).where(inArray(policyPositions.publicClaimId, claimIds));
  await db.delete(publicClaimSpeakers).where(inArray(publicClaimSpeakers.publicClaimId, claimIds));
  await db.delete(publicClaims).where(inArray(publicClaims.id, claimIds));
  await db.delete(sourceVersions).where(inArray(sourceVersions.id, [sourceVersionId]));
  await db.delete(sourceRecords).where(inArray(sourceRecords.id, [sourceRecordId]));
  await db.delete(electoralLists).where(inArray(electoralLists.id, listIds));
  await db.delete(politicalActors).where(inArray(politicalActors.id, listIds));
}

before(async () => {
  await removeFixtures();
  await db.insert(politicalActors).values([
    { id: listIds[0], type: 'electoral_list', currentDisplayName: 'Alpha List', currentSlug: 'alpha-list-23001' },
    { id: listIds[1], type: 'electoral_list', currentDisplayName: 'Beta List', currentSlug: 'beta-list-23002' },
    { id: listIds[2], type: 'electoral_list', currentDisplayName: 'Gamma List', currentSlug: 'gamma-list-23003' },
    { id: listIds[3], type: 'electoral_list', currentDisplayName: 'Pending List', currentSlug: 'pending-list-23004' },
  ]);
  await db.insert(electoralLists).values([
    { id: listIds[0], editionId, name: 'Alpha List', ballotIdentifier: 'א', sourceId: null, reviewState: 'approved' },
    { id: listIds[1], editionId, name: 'Beta List', ballotIdentifier: 'ב', sourceId: null, reviewState: 'approved' },
    { id: listIds[2], editionId, name: 'Gamma List', ballotIdentifier: 'ג', sourceId: null, reviewState: 'approved' },
    { id: listIds[3], editionId, name: 'Pending List', ballotIdentifier: 'ד', sourceId: null, reviewState: 'pending' },
  ]);
  await db.insert(sourceRecords).values({
    id: sourceRecordId,
    title: 'Reviewed policy interview',
    sourceType: 'Interview',
    author: 'Reporter',
    publisher: 'Example News',
    publicationDate: new Date('2026-02-01T00:00:00Z'),
    availability: 'available',
    reviewState: 'approved',
  });
  await db.insert(sourceVersions).values({
    id: sourceVersionId,
    sourceRecordId,
    changeType: 'original',
    observedPublishedAt: new Date('2026-02-02T00:00:00Z'),
    retrievedAt: new Date('2026-02-03T00:00:00Z'),
    reviewState: 'approved',
  });
  await db.insert(publicClaims).values([
    {
      id: claimIds[0], summary: 'Alpha supports a reviewed housing measure.',
      statementFrom: null, statementFromPrecision: 'unknown', statementTo: null, statementToPrecision: 'unknown',
      reviewedAt: new Date('2026-02-04T00:00:00Z'), reviewState: 'approved',
    },
    {
      id: claimIds[1], summary: 'Beta opposes a reviewed housing measure.',
      statementFrom: null, statementFromPrecision: 'unknown', statementTo: null, statementToPrecision: 'unknown',
      reviewedAt: new Date('2026-02-04T00:00:00Z'), reviewState: 'approved',
    },
    {
      id: claimIds[2], summary: 'Pending private policy position.',
      statementFrom: null, statementFromPrecision: 'unknown', statementTo: null, statementToPrecision: 'unknown',
      reviewedAt: null, reviewState: 'pending',
    },
  ]);
  await db.insert(policyPositions).values([
    { publicClaimId: claimIds[0], topic: 'Housing' },
    { publicClaimId: claimIds[1], topic: 'Housing' },
    { publicClaimId: claimIds[2], topic: 'Housing' },
  ]);
  await db.insert(publicClaimSpeakers).values([
    { publicClaimId: claimIds[0], politicalActorId: listIds[0] },
    { publicClaimId: claimIds[1], politicalActorId: listIds[1] },
    { publicClaimId: claimIds[2], politicalActorId: listIds[3] },
  ]);
  await db.insert(evidenceCitations).values([
    { id: citationIds[0], publicClaimId: claimIds[0], sourceVersionId, locatorType: 'section', locator: 'Housing', locatorPrecision: 'exact', reviewState: 'approved' },
    { id: citationIds[1], publicClaimId: claimIds[1], sourceVersionId, locatorType: 'section', locator: 'Housing', locatorPrecision: 'exact', reviewState: 'approved' },
    { id: citationIds[2], publicClaimId: claimIds[2], sourceVersionId, locatorType: 'section', locator: 'Private', locatorPrecision: 'exact', reviewState: 'approved' },
  ]);
  await db.insert(quotations).values([
    { id: quotationIds[0], evidenceCitationId: citationIds[0], sourceLanguage: 'he', textDirection: 'rtl', text: 'ציטוט מדיניות', reviewState: 'approved' },
    { id: quotationIds[1], evidenceCitationId: citationIds[1], sourceLanguage: 'en', textDirection: 'ltr', text: 'A reviewed English quotation.', reviewState: 'approved' },
    { id: quotationIds[2], evidenceCitationId: citationIds[2], sourceLanguage: 'en', textDirection: 'ltr', text: 'Private quotation.', reviewState: 'approved' },
  ]);
  await db.insert(quotationTranslations).values([
    { id: 23_001, quotationId: quotationIds[0], language: 'en', textDirection: 'ltr', text: 'A reviewed translation.', machineAssisted: true, reviewState: 'approved' },
    { id: 23_002, quotationId: quotationIds[1], language: 'fr', textDirection: 'ltr', text: 'Private pending translation.', machineAssisted: false, reviewState: 'pending' },
  ]);
});

after(removeFixtures);

test('the server-rendered comparison includes every approved Electoral List with neutral Policy Positions and inspectable evidence', async () => {
  const html = renderToStaticMarkup(await PolicyPositionComparisonPage());

  assert.match(html, /2026 Knesset election Policy Position comparison/);
  assert.match(html, /<table>/);
  assert.match(html, /Housing/);
  assert.ok(html.indexOf('Alpha List') < html.indexOf('Beta List'));
  assert.ok(html.indexOf('Beta List') < html.indexOf('Gamma List'));
  assert.match(html, /Alpha supports a reviewed housing measure/);
  assert.match(html, /Beta opposes a reviewed housing measure/);
  assert.match(html, /Gamma List[\s\S]*Unavailable: no reviewed Policy Position is available\./);
  assert.match(html, /Evidence preview/);
  assert.match(html, /ציטוט מדיניות/);
  assert.match(html, /Reviewed translation \(en, machine-assisted\)[\s\S]*A reviewed translation/);
  assert.match(html, /Translation state: unavailable/);
  assert.match(html, /Reviewed policy interview/);
  assert.match(html, /Source publication[\s\S]*2026-02-01/);
  assert.match(html, /Review state: approved/);
  assert.doesNotMatch(html, /Pending List|Pending private policy position|Private quotation|Private pending translation/);
});
