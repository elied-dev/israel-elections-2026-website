import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  electionEditions,
  electoralLists,
  policyPositions,
  politicalActors,
  publicClaims,
  publicClaimSpeakers,
} from '@/db/schema';
import { getPublicClaim } from '@/public-claim';

type PublicClaim = NonNullable<Awaited<ReturnType<typeof getPublicClaim>>>;

export async function getPolicyPositionComparison() {
  const db = getDb();
  const edition = (await db.select().from(electionEditions).orderBy(asc(electionEditions.id)).limit(1))[0];
  if (!edition) return { edition: null, topics: [] };

  const lists = await db
    .select({
      id: electoralLists.id,
      name: electoralLists.name,
      slug: politicalActors.currentSlug,
    })
    .from(electoralLists)
    .innerJoin(politicalActors, eq(politicalActors.id, electoralLists.id))
    .where(and(eq(electoralLists.editionId, edition.id), eq(electoralLists.reviewState, 'approved')))
    .orderBy(asc(electoralLists.name), asc(electoralLists.id));

  const linkedPositions = await db
    .select({ topic: policyPositions.topic, claimId: policyPositions.publicClaimId, listId: electoralLists.id })
    .from(policyPositions)
    .innerJoin(publicClaims, eq(publicClaims.id, policyPositions.publicClaimId))
    .innerJoin(publicClaimSpeakers, eq(publicClaimSpeakers.publicClaimId, publicClaims.id))
    .innerJoin(electoralLists, eq(electoralLists.id, publicClaimSpeakers.politicalActorId))
    .where(and(
      eq(electoralLists.editionId, edition.id),
      eq(electoralLists.reviewState, 'approved'),
      eq(publicClaims.reviewState, 'approved'),
    ))
    .orderBy(asc(policyPositions.topic), asc(policyPositions.publicClaimId));

  const claims = new Map<number, Promise<PublicClaim | null>>();
  const claimFor = (id: number) => {
    const existing = claims.get(id);
    if (existing) return existing;
    const claim = getPublicClaim(id);
    claims.set(id, claim);
    return claim;
  };
  const reviewedPositions = (await Promise.all(linkedPositions.map(async (position) => ({
    ...position,
    claim: await claimFor(position.claimId),
  })))).filter((position): position is typeof position & { claim: PublicClaim } => position.claim !== null);

  const topics = new Map<string, Map<number, PublicClaim[]>>();
  for (const position of reviewedPositions) {
    const listsByTopic = topics.get(position.topic) ?? new Map<number, PublicClaim[]>();
    const positions = listsByTopic.get(position.listId) ?? [];
    positions.push(position.claim);
    listsByTopic.set(position.listId, positions);
    topics.set(position.topic, listsByTopic);
  }

  return {
    edition,
    topics: [...topics.entries()].map(([topic, positions]) => ({
      topic,
      lists: lists.map((list) => ({
        ...list,
        positions: positions.get(list.id) ?? [],
      })),
    })),
  };
}
