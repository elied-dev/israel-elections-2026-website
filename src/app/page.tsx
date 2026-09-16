import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { applicationReadiness } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();
  const [{ ready }] = await db.select({ ready: sql<number>`1` }).from(applicationReadiness).limit(1);

  return (
    <main>
      <h1>Israeli Elections 2026</h1>
      <p>Election information with inspectable sources.</p>
      <p data-testid="database-status">Database: {ready === 1 ? 'connected' : 'unavailable'}</p>
    </main>
  );
}
