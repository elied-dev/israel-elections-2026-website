import { notFound } from 'next/navigation';
import { getPublicPersonIdentity } from '@/person-identity';

export const dynamic = 'force-dynamic';

// PostgreSQL's integer columns are int4; values above this cannot match any row.
const INT4_MAX = 2147483647;

export default async function PersonIdentityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || Number(id) > INT4_MAX) notFound();
  const person = await getPublicPersonIdentity(Number(id));
  if (!person) notFound();

  return (
    <main>
      <h1>{person.name}</h1>
      <p>Detailed profile information is not yet available.</p>
    </main>
  );
}
