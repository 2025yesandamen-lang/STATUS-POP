import type { PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import { databasePool } from './database.ts';

export type PaidPlan = 'day_pass' | 'pro';

export const PAID_PLANS: Record<PaidPlan, { amountKobo: number; durationMs: number }> = {
  day_pass: { amountKobo: 50000, durationMs: 24 * 60 * 60 * 1000 },
  pro: { amountKobo: 250000, durationMs: 30 * 24 * 60 * 60 * 1000 },
};

const pool = databasePool;

let schemaPromise: Promise<void> | null = null;

export function isPaymentStorageConfigured(): boolean {
  return Boolean(pool);
}

export async function ensurePaymentSchema(): Promise<void> {
  if (!pool) throw new Error('DATABASE_URL is not configured.');
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        reference TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        plan TEXT NOT NULL CHECK (plan IN ('day_pass', 'pro')),
        amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
        currency TEXT NOT NULL DEFAULT 'NGN',
        status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
        authorization_url TEXT,
        customer_email TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        paid_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS payment_transactions_vendor_created_idx
        ON payment_transactions (vendor_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS vendor_entitlements (
        vendor_id TEXT PRIMARY KEY,
        plan TEXT NOT NULL CHECK (plan IN ('day_pass', 'pro')),
        expires_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS admin_entitlement_grants (
        id BIGSERIAL PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        email TEXT NOT NULL,
        plan TEXT NOT NULL CHECK (plan IN ('day_pass', 'pro')),
        duration_days INTEGER NOT NULL CHECK (duration_days IN (1, 30, 365)),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).then(() => undefined).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function createPendingPayment(input: {
  vendorId: string;
  plan: PaidPlan;
  email: string;
}): Promise<{ reference: string; amountKobo: number }> {
  await ensurePaymentSchema();
  if (!pool) throw new Error('Payment storage is not configured.');
  const reference = `sp_${randomUUID().replace(/-/g, '')}`;
  const amountKobo = PAID_PLANS[input.plan].amountKobo;
  await pool.query(
    `INSERT INTO payment_transactions (reference, vendor_id, plan, amount_kobo, status, customer_email)
     VALUES ($1, $2, $3, $4, 'pending', $5)`,
    [reference, input.vendorId, input.plan, amountKobo, input.email]
  );
  return { reference, amountKobo };
}

export async function saveAuthorizationUrl(reference: string, authorizationUrl: string): Promise<void> {
  if (!pool) throw new Error('Payment storage is not configured.');
  await pool.query(
    `UPDATE payment_transactions SET authorization_url = $2 WHERE reference = $1 AND status = 'pending'`,
    [reference, authorizationUrl]
  );
}

export async function markPaymentFailed(reference: string, vendorId: string): Promise<void> {
  if (!pool) throw new Error('Payment storage is not configured.');
  await pool.query(
    `UPDATE payment_transactions SET status = 'failed'
     WHERE reference = $1 AND vendor_id = $2 AND status = 'pending'`,
    [reference, vendorId]
  );
}

export async function getPendingPayment(reference: string, vendorId: string) {
  if (!pool) throw new Error('Payment storage is not configured.');
  const result = await pool.query(
    `SELECT reference, vendor_id, plan, amount_kobo, currency, status
     FROM payment_transactions WHERE reference = $1 AND vendor_id = $2`,
    [reference, vendorId]
  );
  return result.rows[0] as {
    reference: string;
    vendor_id: string;
    plan: PaidPlan;
    amount_kobo: number;
    currency: string;
    status: 'pending' | 'success' | 'failed';
  } | undefined;
}

async function markPaymentSuccessfulWithClient(
  client: PoolClient,
  input: { reference: string; vendorId: string; plan: PaidPlan; amountKobo: number; currency: string }
): Promise<boolean> {
  const payment = await client.query(
    `SELECT vendor_id, plan, amount_kobo, currency, status FROM payment_transactions
     WHERE reference = $1 FOR UPDATE`,
    [input.reference]
  );
  const row = payment.rows[0];
  if (!row || row.vendor_id !== input.vendorId || row.plan !== input.plan ||
      Number(row.amount_kobo) !== input.amountKobo || row.currency !== input.currency) return false;
  if (row.status === 'success') return true;
  if (row.status !== 'pending') return false;

  const updated = await client.query(
    `UPDATE payment_transactions SET status = 'success', paid_at = NOW()
     WHERE reference = $1 AND status = 'pending'`,
    [input.reference]
  );
  if (updated.rowCount !== 1) return false;

  const durationMs = PAID_PLANS[input.plan].durationMs;
  await client.query(
    `INSERT INTO vendor_entitlements (vendor_id, plan, expires_at)
    VALUES ($1, $2, NOW() + ($3::double precision * INTERVAL '1 millisecond'))
     ON CONFLICT (vendor_id) DO UPDATE SET
       plan = EXCLUDED.plan,
      expires_at = GREATEST(vendor_entitlements.expires_at, NOW()) + ($3::double precision * INTERVAL '1 millisecond'),
       updated_at = NOW()`,
    [input.vendorId, input.plan, durationMs]
  );
  return true;
}

export async function markPaymentSuccessful(input: {
  reference: string;
  vendorId: string;
  plan: PaidPlan;
  amountKobo: number;
  currency: string;
}): Promise<boolean> {
  if (!pool) throw new Error('Payment storage is not configured.');
  await ensurePaymentSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const marked = await markPaymentSuccessfulWithClient(client, input);
    if (marked) await client.query('COMMIT');
    else await client.query('ROLLBACK');
    return marked;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getVendorEntitlement(vendorId: string): Promise<{ plan: 'free' | PaidPlan; expiresAt: string | null }> {
  if (!pool) throw new Error('Payment storage is not configured.');
  await ensurePaymentSchema();
  const result = await pool.query(
    `SELECT plan, expires_at FROM vendor_entitlements WHERE vendor_id = $1 AND expires_at > NOW()`,
    [vendorId]
  );
  const row = result.rows[0];
  return row ? { plan: row.plan as PaidPlan, expiresAt: new Date(row.expires_at).toISOString() } : { plan: 'free', expiresAt: null };
}

export async function grantVendorEntitlementByEmail(
  email: string,
  plan: PaidPlan,
  durationDays: 1 | 30 | 365
): Promise<{ expiresAt: string; email: string } | null> {
  if (!pool) throw new Error('Payment storage is not configured.');
  await ensurePaymentSchema();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const accounts = await client.query(
      `SELECT id, email FROM "user" WHERE LOWER(email) = LOWER($1) LIMIT 2`,
      [email]
    );
    if (accounts.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    if (accounts.rows.length > 1) {
      throw new Error('Multiple accounts use this email address.');
    }

    const account = accounts.rows[0] as { id: string; email: string };
    const updated = await client.query(
      `INSERT INTO vendor_entitlements (vendor_id, plan, expires_at)
       VALUES ($1, $2, NOW() + ($3::int * INTERVAL '1 day'))
       ON CONFLICT (vendor_id) DO UPDATE SET
         plan = EXCLUDED.plan,
         expires_at = EXCLUDED.expires_at,
         updated_at = NOW()
       RETURNING expires_at`,
      [account.id, plan, durationDays]
    );
    await client.query(
      `INSERT INTO admin_entitlement_grants (vendor_id, email, plan, duration_days)
       VALUES ($1, $2, $3, $4)`,
      [account.id, account.email, plan, durationDays]
    );
    await client.query('COMMIT');

    return {
      email: account.email,
      expiresAt: new Date(updated.rows[0].expires_at).toISOString(),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function processPaystackWebhookEvent(event: unknown): Promise<boolean> {
  if (!pool || !event || typeof event !== 'object') return false;
  const body = event as { event?: string; data?: { reference?: string; status?: string; amount?: number; currency?: string; metadata?: { vendor_id?: string; plan?: PaidPlan } } };
  if (body.event !== 'charge.success' || !body.data) return true;
  const { reference, status, amount, currency, metadata } = body.data;
  if (!reference) return false;
  const existing = await pool.query('SELECT reference FROM payment_transactions WHERE reference = $1', [reference]);
  if (existing.rowCount === 0) return true;
  if (status !== 'success' || typeof amount !== 'number' || !Number.isInteger(amount) || !currency || !metadata?.vendor_id ||
      !metadata.plan || !Object.hasOwn(PAID_PLANS, metadata.plan)) return false;
  return markPaymentSuccessful({
    reference,
    vendorId: metadata.vendor_id,
    plan: metadata.plan,
    amountKobo: amount,
    currency,
  });
}
