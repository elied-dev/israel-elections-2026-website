import { searchPublicRecord, type PublicRecordFilters } from '@/public-record-search';

export const dynamic = 'force-dynamic';

const resultLabels = {
  actor: 'Political Actor',
  claim: 'Public Claim',
  tag: 'Tag',
  source: 'Source Record',
};

const actorLabels: Record<string, string> = {
  person: 'Person',
  political_party: 'Political Party',
  electoral_list: 'Electoral List',
};

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function PublicRecordPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const data = await searchPublicRecord({
    q: first(raw.q),
    actorType: first(raw.actorType),
    tag: first(raw.tag),
    dateFrom: first(raw.dateFrom),
    dateTo: first(raw.dateTo),
    language: first(raw.language),
  });

  return (
    <main>
      <h1>Public Record</h1>
      <p>Browse reviewed Political Actors, Public Claims, Tags, and source metadata. Search order uses only text matching.</p>

      <form action="/public-record" method="get" role="search">
        <p>
          <label htmlFor="public-record-query">Search</label>{' '}
          <input id="public-record-query" name="q" type="search" defaultValue={data.filters.q} maxLength={200} />
        </p>
        <p>
          <label htmlFor="actor-type">Political Actor type</label>{' '}
          <select id="actor-type" name="actorType" defaultValue={data.filters.actorType}>
            <option value="">All types</option>
            <option value="person">Person</option>
            <option value="political_party">Political Party</option>
            <option value="electoral_list">Electoral List</option>
          </select>
        </p>
        <p>
          <label htmlFor="tag">Tag</label>{' '}
          <select id="tag" name="tag" defaultValue={data.filters.tag}>
            <option value="">All Tags</option>
            {data.tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </select>
        </p>
        <p>
          <label htmlFor="date-from">From date</label>{' '}
          <input id="date-from" name="dateFrom" type="date" defaultValue={data.filters.dateFrom} />{' '}
          <label htmlFor="date-to">To date</label>{' '}
          <input id="date-to" name="dateTo" type="date" defaultValue={data.filters.dateTo} />
        </p>
        <p>
          <label htmlFor="language">Language</label>{' '}
          <select id="language" name="language" defaultValue={data.filters.language}>
            <option value="">All languages</option>
            {data.languages.map((language) => <option key={language} value={language}>{language}</option>)}
          </select>
        </p>
        <button type="submit">Search Public Record</button>
      </form>

      <section aria-labelledby="results-heading">
        <h2 id="results-heading">Results</h2>
        {data.results.length ? (
          <ol>{data.results.map((result) => (
            <li key={`${result.kind}-${result.id}`}>
              <article>
                <p>{resultLabels[result.kind]}</p>
                <h3>{result.href ? <a href={result.href}>{result.title}</a> : result.title}</h3>
                <p>
                  {result.actorType ? actorLabels[result.actorType] : result.language && `Language: ${result.language}`}
                  {result.resultDate && ` · Date: ${result.resultDate.toISOString().slice(0, 10)}`}
                </p>
                {result.tagNames && <p>Tags: {result.tagNames}</p>}
              </article>
            </li>
          ))}</ol>
        ) : <p role="status">No reviewed Public Record results match these terms and filters.</p>}
      </section>
    </main>
  );
}
