import { and, asc, eq, inArray } from 'drizzle-orm';
import type { DatePrecision } from '@/date-precision';
import { getDb } from '@/db/client';
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
} from '@/db/schema';

export async function getPublicClaim(id: number) {
  const db = getDb();
  const claim = (
    await db.select().from(publicClaims).where(and(
      eq(publicClaims.id, id),
      eq(publicClaims.reviewState, 'approved'),
    )).limit(1)
  )[0];

  if (!claim) return null;

  const citations = await db
    .select({
      id: evidenceCitations.id,
      locatorType: evidenceCitations.locatorType,
      locator: evidenceCitations.locator,
      locatorPrecision: evidenceCitations.locatorPrecision,
      precisionExplanation: evidenceCitations.precisionExplanation,
      sourceVersionId: sourceVersions.id,
      sourceRecordId: sourceRecords.id,
      sourceTitle: sourceRecords.title,
      sourcePublicationDate: sourceRecords.publicationDate,
      observedPublishedAt: sourceVersions.observedPublishedAt,
      retrievedAt: sourceVersions.retrievedAt,
    })
    .from(evidenceCitations)
    .innerJoin(sourceVersions, and(
      eq(sourceVersions.id, evidenceCitations.sourceVersionId),
      eq(sourceVersions.reviewState, 'approved'),
    ))
    .innerJoin(sourceRecords, and(
      eq(sourceRecords.id, sourceVersions.sourceRecordId),
      eq(sourceRecords.reviewState, 'approved'),
    ))
    .where(and(
      eq(evidenceCitations.publicClaimId, id),
      eq(evidenceCitations.reviewState, 'approved'),
    ))
    .orderBy(asc(evidenceCitations.id));

  if (!citations.length) return null;

  const actors = async (table: typeof publicClaimSpeakers | typeof publicClaimSubjects) => db
    .select({
      id: politicalActors.id,
      type: politicalActors.type,
      name: politicalActors.currentDisplayName,
      slug: politicalActors.currentSlug,
    })
    .from(table)
    .innerJoin(politicalActors, eq(politicalActors.id, table.politicalActorId))
    .where(eq(table.publicClaimId, id))
    .orderBy(asc(politicalActors.currentDisplayName));

  const citationIds = citations.map(({ id: citationId }) => citationId);
  const quotationRows = await db
    .select()
    .from(quotations)
    .where(and(
      inArray(quotations.evidenceCitationId, citationIds),
      eq(quotations.reviewState, 'approved'),
    ))
    .orderBy(asc(quotations.id));
  const translationRows = quotationRows.length
    ? await db
      .select()
      .from(quotationTranslations)
      .where(and(
        inArray(quotationTranslations.quotationId, quotationRows.map(({ id: quotationId }) => quotationId)),
        eq(quotationTranslations.reviewState, 'approved'),
      ))
      .orderBy(asc(quotationTranslations.id))
    : [];

  return {
    ...claim,
    statementFromPrecision: claim.statementFromPrecision as DatePrecision,
    statementToPrecision: claim.statementToPrecision as DatePrecision,
    speakers: await actors(publicClaimSpeakers),
    subjects: await actors(publicClaimSubjects),
    citations: citations.map((citation) => ({
      ...citation,
      quotations: quotationRows
        .filter(({ evidenceCitationId }) => evidenceCitationId === citation.id)
        .map((quotation) => ({
          ...quotation,
          translations: translationRows.filter(({ quotationId }) => quotationId === quotation.id),
        })),
    })),
  };
}
