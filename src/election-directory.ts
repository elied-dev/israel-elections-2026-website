import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { authoritativeSources, electionEditions, electoralLists, politicalActors } from '@/db/schema';

export async function getElectionDirectory() {
  const db = getDb();
  const edition = (
    await db.select().from(electionEditions).orderBy(asc(electionEditions.id)).limit(1)
  )[0];

  if (!edition) return { edition, lists: [] };

  const lists = await db
    .select({
      id: electoralLists.id,
      name: electoralLists.name,
      ballotIdentifier: electoralLists.ballotIdentifier,
      reviewState: electoralLists.reviewState,
      currentSlug: politicalActors.currentSlug,
      sourceTitle: authoritativeSources.title,
      sourceUrl: authoritativeSources.url,
      retrievedAt: authoritativeSources.retrievedAt,
    })
    .from(electoralLists)
    .innerJoin(politicalActors, eq(politicalActors.id, electoralLists.id))
    .leftJoin(authoritativeSources, eq(electoralLists.sourceId, authoritativeSources.id))
    .where(
      and(
        eq(electoralLists.editionId, edition.id),
        eq(electoralLists.reviewState, 'approved'),
      ),
    )
    .orderBy(asc(electoralLists.id));

  return { edition, lists };
}
