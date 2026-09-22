import { notFound } from 'next/navigation';
import { formatDatePrecision } from '@/date-precision';
import { getPublicClaim } from '@/public-claim';

export const dynamic = 'force-dynamic';

const INT4_MAX = 2147483647;
const date = (value: Date | null) => value?.toISOString().slice(0, 10) ?? 'Not known';
const label = (value: string) => value[0].toUpperCase() + value.slice(1).replace('_', ' ');

function actorHref(actor: { id: number; type: string; slug: string }) {
  if (actor.type === 'person') return `/people/${actor.id}`;
  if (actor.type === 'electoral_list') return `/electoral-lists/${actor.slug}`;
  return null;
}

export default async function PublicClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || Number(id) > INT4_MAX) notFound();
  const claim = await getPublicClaim(Number(id));
  if (!claim) notFound();

  const statementDate = claim.statementTo
    ? `${formatDatePrecision(claim.statementFrom, claim.statementFromPrecision)} to ${formatDatePrecision(claim.statementTo, claim.statementToPrecision)}`
    : formatDatePrecision(claim.statementFrom, claim.statementFromPrecision);
  const actorList = (actors: typeof claim.speakers) => actors.length
    ? <ul>{actors.map((actor) => {
      const href = actorHref(actor);
      return <li key={actor.id}>{href ? <a href={href}>{actor.name}</a> : actor.name}</li>;
    })}</ul>
    : <p>None recorded.</p>;

  return (
    <main>
      <h1>Public Claim {claim.id}</h1>
      <p>{claim.summary}</p>

      <section aria-labelledby="dates-heading">
        <h2 id="dates-heading">Claim dates</h2>
        <dl>
          <dt>Statement date</dt><dd>{statementDate}</dd>
          <dt>Claim reviewed</dt><dd>{date(claim.reviewedAt)}</dd>
        </dl>
      </section>

      <section aria-labelledby="speakers-heading">
        <h2 id="speakers-heading">Speakers</h2>
        {actorList(claim.speakers)}
      </section>

      <section aria-labelledby="subjects-heading">
        <h2 id="subjects-heading">Subjects</h2>
        {actorList(claim.subjects)}
      </section>

      <section aria-labelledby="evidence-heading">
        <h2 id="evidence-heading">Evidence Citations</h2>
        <ol>{claim.citations.map((citation) => (
          <li key={citation.id}>
            <h3>{label(citation.locatorType)}: {citation.locator}</h3>
            {citation.precisionExplanation && <p>Best available locator: {citation.precisionExplanation}</p>}
            <p><a href={`/sources/${citation.sourceRecordId}#version-${citation.sourceVersionId}`}>{citation.sourceTitle}, Source Version {citation.sourceVersionId}</a></p>
            <dl>
              <dt>Source publication</dt><dd>{date(citation.sourcePublicationDate)}</dd>
              <dt>Observed publication or update</dt><dd>{date(citation.observedPublishedAt)}</dd>
              <dt>Retrieved</dt><dd>{date(citation.retrievedAt)}</dd>
            </dl>
            {citation.quotations.map((quotation) => (
              <div key={quotation.id}>
                <figure>
                  <figcaption>Original quotation ({quotation.sourceLanguage})</figcaption>
                  <blockquote lang={quotation.sourceLanguage} dir={quotation.textDirection}>{quotation.text}</blockquote>
                </figure>
                {quotation.translations.map((translation) => (
                  <figure key={translation.id}>
                    <figcaption>Reviewed translation ({translation.language}{translation.machineAssisted ? ', machine-assisted' : ''})</figcaption>
                    <blockquote lang={translation.language} dir={translation.textDirection}>{translation.text}</blockquote>
                  </figure>
                ))}
              </div>
            ))}
          </li>
        ))}</ol>
      </section>
    </main>
  );
}
