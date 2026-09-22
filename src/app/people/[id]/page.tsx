import { notFound } from 'next/navigation';
import { getPublicPersonIdentity } from '@/person-identity';

export default async function PersonIdentityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const person = await getPublicPersonIdentity(Number(id));
  if (!person) notFound();

  return (
    <main>
      <h1>{person.name}</h1>
      <p>Detailed profile information is not yet available.</p>
    </main>
  );
}
