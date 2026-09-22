import { getPolicyPositionComparison } from '@/policy-position-comparison';

export const dynamic = 'force-dynamic';

const date = (value: Date | null) => value?.toISOString().slice(0, 10) ?? 'Not known';
const label = (value: string) => value[0].toUpperCase() + value.slice(1).replace('_', ' ');

export default async function PolicyPositionComparisonPage() {
  const comparison = await getPolicyPositionComparison();

  return (
    <main>
      <h1>{comparison.edition?.name ?? 'Election'} Policy Position comparison</h1>
      <p>This comparison presents reviewed Policy Positions without ranking, endorsing, or inferring a position.</p>
      {comparison.topics.length ? comparison.topics.map((topic) => (
        <section key={topic.topic} aria-labelledby={`topic-${topic.topic}`}>
          <h2 id={`topic-${topic.topic}`}>{topic.topic}</h2>
          <table>
            <caption>Reviewed Policy Positions by Electoral List</caption>
            <thead><tr><th scope="col">Electoral List</th><th scope="col">Policy Position and evidence</th></tr></thead>
            <tbody>{topic.lists.map((list) => (
              <tr key={list.id}>
                <th scope="row"><a href={`/electoral-lists/${list.slug}`}>{list.name}</a></th>
                <td>{list.positions.length ? <ol>{list.positions.map((position) => (
                  <li key={position.id}>
                    <p>{position.summary}</p>
                    <details>
                      <summary>Evidence preview</summary>
                      <p>Review state: approved.</p>
                      <ol>{position.citations.map((citation) => (
                        <li key={citation.id}>
                          <p>{label(citation.locatorType)}: {citation.locator}</p>
                          {citation.precisionExplanation && <p>Best available locator: {citation.precisionExplanation}</p>}
                          <dl>
                            <dt>Provenance</dt>
                            <dd><a href={`/sources/${citation.sourceRecordId}#version-${citation.sourceVersionId}`}>{citation.sourceTitle}, Source Version {citation.sourceVersionId}</a></dd>
                            <dt>Source publication</dt><dd>{date(citation.sourcePublicationDate)}</dd>
                            <dt>Observed publication or update</dt><dd>{date(citation.observedPublishedAt)}</dd>
                            <dt>Retrieved</dt><dd>{date(citation.retrievedAt)}</dd>
                            <dt>Evidence review state</dt><dd>Approved</dd>
                          </dl>
                          {citation.quotations.length ? citation.quotations.map((quotation) => (
                            <figure key={quotation.id}>
                              <figcaption>Original quotation ({quotation.sourceLanguage})</figcaption>
                              <blockquote lang={quotation.sourceLanguage} dir={quotation.textDirection}>{quotation.text}</blockquote>
                              {quotation.translations.length ? quotation.translations.map((translation) => (
                                <div key={translation.id}>
                                  <p>Reviewed translation ({translation.language}{translation.machineAssisted ? ', machine-assisted' : ''})</p>
                                  <blockquote lang={translation.language} dir={translation.textDirection}>{translation.text}</blockquote>
                                </div>
                              )) : <p>Translation state: unavailable.</p>}
                            </figure>
                          )) : <p>No reviewed quotation is available.</p>}
                        </li>
                      ))}</ol>
                    </details>
                  </li>
                ))}</ol> : <p>Unavailable: no reviewed Policy Position is available.</p>}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      )) : <p>No reviewed Policy Positions are available yet.</p>}
    </main>
  );
}
