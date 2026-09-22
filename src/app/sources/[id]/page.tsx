import { notFound } from 'next/navigation';
import { getPublicSourceRecord } from '@/source-record';

export const dynamic = 'force-dynamic';

const INT4_MAX = 2147483647;
const date = (value: Date | null) => value?.toISOString().slice(0, 10) ?? 'Not known';
const label = (value: string) => value[0].toUpperCase() + value.slice(1);

export default async function SourceRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || Number(id) > INT4_MAX) notFound();
  const source = await getPublicSourceRecord(Number(id));
  if (!source) notFound();

  const corrections = source.versions.filter(({ changeType }) => changeType === 'correction');

  return (
    <main>
      <h1>{source.title}</h1>
      {source.availability === 'unavailable' && (
        <p role="alert">The external source is unavailable. This page retains provenance and only material approved for legal retention.</p>
      )}

      <section aria-labelledby="provenance-heading">
        <h2 id="provenance-heading">Source provenance</h2>
        <dl>
          <dt>Source type</dt><dd>{source.sourceType}</dd>
          <dt>Author</dt><dd>{source.author ?? 'Not known'}</dd>
          <dt>Publisher</dt><dd>{source.publisher ?? 'Not known'}</dd>
          <dt>Publication date</dt><dd>{date(source.publicationDate)}</dd>
          <dt>Availability</dt><dd>{label(source.availability)}</dd>
        </dl>
      </section>

      <section aria-labelledby="versions-heading">
        <h2 id="versions-heading">Source Versions</h2>
        {source.versions.length ? <ol>{source.versions.map((version) => (
          <li key={version.id} id={`version-${version.id}`}>
            <h3>Version {version.id}: {label(version.changeType)}</h3>
            {version.previousVersionId !== null && <p>Changes version {version.previousVersionId}: {version.changeSummary}</p>}
            <p>Observed publication or update: {date(version.observedPublishedAt)}</p>
            <p>Retrieved: {date(version.retrievedAt)}</p>
            <p>Checksum: {version.checksum ?? 'Not known'}</p>
            {version.locations.length ? <ul>{version.locations.map((location) => (
              <li key={location.id}>{label(location.locationType)}: <a href={location.url}>{location.url}</a></li>
            ))}</ul> : <p>No reviewed source location is available.</p>}
          </li>
        ))}</ol> : <p>No reviewed Source Versions are available.</p>}
      </section>

      <section aria-labelledby="reuse-heading">
        <h2 id="reuse-heading">Reused material</h2>
        {source.reuse.length ? <ul>{source.reuse.map((item) => (
          <li key={item.id}>
            <p>{item.materialType} from version {item.sourceVersionId}</p>
            <blockquote>{item.retainedMaterial}</blockquote>
            <p>Reuse basis: {item.reuseBasis}</p>
            <p>Required attribution: {item.requiredAttribution}</p>
          </li>
        ))}</ul> : <p>No reviewed reused material is retained.</p>}
      </section>

      <section aria-labelledby="corrections-heading">
        <h2 id="corrections-heading">Corrections</h2>
        {corrections.length ? <ul>{corrections.map((version) => (
          <li key={version.id}>Version {version.id}: {version.changeSummary}</li>
        ))}</ul> : <p>No reviewed corrections are recorded.</p>}
      </section>
    </main>
  );
}
