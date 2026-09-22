import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { candidacies, candidacyRevisions, electoralLists, persons, politicalActors } from '@/db/schema';

export async function getPublicPersonIdentity(id: number): Promise<{ id: number; name: string } | null> {
  const db = getDb();

  const row = (
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

  return row ?? null;
}
