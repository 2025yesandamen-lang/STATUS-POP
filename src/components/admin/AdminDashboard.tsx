import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Lock, LogOut, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { useToast } from '../ui/Toast.tsx';

type AdminStatus = {
  authenticated: boolean;
  dataStoreConfigured: boolean;
  paymentsConfigured: boolean;
};

type PaymentSummary = {
  totalCount: number;
  successfulCount: number;
  pendingCount: number;
  failedCount: number;
  revenueKobo: number;
};

type AdminPayment = {
  reference: string;
  plan: 'day_pass' | 'pro';
  amountKobo: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  customerEmail: string;
  createdAt: string;
  paidAt: string | null;
};

type PaymentReport = {
  summary: PaymentSummary;
  payments: AdminPayment[];
};

export interface AdminDashboardProps {
  onBack: () => void;
}

const formatNaira = (amountKobo: number): string =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
    .format(amountKobo / 100);

const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'Account email unavailable';
  return `${name.slice(0, 2)}***@${domain}`;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [paymentReport, setPaymentReport] = useState<PaymentReport | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlan, setGrantPlan] = useState<'pro' | 'day_pass'>('pro');
  const [grantDurationDays, setGrantDurationDays] = useState<'1' | '30' | '365'>('365');
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    setPaymentError('');
    try {
      const response = await fetch('/api/admin/payments', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const result = await response.json().catch(() => null) as (PaymentReport & { message?: string }) | null;
      if (!response.ok) throw new Error(result?.message || 'Could not load payment records.');
      if (!result || !result.summary || !Array.isArray(result.payments)) {
        throw new Error('The admin service returned an invalid payment report.');
      }
      setPaymentReport(result);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Could not load payment records.');
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/session', { credentials: 'same-origin' });
      const result = await response.json().catch(() => null) as (AdminStatus & { message?: string }) | null;
      if (!response.ok) throw new Error(result?.message || 'Unable to verify administrator session.');
      if (!result) throw new Error('The admin service returned an invalid response.');
      setStatus(result);
      setServiceError('');
      if (result.authenticated) await loadPayments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Try again later.';
      setServiceError(message);
      showToast('Admin service unavailable', message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      setPassword('');
      if (!response.ok) throw new Error(result.message || 'Login failed.');
      setStatus(result);
      await loadPayments();
      showToast('Signed in', 'Administrator session established.', 'success');
    } catch (error) {
      showToast('Sign-in failed', error instanceof Error ? error.message : 'Try again later.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    setStatus((current) => current ? { ...current, authenticated: false } : null);
    showToast('Signed out', 'Administrator session ended.', 'info');
  };

  const handleGrantAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsGrantingAccess(true);
    try {
      const response = await fetch('/api/admin/entitlements', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: grantEmail,
          plan: grantPlan,
          durationDays: Number(grantDurationDays),
        }),
      });
      const result = await response.json().catch(() => null) as { message?: string; email?: string; expiresAt?: string } | null;
      if (!response.ok) throw new Error(result?.message || 'Could not grant account access.');
      setGrantEmail('');
      showToast(
        'Plan access granted',
        `${result?.email || 'Account'} has ${grantPlan === 'pro' ? 'Pro' : 'Day Pass'} access until ${new Date(result?.expiresAt || '').toLocaleDateString()}.`,
        'success'
      );
    } catch (error) {
      showToast('Could not grant access', error instanceof Error ? error.message : 'Try again later.', 'error');
    } finally {
      setIsGrantingAccess(false);
    }
  };

  if (isLoading) {
    return <main className="min-h-[60vh] grid place-items-center p-6" role="status">Checking administrator session...</main>;
  }

  if (serviceError) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold">Admin service unavailable</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2" role="alert">{serviceError}</p>
            <p className="text-sm text-gray-500 mt-2">
              Configure <code>ADMIN_PASSWORD</code> and <code>SESSION_SECRET</code> in the hosting environment, then retry.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => void refreshStatus()}>Retry</Button>
            <Button variant="outline" onClick={onBack}>Back</Button>
          </div>
        </Card>
      </main>
    );
  }

  if (!status?.authenticated) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#0B6B3A]/10 text-[#0B6B3A] flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Administrator sign in</h1>
            <p className="text-sm text-gray-500 mt-1">Credentials are verified by the server.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <label className="block text-sm font-medium" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-base focus:ring-2 focus:ring-[#0B6B3A] outline-none"
            />
            <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>Sign in</Button>
            <Button type="button" variant="ghost" fullWidth onClick={onBack}>Return to app</Button>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Return to app" className="tap-target rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Administrator</h1>
            <p className="text-sm text-gray-500">Authenticated server session</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => void handleLogout()} leftIcon={<LogOut className="w-4 h-4" />}>Sign out</Button>
      </header>

      <Card padding="md" className="space-y-3">
        <div className="flex items-center gap-2 text-[#0B6B3A] dark:text-green-400">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-semibold">Production service status</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {!status.dataStoreConfigured
            ? 'Admin authentication is active, but database-backed records and payment actions are unavailable until a persistent database is configured.'
            : status.paymentsConfigured
              ? 'The persistent database and Paystack payment storage are configured. Shop orders are sent directly to vendors through WhatsApp and are not stored in this app.'
              : 'The persistent database is configured, but Paystack checkout is disabled until its production settings are complete. Shop orders are sent directly to vendors through WhatsApp and are not stored in this app.'}
        </p>
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          <div className="flex justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-2">
            <dt>Persistent data store</dt><dd>{status.dataStoreConfigured ? 'Configured' : 'Not configured'}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-2">
            <dt>Verified payments</dt><dd>{status.paymentsConfigured ? 'Configured' : 'Disabled'}</dd>
          </div>
        </dl>
      </Card>

      <Card padding="md" className="space-y-4">
        <div>
          <h2 className="font-semibold">Grant staff or demo plan access</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create the regular StatusPop account first, then grant plan access to the same sign-in email. Grants expire automatically.
          </p>
        </div>
        <form onSubmit={handleGrantAccess} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium sm:col-span-2">
            Account sign-in email
            <input
              type="email"
              autoComplete="email"
              required
              value={grantEmail}
              onChange={(event) => setGrantEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base dark:border-gray-700 dark:bg-gray-800"
              placeholder="staff@example.com"
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Plan
            <select
              value={grantPlan}
              onChange={(event) => {
                const plan = event.target.value as 'pro' | 'day_pass';
                setGrantPlan(plan);
                setGrantDurationDays(plan === 'day_pass' ? '1' : '30');
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="pro">Pro (₦2,500/month)</option>
              <option value="day_pass">Day Pass (₦500/24 hours)</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium">
            Access duration
            <select
              value={grantDurationDays}
              onChange={(event) => setGrantDurationDays(event.target.value as '1' | '30' | '365')}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            >
              {grantPlan === 'day_pass' ? (
                <option value="1">24 hours</option>
              ) : (
                <>
                  <option value="30">30 days</option>
                  <option value="365">365 days</option>
                </>
              )}
            </select>
          </label>
          <Button type="submit" isLoading={isGrantingAccess} className="sm:col-span-2">
            Grant plan access
          </Button>
        </form>
      </Card>

      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Paystack transactions</h2>
            <p className="text-sm text-gray-500">Verified payment records stored in Neon.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadPayments()}
            isLoading={isLoadingPayments}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>

        {paymentError && (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">{paymentError}</p>
        )}

        {paymentReport && (
          <>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <dt className="text-xs text-gray-500">Verified revenue</dt>
                <dd className="mt-1 font-bold">{formatNaira(paymentReport.summary.revenueKobo)}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <dt className="text-xs text-gray-500">Successful</dt>
                <dd className="mt-1 font-bold">{paymentReport.summary.successfulCount}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <dt className="text-xs text-gray-500">Pending</dt>
                <dd className="mt-1 font-bold">{paymentReport.summary.pendingCount}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <dt className="text-xs text-gray-500">Failed / total</dt>
                <dd className="mt-1 font-bold">{paymentReport.summary.failedCount} / {paymentReport.summary.totalCount}</dd>
              </div>
            </dl>

            {paymentReport.payments.length === 0 ? (
              <p className="py-5 text-center text-sm text-gray-500">No Paystack transactions have been recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-700">
                      <th className="px-2 py-3 font-medium">Payment</th>
                      <th className="px-2 py-3 font-medium">Customer</th>
                      <th className="px-2 py-3 font-medium">Reference</th>
                      <th className="px-2 py-3 font-medium">Status</th>
                      <th className="px-2 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentReport.payments.map((payment) => (
                      <tr key={payment.reference} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                        <td className="px-2 py-3">
                          <div className="font-semibold">{formatNaira(payment.amountKobo)}</div>
                          <div className="text-xs text-gray-500">{payment.plan === 'day_pass' ? 'Day pass' : 'Pro'}</div>
                        </td>
                        <td className="px-2 py-3">{maskEmail(payment.customerEmail)}</td>
                        <td className="px-2 py-3 font-mono text-xs">{payment.reference}</td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-1 capitalize">
                            {payment.status === 'success'
                              ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                              : payment.status === 'pending'
                                ? <Clock3 className="h-4 w-4 text-amber-600" />
                                : <XCircle className="h-4 w-4 text-red-600" />}
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-xs text-gray-500">
                          {new Date(payment.paidAt || payment.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="pt-3 text-xs text-gray-500">Showing the latest {paymentReport.payments.length} transactions.</p>
              </div>
            )}
          </>
        )}
      </Card>
    </main>
  );
};
