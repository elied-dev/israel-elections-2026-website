import { notFound } from 'next/navigation';
import { formatDatePrecision } from '@/date-precision';
import { getPublicPersonProfile } from '@/person-profile';

export const dynamic = 'force-dynamic';

// PostgreSQL's integer columns are int4; values above this cannot match any row.
const INT4_MAX = 2147483647;

function dateRange(
  validFrom: Date | null,
  validFromPrecision: 'day' | 'month' | 'year' | 'unknown',
  validTo: Date | null,
  validToPrecision: 'day' | 'month' | 'year' | 'unknown',
) {
  return `from ${formatDatePrecision(validFrom, validFromPrecision)} to ${formatDatePrecision(validTo, validToPrecision)}`;
}

export default async function PersonIdentityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || Number(id) > INT4_MAX) notFound();
  const person = await getPublicPersonProfile(Number(id));
  if (!person) notFound();

  return (
    <main>
      <h1>{person.name}</h1>

      <section aria-labelledby="status-heading">
        <h2 id="status-heading">Current Political Status</h2>
        {person.currentStatus ? (
          <>
            <p>{person.currentStatus.summary}</p>
            <p>Last verified: {formatDatePrecision(person.currentStatus.verifiedAt, 'day')}</p>
            <ul>{person.currentStatus.items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
          </>
        ) : <p>No reviewed Current Political Status is available yet.</p>}
      </section>

      <section aria-labelledby="names-heading">
        <h2 id="names-heading">Names and aliases</h2>
        {person.names.length ? (
          <ul>{person.names.map((name) => (
            <li key={name.id}>
              {name.name} ({name.nameType}) — {dateRange(name.validFrom, name.validFromPrecision, name.validTo, name.validToPrecision)}
            </li>
          ))}</ul>
        ) : <p>No reviewed names or aliases are available yet.</p>}
      </section>

      <section aria-labelledby="affiliations-heading">
        <h2 id="affiliations-heading">Party Affiliation history</h2>
        {person.partyAffiliations.length ? (
          <ul>{person.partyAffiliations.map((affiliation) => (
            <li key={affiliation.id}>
              {affiliation.partyName} — {dateRange(affiliation.validFrom, affiliation.validFromPrecision, affiliation.validTo, affiliation.validToPrecision)}
            </li>
          ))}</ul>
        ) : <p>No reviewed Party Affiliation history is available yet.</p>}
      </section>

      <section aria-labelledby="offices-heading">
        <h2 id="offices-heading">Office Tenure history</h2>
        {person.officeTenures.length ? (
          <ul>{person.officeTenures.map((tenure) => (
            <li key={tenure.id}>
              {tenure.officeTitle} — {dateRange(tenure.validFrom, tenure.validFromPrecision, tenure.validTo, tenure.validToPrecision)}
            </li>
          ))}</ul>
        ) : <p>No reviewed Office Tenure history is available yet.</p>}
      </section>

      <section aria-labelledby="candidacies-heading">
        <h2 id="candidacies-heading">Candidacy history</h2>
        {person.candidacies.length ? (
          <ul>{person.candidacies.map((candidacy) => (
            <li key={candidacy.id}>
              {candidacy.listName} — Position {candidacy.position}; {candidacy.status} from {candidacy.effectiveFrom.toISOString().slice(0, 10)} to {candidacy.effectiveTo ? candidacy.effectiveTo.toISOString().slice(0, 10) : 'Current'}
            </li>
          ))}</ul>
        ) : <p>No reviewed Candidacy history is available yet.</p>}
      </section>

      <section aria-labelledby="earlier-status-heading">
        <h2 id="earlier-status-heading">Earlier Political Statuses</h2>
        {person.earlierStatuses.length ? (
          <ul>{person.earlierStatuses.map((status) => (
            <li key={status.id}>
              {status.summary} — Last verified: {formatDatePrecision(status.verifiedAt, 'day')}
              <ul>{status.items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
            </li>
          ))}</ul>
        ) : <p>No reviewed earlier Political Statuses are available yet.</p>}
      </section>
    </main>
  );
}
