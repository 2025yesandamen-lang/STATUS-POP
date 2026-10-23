import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Resend } from 'resend';
import type { Request } from 'express';
import { databasePool } from './database.ts';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendAccountEmail(input: { to: string; subject: string; html: string; text: string }): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resend || !from) {
    throw new Error('Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.');
  }
  const { error } = await resend.emails.send({ from, ...input });
  if (error) throw error;
}

function createConfiguredAuth(secret: string) {
  const productionAuth = process.env.NODE_ENV === 'production';
  const productionUrl = process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (productionAuth ? 'https://status-pop.vercel.app' : undefined);
  const trustedOrigins = new Set<string>();
  for (const candidate of [
    productionUrl,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    'https://status-pop.vercel.app',
    ...(productionAuth ? [] : ['http://localhost:3000']),
  ]) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`);
      if (url.protocol === 'https:' || url.hostname === 'localhost') trustedOrigins.add(url.origin);
    } catch {
      throw new Error('Better Auth URL configuration contains an invalid origin.');
    }
  }
  return betterAuth({
    database: databasePool!,
    secret,
    baseURL: productionAuth
      ? productionUrl || process.env.BETTER_AUTH_URL
      : process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    trustedOrigins: [...trustedOrigins],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: productionAuth,
      sendResetPassword: async ({ user, url }) => {
        await sendAccountEmail({
          to: user.email,
          subject: 'Reset your StatusPop password',
          text: `Use this link to reset your StatusPop password: ${url}`,
          html: `<p>Use the link below to reset your StatusPop password.</p><p><a href="${url}">Reset password</a></p>`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: productionAuth,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendAccountEmail({
          to: user.email,
          subject: 'Verify your StatusPop account',
          text: `Verify your StatusPop email address: ${url}`,
          html: `<p>Welcome to StatusPop. Verify your email address to activate your account.</p><p><a href="${url}">Verify email</a></p>`,
        });
      },
    },
  });
}

type AuthInstance = ReturnType<typeof createConfiguredAuth>;
const authSecret = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET || '';
export const auth: AuthInstance | null =
  databasePool && authSecret.length >= 32 ? createConfiguredAuth(authSecret) : null;

export function getAuth(): AuthInstance | null {
  return auth;
}

export async function getAuthenticatedUser(request: Request) {
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  return session?.user ?? null;
}
