import { notFound, redirect } from 'next/navigation';
import { getElectoralListProfile } from '@/electoral-list-profile';

export default async function ElectoralListPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const profile = await getElectoralListProfile(reference);
  if (!profile) notFound();
  if (reference !== profile.canonicalSlug) redirect(`/electoral-lists/${profile.canonicalSlug}`);
  const date = (value: Date) => value.toISOString().slice(0, 10);
  const label = (value: string) => value[0].toUpperCase() + value.slice(1);

  return (
    <main>
      <h1>{profile.list.name}</h1>
      <p>Ballot identifier: {profile.list.ballotIdentifier ?? 'Not yet available'}</p>
      <p>Election Edition: {profile.edition.name}</p>

      <section aria-labelledby="parties-heading">
        <h2 id="parties-heading">Represented Political Parties</h2>
        {profile.parties.length ? (
          <ul>{profile.parties.map((party) => <li key={party.id}>{party.name}</li>)}</ul>
        ) : <p>No reviewed represented Political Parties are available yet.</p>}
      </section>

      <section aria-labelledby="candidates-heading">
        <h2 id="candidates-heading">Current official Candidate order</h2>
        {profile.currentCandidates.length ? (
          <ol>{profile.currentCandidates.map((candidate) => (
            <li key={candidate.personId}>
              <a href={`/people/${candidate.personId}`}>{candidate.personName}</a>
              {' — '}Position {candidate.position}; {label(candidate.status)} from {date(candidate.effectiveFrom)}
            </li>
          ))}</ol>
        ) : <p>No reviewed current Candidates are available yet.</p>}
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Candidacy history</h2>
        {profile.history.length ? profile.history.map((candidate) => (
          <section key={candidate.personId} aria-labelledby={`person-${candidate.personId}-history`}>
            <h3 id={`person-${candidate.personId}-history`}>{candidate.personName}</h3>
            <ul>{candidate.revisions.map((revision) => (
              <li key={revision.id}>
                Position {revision.position}; {label(revision.status)} from {date(revision.effectiveFrom)} to {revision.effectiveTo ? date(revision.effectiveTo) : 'Current'}
              </li>
            ))}</ul>
          </section>
        )) : <p>No reviewed Candidacy history is available yet.</p>}
      </section>

      <section aria-labelledby="methodology-heading">
        <h2 id="methodology-heading">Methodology and non-affiliation</h2>
        <p>This profile presents reviewed official election facts. It does not rank, endorse, or recommend any Electoral List or Candidate. This is an independent information service, not an official CEC service or political campaign.</p>
      </section>
    </main>
  );
}
