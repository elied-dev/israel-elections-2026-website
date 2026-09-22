import { and, asc, eq, inArray } from 'drizzle-orm';
import type { DatePrecision } from '@/date-precision';
import { getDb } from '@/db/client';
import {
  candidacies,
  candidacyRevisions,
  electoralLists,
  officeTenures,
  partyAffiliations,
  personNames,
  persons,
  politicalActors,
  politicalParties,
  politicalStatusItems,
  politicalStatuses,
} from '@/db/schema';

export async function getPublicPersonProfile(id: number) {
  const db = getDb();

  const identity = (
    await db
      .select({ id: persons.id, name: politicalActors.currentDisplayName })
      .from(persons)
      .innerJoin(politicalActors, eq(politicalActors.id, persons.id))
      .innerJoin(candidacies, eq(candidacies.personId, persons.id))
      .innerJoin(candidacyRevisions, and(
        eq(candidacyRevisions.candidacyId, candidacies.id),
        eq(candidacyRevisions.electoralListId, candidacies.electoralListId),
        eq(candidacyRevisions.reviewState, 'approved'),
      ))
      .innerJoin(electoralLists, and(
        eq(electoralLists.id, candidacies.electoralListId),
        eq(electoralLists.reviewState, 'approved'),
      ))
      .where(eq(persons.id, id))
      .limit(1)
  )[0];

  if (!identity) return null;

  const asPrecision = (value: string) => value as DatePrecision;

  const names = (await db
    .select({
      id: personNames.id,
      name: personNames.name,
      nameType: personNames.nameType,
      validFrom: personNames.validFrom,
      validFromPrecision: personNames.validFromPrecision,
      validTo: personNames.validTo,
      validToPrecision: personNames.validToPrecision,
    })
    .from(personNames)
    .where(and(eq(personNames.personId, id), eq(personNames.reviewState, 'approved')))
    .orderBy(asc(personNames.validFrom), asc(personNames.id))).map((row) => ({
    ...row,
    validFromPrecision: asPrecision(row.validFromPrecision),
    validToPrecision: asPrecision(row.validToPrecision),
  }));

  const partyAffiliationRows = (await db
    .select({
      id: partyAffiliations.id,
      partyName: politicalActors.currentDisplayName,
      validFrom: partyAffiliations.validFrom,
      validFromPrecision: partyAffiliations.validFromPrecision,
      validTo: partyAffiliations.validTo,
      validToPrecision: partyAffiliations.validToPrecision,
    })
    .from(partyAffiliations)
    .innerJoin(politicalParties, eq(politicalParties.id, partyAffiliations.politicalPartyId))
    .innerJoin(politicalActors, eq(politicalActors.id, politicalParties.id))
    .where(and(eq(partyAffiliations.personId, id), eq(partyAffiliations.reviewState, 'approved')))
    .orderBy(asc(partyAffiliations.validFrom), asc(partyAffiliations.id))).map((row) => ({
    ...row,
    validFromPrecision: asPrecision(row.validFromPrecision),
    validToPrecision: asPrecision(row.validToPrecision),
  }));

  const officeTenureRows = (await db
    .select({
      id: officeTenures.id,
      officeTitle: officeTenures.officeTitle,
      validFrom: officeTenures.validFrom,
      validFromPrecision: officeTenures.validFromPrecision,
      validTo: officeTenures.validTo,
      validToPrecision: officeTenures.validToPrecision,
    })
    .from(officeTenures)
    .where(and(eq(officeTenures.personId, id), eq(officeTenures.reviewState, 'approved')))
    .orderBy(asc(officeTenures.validFrom), asc(officeTenures.id))).map((row) => ({
    ...row,
    validFromPrecision: asPrecision(row.validFromPrecision),
    validToPrecision: asPrecision(row.validToPrecision),
  }));

  const candidacyRows = await db
    .select({
      id: candidacyRevisions.id,
      candidacyId: candidacies.id,
      listName: electoralLists.name,
      position: candidacyRevisions.position,
      status: candidacyRevisions.status,
      effectiveFrom: candidacyRevisions.effectiveFrom,
      effectiveTo: candidacyRevisions.effectiveTo,
    })
    .from(candidacyRevisions)
    .innerJoin(candidacies, and(
      eq(candidacies.id, candidacyRevisions.candidacyId),
      eq(candidacies.electoralListId, candidacyRevisions.electoralListId),
    ))
    .innerJoin(electoralLists, and(
      eq(electoralLists.id, candidacies.electoralListId),
      eq(electoralLists.reviewState, 'approved'),
    ))
    .where(and(eq(candidacies.personId, id), eq(candidacyRevisions.reviewState, 'approved')))
    .orderBy(asc(candidacyRevisions.effectiveFrom), asc(candidacyRevisions.id));

  // Approved Candidacies are already proven above; reuse them as the lookup
  // for approved Candidacy-linked status items instead of re-joining.
  const approvedCandidacyListNames = new Map(candidacyRows.map((row) => [row.candidacyId, row.listName]));

  const statusRows = await db
    .select({
      id: politicalStatuses.id,
      summary: politicalStatuses.summary,
      verifiedAt: politicalStatuses.verifiedAt,
      supersededAt: politicalStatuses.supersededAt,
    })
    .from(politicalStatuses)
    .where(and(eq(politicalStatuses.personId, id), eq(politicalStatuses.reviewState, 'approved')));

  const itemRows = statusRows.length
    ? await db
      .select({
        id: politicalStatusItems.id,
        politicalStatusId: politicalStatusItems.politicalStatusId,
        partyAffiliationId: politicalStatusItems.partyAffiliationId,
        partyAffiliationReviewState: partyAffiliations.reviewState,
        partyName: politicalActors.currentDisplayName,
        officeTenureId: politicalStatusItems.officeTenureId,
        officeTenureReviewState: officeTenures.reviewState,
        officeTitle: officeTenures.officeTitle,
        candidacyId: politicalStatusItems.candidacyId,
      })
      .from(politicalStatusItems)
      .leftJoin(partyAffiliations, eq(partyAffiliations.id, politicalStatusItems.partyAffiliationId))
      .leftJoin(politicalParties, eq(politicalParties.id, partyAffiliations.politicalPartyId))
      .leftJoin(politicalActors, eq(politicalActors.id, politicalParties.id))
      .leftJoin(officeTenures, eq(officeTenures.id, politicalStatusItems.officeTenureId))
      .where(and(
        eq(politicalStatusItems.reviewState, 'approved'),
        inArray(politicalStatusItems.politicalStatusId, statusRows.map((row) => row.id)),
      ))
    : [];

  function labelFor(item: (typeof itemRows)[number]) {
    if (item.partyAffiliationId !== null && item.partyAffiliationReviewState === 'approved') {
      return `Party Affiliation: ${item.partyName}`;
    }
    if (item.officeTenureId !== null && item.officeTenureReviewState === 'approved') {
      return `Office Tenure: ${item.officeTitle}`;
    }
    if (item.candidacyId !== null) {
      const listName = approvedCandidacyListNames.get(item.candidacyId);
      if (listName) return `Candidacy: ${listName}`;
    }
    return null;
  }

  const itemsByStatus = new Map<number, { id: number; label: string }[]>();
  for (const item of itemRows) {
    const label = labelFor(item);
    if (label === null) continue;
    const existing = itemsByStatus.get(item.politicalStatusId) ?? [];
    existing.push({ id: item.id, label });
    itemsByStatus.set(item.politicalStatusId, existing);
  }

  function toStatus(row: (typeof statusRows)[number]) {
    return {
      id: row.id,
      summary: row.summary,
      verifiedAt: row.verifiedAt,
      items: itemsByStatus.get(row.id) ?? [],
    };
  }

  const currentStatusRow = statusRows.find((row) => row.supersededAt === null) ?? null;
  const earlierStatuses = statusRows
    .filter((row) => row.supersededAt !== null)
    .sort((left, right) => right.verifiedAt.getTime() - left.verifiedAt.getTime())
    .map(toStatus);

  return {
    id: identity.id,
    name: identity.name,
    names,
    partyAffiliations: partyAffiliationRows,
    officeTenures: officeTenureRows,
    candidacies: candidacyRows,
    currentStatus: currentStatusRow ? toStatus(currentStatusRow) : null,
    earlierStatuses,
  };
}
