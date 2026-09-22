import { getElectionDirectory } from '@/election-directory';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { edition, lists } = await getElectionDirectory();

  return (
    <main>
      <h1>{edition?.name ?? '2026 Knesset election'}</h1>
      <p>Neutral election information with inspectable sources.</p>
      <p><a href="/policy-positions">Compare Policy Positions</a></p>
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
                <h3><a href={`/electoral-lists/${list.currentSlug}`}>{list.name}</a></h3>
                <p>Ballot identifier: {list.ballotIdentifier ?? 'Not yet available'}</p>
                <p>Review state: {list.reviewState}</p>
                <p>
                  Source:{' '}
                  {list.sourceUrl ? <a href={list.sourceUrl}>{list.sourceTitle}</a> : 'Not yet available'}
                </p>
                <p>Retrieved: {list.retrievedAt?.toISOString().slice(0, 10) ?? 'Not yet available'}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
