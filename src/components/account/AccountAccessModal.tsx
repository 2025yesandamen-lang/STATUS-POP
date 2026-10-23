import React, { useEffect, useState } from 'react';
import { KeyRound, Mail, UserRound, X } from 'lucide-react';
import { authClient } from '../../lib/auth-client.ts';
import { disableAccountDataSync, synchronizeAccountData } from '../../lib/storage.ts';
import { Button } from '../ui/Button.tsx';
import type { ProductItem, VendorProfile, UserPlan } from '../../types/index.ts';

interface AccountAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (account: {
    email: string;
    profile: VendorProfile;
    products: ProductItem[];
    plan: UserPlan;
    planExpiresAt?: string;
  }) => void;
  onSignedOut: () => void;
  currentEmail: string;
  isAuthenticated: boolean;
}

type AuthMode = 'sign-in' | 'sign-up' | 'reset';

export const AccountAccessModal: React.FC<AccountAccessModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  onSignedOut,
  currentEmail,
  isAuthenticated,
}) => {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (currentEmail) setEmail(currentEmail);
  }, [currentEmail]);

  if (!isOpen) return null;

  const finishSignIn = async () => {
    const [data, sessionResponse] = await Promise.all([
      synchronizeAccountData(),
      fetch('/api/vendor/session', { credentials: 'same-origin', cache: 'no-store' }),
    ]);
    if (!sessionResponse.ok) throw new Error('Signed in, but could not load account status.');
    const session = await sessionResponse.json() as {
      authenticated?: boolean;
      email?: string;
      plan?: UserPlan;
      planExpiresAt?: string | null;
    };
    if (!session.authenticated || !session.email) throw new Error('The account session could not be confirmed.');
    onAuthenticated({
      email: session.email,
      profile: { ...data.profile, email: session.email, plan: session.plan || 'free', planExpiresAt: session.planExpiresAt || undefined },
      products: data.products,
      plan: session.plan || 'free',
      planExpiresAt: session.planExpiresAt || undefined,
    });
    setNotice('Signed in. Your account data is now synced across devices.');
    setPassword('');
    window.setTimeout(onClose, 700);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice('');
    setErrorMessage('');
    try {
      if (mode === 'reset') {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: window.location.origin,
        });
        if (result.error) throw new Error(result.error.message || 'Could not request a password reset.');
        setNotice('If that email belongs to an account, a password-reset link will be sent.');
        return;
      }

      if (mode === 'sign-up') {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          callbackURL: window.location.origin,
        });
        if (result.error) throw new Error(result.error.message || 'Could not create your account.');
        await finishSignIn();
        return;
      }

      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe: true,
      });
      if (result.error) throw new Error(result.error.message || 'Could not sign in.');

      await finishSignIn();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Account request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message || 'Could not sign out.');
      disableAccountDataSync();
      onSignedOut();
      setNotice('You are signed out. Browser drafts remain on this device.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not sign out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'sign-up' ? 'Create your StatusPop account' : mode === 'reset' ? 'Reset your password' : 'Sign in to StatusPop';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-access-title"
        className="w-full max-w-md space-y-5 rounded-3xl border border-gray-200 bg-white p-5 text-gray-900 shadow-2xl dark:border-gray-800 dark:bg-[#1A202C] dark:text-gray-100"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-[#0B6B3A] dark:bg-emerald-950/50 dark:text-emerald-300">
              <UserRound className="h-5 w-5" />
            </div>
            <h2 id="account-access-title" className="text-lg font-black">{isAuthenticated ? 'Your account' : title}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isAuthenticated ? 'Your vendor profile and saved products are synced to your account.' : 'Sign in to save your profile and use your paid plan on other devices.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close account dialog" className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isAuthenticated ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800">{currentEmail}</p>
            <Button type="button" variant="outline" fullWidth isLoading={isSubmitting} onClick={handleSignOut}>Sign out</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'sign-up' && (
              <label className="block text-xs font-semibold">
                Name
                <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-700 dark:bg-gray-800" />
              </label>
            )}
            <label className="block text-xs font-semibold">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</span>
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-700 dark:bg-gray-800" />
            </label>
            {mode !== 'reset' && (
              <label className="block text-xs font-semibold">
                <span className="flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> Password</span>
                <input required type="password" minLength={8} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-700 dark:bg-gray-800" />
                {mode === 'sign-up' && <span className="mt-1 block font-normal text-gray-500">Use at least 8 characters.</span>}
              </label>
            )}
            {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</p>}
            {errorMessage && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">{errorMessage}</p>}
            <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
              {mode === 'sign-up' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
            </Button>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
              {mode === 'sign-in' && <button type="button" className="font-semibold text-[#0B6B3A] underline dark:text-emerald-300" onClick={() => { setMode('reset'); setNotice(''); setErrorMessage(''); }}>Forgot password?</button>}
              {mode !== 'sign-in' && <button type="button" className="font-semibold text-[#0B6B3A] underline dark:text-emerald-300" onClick={() => { setMode('sign-in'); setNotice(''); setErrorMessage(''); }}>Back to sign in</button>}
              {mode === 'sign-in' && <button type="button" className="font-semibold text-[#0B6B3A] underline dark:text-emerald-300" onClick={() => { setMode('sign-up'); setNotice(''); setErrorMessage(''); }}>Create an account</button>}
            </div>
          </form>
        )}

        {notice && isAuthenticated && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</p>}
        {errorMessage && isAuthenticated && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">{errorMessage}</p>}
      </section>
    </div>
  );
};
