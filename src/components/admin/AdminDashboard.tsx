import React, { useEffect, useState } from 'react';
import { ArrowLeft, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { useToast } from '../ui/Toast.tsx';

type AdminStatus = {
  authenticated: boolean;
  dataStoreConfigured: boolean;
  paymentsConfigured: boolean;
};

export interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState('');

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/session', { credentials: 'same-origin' });
      const result = await response.json().catch(() => null) as (AdminStatus & { message?: string }) | null;
      if (!response.ok) throw new Error(result?.message || 'Unable to verify administrator session.');
      if (!result) throw new Error('The admin service returned an invalid response.');
      setStatus(result);
      setServiceError('');
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
    </main>
  );
};
