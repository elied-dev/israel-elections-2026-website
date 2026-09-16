import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { authoritativeSources, electionEditions, electoralLists } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();
  const edition = (await db.select().from(electionEditions).limit(1))[0];
  const lists = edition
    ? await db
        .select({
          id: electoralLists.id,
          name: electoralLists.name,
          ballotIdentifier: electoralLists.ballotIdentifier,
          reviewState: electoralLists.reviewState,
          sourceTitle: authoritativeSources.title,
          sourceUrl: authoritativeSources.url,
          retrievedAt: authoritativeSources.retrievedAt,
        })
        .from(electoralLists)
        .leftJoin(authoritativeSources, eq(electoralLists.sourceId, authoritativeSources.id))
        .where(eq(electoralLists.editionId, edition.id))
    : [];

  return (
    <main>
      <h1>{edition?.name ?? '2026 Knesset election'}</h1>
      <p>Neutral election information with inspectable sources.</p>
      <section aria-labelledby="methodology-heading">
        <h2 id="methodology-heading">Methodology and non-affiliation</h2>
        <p>This directory presents reviewed official election facts. It does not rank, endorse, or recommend any Electoral List. This is an independent information service, not an official CEC service or political campaign.</p>
      </section>
      <section aria-labelledby="lists-heading">
        <h2 id="lists-heading">Electoral Lists</h2>
        {lists.length === 0 ? (
          <p role="status">No reviewed Electoral Lists are available yet.</p>
        ) : (
          <ul>
            {lists.map((list) => (
              <li key={list.id}>
                <h3>{list.name}</h3>
                <p>Ballot identifier: {list.ballotIdentifier ?? 'Not yet available'}</p>
                <p>Review state: {list.reviewState}</p>
                <p>
                  Source: {list.sourceUrl ? <a href={list.sourceUrl}>{list.sourceTitle}</a> : 'Not yet available'}
                  {list.retrievedAt ? ` · Retrieved ${list.retrievedAt.toISOString().slice(0, 10)}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
