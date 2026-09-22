import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  candidacies,
  candidacyRevisions,
  electionEditions,
  electoralListParties,
  electoralLists,
  persons,
  politicalActors,
  politicalActorSlugs,
  politicalParties,
} from '@/db/schema';

// PostgreSQL's integer columns are int4; values above this cannot match any row.
const INT4_MAX = 2147483647;

export async function getElectoralListProfile(reference: string) {
  const db = getDb();
  const isNumeric = /^\d+$/.test(reference);
  if (isNumeric && Number(reference) > INT4_MAX) return null;

  const listActor = isNumeric
    ? (
      await db
        .select({
          listId: electoralLists.id,
          name: electoralLists.name,
          ballotIdentifier: electoralLists.ballotIdentifier,
          canonicalSlug: politicalActors.currentSlug,
          editionId: electionEditions.id,
          editionName: electionEditions.name,
        })
        .from(electoralLists)
        .innerJoin(politicalActors, eq(politicalActors.id, electoralLists.id))
        .innerJoin(electionEditions, eq(electionEditions.id, electoralLists.editionId))
        .where(and(eq(electoralLists.id, Number(reference)), eq(electoralLists.reviewState, 'approved')))
    )[0]
    : (
      await db
        .select({
          listId: electoralLists.id,
          name: electoralLists.name,
          ballotIdentifier: electoralLists.ballotIdentifier,
          canonicalSlug: politicalActors.currentSlug,
          editionId: electionEditions.id,
          editionName: electionEditions.name,
        })
        .from(politicalActorSlugs)
        .innerJoin(politicalActors, eq(politicalActors.id, politicalActorSlugs.actorId))
        .innerJoin(electoralLists, eq(electoralLists.id, politicalActors.id))
        .innerJoin(electionEditions, eq(electionEditions.id, electoralLists.editionId))
        .where(and(eq(politicalActorSlugs.slug, reference), eq(electoralLists.reviewState, 'approved')))
    )[0];

  if (!listActor) return null;

  const parties = await db
    .select({ id: politicalParties.id, name: politicalActors.currentDisplayName })
    .from(electoralListParties)
    .innerJoin(politicalParties, eq(politicalParties.id, electoralListParties.politicalPartyId))
    .innerJoin(politicalActors, eq(politicalActors.id, politicalParties.id))
    .where(and(
      eq(electoralListParties.electoralListId, listActor.listId),
      eq(electoralListParties.reviewState, 'approved'),
    ))
    .orderBy(asc(politicalActors.currentDisplayName));

  const revisions = await db
    .select({
      id: candidacyRevisions.id,
      personId: persons.id,
      personName: politicalActors.currentDisplayName,
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
    .innerJoin(persons, eq(persons.id, candidacies.personId))
    .innerJoin(politicalActors, eq(politicalActors.id, persons.id))
    .where(and(
      eq(candidacyRevisions.electoralListId, listActor.listId),
      eq(candidacyRevisions.reviewState, 'approved'),
    ))
    .orderBy(asc(politicalActors.currentDisplayName), asc(candidacyRevisions.effectiveFrom));

  const currentCandidates = revisions
    .filter((revision) => revision.status === 'active' && revision.effectiveTo === null)
    .sort((left, right) => left.position - right.position);

  const historicalRevisions = revisions.filter(
    (revision) => revision.status !== 'active' || revision.effectiveTo !== null,
  );
  const groupedHistory = new Map<number, {
    personId: number;
    personName: string;
    revisions: typeof historicalRevisions;
  }>();
  for (const revision of historicalRevisions) {
    const group = groupedHistory.get(revision.personId) ?? {
      personId: revision.personId,
      personName: revision.personName,
      revisions: [],
    };
    group.revisions.push(revision);
    groupedHistory.set(revision.personId, group);
  }
  const history = [...groupedHistory.values()];

  return {
    canonicalSlug: listActor.canonicalSlug,
    list: {
      id: listActor.listId,
      name: listActor.name,
      ballotIdentifier: listActor.ballotIdentifier,
    },
    edition: {
      id: listActor.editionId,
      name: listActor.editionName,
    },
    parties,
    currentCandidates,
    history,
  };
}
