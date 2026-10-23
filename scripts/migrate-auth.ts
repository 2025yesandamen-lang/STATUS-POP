import 'dotenv/config';
import { getMigrations } from 'better-auth/db/migration';
import { auth } from '../src/lib/auth.ts';
import { databasePool } from '../src/lib/database.ts';

if (!auth || !databasePool) {
  throw new Error('Set DATABASE_URL and a 32-character BETTER_AUTH_SECRET before migrating.');
}

try {
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  console.log(
    `Better Auth database schema is up to date. Created ${toBeCreated.length} table(s); updated ${toBeAdded.length} table(s).`
  );
} finally {
  await databasePool.end();
}
