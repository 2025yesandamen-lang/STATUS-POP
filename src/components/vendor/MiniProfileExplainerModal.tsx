import React, { useState } from 'react';
import {
  Store,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  ShoppingBag,
  Share2,
  MapPin,
  Phone,
  Edit3,
  X,
  Sparkles,
  HelpCircle,
  Smartphone,
  ArrowRight,
  CreditCard,
  Building2,
  ShieldCheck,
  Bell,
  Clock,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { VendorProfile, ProductItem } from '../../types/index.ts';
import { saveAccountData } from '../../lib/storage.ts';
import { formatNaira, formatWhatsAppPhone } from '../../lib/format.ts';
import { getNigerianBanks, resolveBankAccount, createPaystackSubaccount } from '../../lib/banks.ts';
import {
  requestBrowserNotificationPermission,
  sendBrowserPushNotification,
} from '../../lib/reminderScheduler.ts';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';

interface MiniProfileExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: VendorProfile;
  products: ProductItem[];
  onUpdateVendor: (updated: VendorProfile) => void;
  onUpdateProducts: (updated: ProductItem[]) => void;
  onOpenStoreView: () => void;
  onTriggerTestReminder?: () => void;
}

export const MiniProfileExplainerModal: React.FC<MiniProfileExplainerModalProps> = ({
  isOpen,
  onClose,
  vendor,
  products,
  onUpdateVendor,
  onUpdateProducts,
  onOpenStoreView,
  onTriggerTestReminder,
}) => {
  const { showToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'store' | 'bank' | 'reminder'>('store');
  const [isEditing, setIsEditing] = useState(false);

  // Store fields
  const [businessName, setBusinessName] = useState(vendor.businessName);
  const [shopSlug, setShopSlug] = useState(vendor.shopSlug);
  const [phone, setPhone] = useState(vendor.phone);
  const [whatsappNumber, setWhatsappNumber] = useState(vendor.whatsappNumber);
  const [bio, setBio] = useState(vendor.bio || '');
  const [address, setAddress] = useState(vendor.address || '');

  // Bank & Paystack Split Payment fields
  const banks = getNigerianBanks();
  const [bankCode, setBankCode] = useState(vendor.bankCode || '044');
  const [bankName, setBankName] = useState(vendor.bankName || 'Access Bank');
  const [accountNumber, setAccountNumber] = useState(vendor.accountNumber || '');
  const [accountName, setAccountName] = useState(vendor.accountName || '');
  const [paystackSubaccount, setPaystackSubaccount] = useState(vendor.paystackSubaccountCode || '');
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [isCreatingSubaccount, setIsCreatingSubaccount] = useState(false);
  const [isSavingProducts, setIsSavingProducts] = useState(false);

  // Daily Status Reminder fields
  const [reminderEnabled, setReminderEnabled] = useState(vendor.dailyReminderEnabled !== false);
  const [reminderTime, setReminderTime] = useState(vendor.dailyReminderTime || '08:00');

  if (!isOpen) return null;

  const publicUrl = vendor.shopSlug
    ? `${window.location.origin}/shop/${encodeURIComponent(vendor.shopSlug)}`
    : '';

  const handleCopyLink = async () => {
    if (!publicUrl) {
      showToast('Add a shop URL first', 'Choose a store slug in Edit Info before copying your public link.', 'error');
      setIsEditing(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      showToast('Store Link Copied!', 'Paste in your WhatsApp About / Bio or Instagram!', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      showToast('Link Ready', publicUrl, 'info');
    }
  };

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = banks.find((b) => b.code === e.target.value);
    if (selected) {
      setBankCode(selected.code);
      setBankName(selected.name);
      setAccountName('');
    }
  };

  const handleVerifyBankAccount = async () => {
    if (!accountNumber || accountNumber.length !== 10) {
      showToast('Invalid Account', 'Please enter a 10-digit NUBAN account number.', 'error');
      return;
    }

    setIsVerifyingBank(true);
    try {
      const res = await resolveBankAccount(accountNumber, bankCode);
      if (res.success && res.accountName) {
        setAccountName(res.accountName);
        showToast('Bank Account Verified!', res.accountName, 'success');
      } else {
        showToast('Verification Notice', res.error || 'Could not verify account name.', 'info');
      }
    } catch (e) {
      showToast('Error', 'Bank verification failed.', 'error');
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const handleCreateSubaccount = async () => {
    if (!accountNumber || !bankCode) {
      showToast('Missing details', 'Enter your account number and bank first.', 'error');
      return;
    }

    setIsCreatingSubaccount(true);
    try {
      const res = await createPaystackSubaccount({
        businessName: businessName || vendor.businessName,
        bankCode,
        accountNumber,
        splitPercentage: 100,
      });

      if (res.success && res.subaccountCode) {
        setPaystackSubaccount(res.subaccountCode);
        showToast('Paystack Subaccount Connected!', `Code: ${res.subaccountCode}`, 'success');
      }
    } catch (e) {
      showToast('Error', 'Could not create subaccount.', 'error');
    } finally {
      setIsCreatingSubaccount(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: VendorProfile = {
      ...vendor,
      businessName: businessName.trim() || vendor.businessName,
      shopSlug: shopSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '') || vendor.shopSlug,
      phone: phone.trim() || vendor.phone,
      whatsappNumber: whatsappNumber.trim() || vendor.whatsappNumber,
      bio: bio.trim(),
      address: address.trim(),

      // Bank & Split Payout Details
      bankCode,
      bankName,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      paystackSubaccountCode: paystackSubaccount || vendor.paystackSubaccountCode,
      splitPercentage: 100,
      isBankVerified: Boolean(accountName),

      // Daily Reminder Settings
      dailyReminderEnabled: reminderEnabled,
      dailyReminderTime: reminderTime,
    };

    try {
      await saveAccountData(updated, products);
      onUpdateVendor(updated);
      setShopSlug(updated.shopSlug);
      setIsEditing(false);
      showToast('Settings Saved!', 'Your store settings were saved.', 'success');
    } catch (error) {
      showToast('Could not save settings', error instanceof Error ? error.message : 'Please try again.', 'error');
    }
  };

  const handleToggleProductPublished = async (productId: string, isPublished: boolean) => {
    const updatedProducts = products.map((product) => (
      product.id === productId ? { ...product, isPublished } : product
    ));
    setIsSavingProducts(true);
    try {
      await saveAccountData(vendor, updatedProducts);
      onUpdateProducts(updatedProducts);
      showToast('Product visibility updated', '', 'success');
    } catch (error) {
      showToast('Could not update product', error instanceof Error ? error.message : 'Please try again.', 'error');
    } finally {
      setIsSavingProducts(false);
    }
  };

  const handleTestReminder = async () => {
    await requestBrowserNotificationPermission();
    sendBrowserPushNotification(
      '🔔 StatusPop 8:00 AM Reminder',
      `Good morning, ${businessName}! Time to post today's hot deal on WhatsApp Status!`
    );
    if (onTriggerTestReminder) {
      onClose();
      onTriggerTestReminder();
    } else {
      showToast('Reminder Triggered!', 'Test prompt sent to your screen.', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A202C] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-2xl p-5 space-y-4 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#0B6B3A] text-white flex items-center justify-center font-black shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Vendor Hub & Store Settings</span>
              </h2>
              <p className="text-xs text-gray-500">
                Split Payments, Store Profile & Daily Status Reminders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="tap-target p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'store'
                ? 'bg-white dark:bg-gray-700 text-[#0B6B3A] dark:text-[#FFC93C] shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'bank'
                ? 'bg-white dark:bg-gray-700 text-[#0B6B3A] dark:text-[#FFC93C] shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Split</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reminder')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'reminder'
                ? 'bg-white dark:bg-gray-700 text-[#0B6B3A] dark:text-[#FFC93C] shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>8 AM Alert</span>
          </button>
        </div>

        {/* TAB 1: STORE PROFILE */}
        {activeTab === 'store' && (
          <div className="space-y-3">
            {/* Explainer Cards */}
            <div className="space-y-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 p-3.5 rounded-2xl border border-green-200 dark:border-green-800/40 text-xs">
              <span className="font-extrabold text-[#0B6B3A] dark:text-green-400 block text-xs uppercase tracking-wide">
                💡 What is StatusPop Mini Profile?
              </span>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xs">
                Your web catalogue with your phone, published products, and direct WhatsApp orders.
                Customers order with 1 tap. Your shop link remains available after a Day Pass or Pro
                flyer plan expires.
              </p>
            </div>

            {/* Dedicated Store Link Box */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Your Dedicated Mini Store Link:
              </span>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700">
                <span className="text-xs font-mono font-bold text-[#0B6B3A] dark:text-green-400 truncate flex-1">
                  {publicUrl || 'Set a store URL in Edit Info to create your link'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="tap-target px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-950/60 text-[#0B6B3A] dark:text-green-400 text-xs font-bold hover:bg-green-200 flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenStoreView();
                  }}
                  leftIcon={<ShoppingBag className="w-4 h-4" />}
                  className="text-xs font-bold"
                >
                  Preview Store
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  leftIcon={<Edit3 className="w-4 h-4" />}
                  className="text-xs font-bold"
                >
                  {isEditing ? 'Close Edit' : 'Edit Info'}
                </Button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 space-y-2">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Published products
                </span>
                <p className="text-[11px] text-gray-500 mt-1">
                  Select which products customers can see in your public shop.
                </p>
              </div>
              {products.length === 0 ? (
                <p className="text-xs text-gray-500">Create a product flyer first to add products to your catalogue.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={product.isPublished === true}
                        onChange={(event) => handleToggleProductPublished(product.id, event.target.checked)}
                        disabled={isSavingProducts}
                        className="accent-[#0B6B3A]"
                      />
                      <span className="truncate">{product.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Inline Store Editor Form */}
            {isEditing && (
              <form
                onSubmit={handleSaveAll}
                className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs"
              >
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">
                      Store Slug (URL)
                    </label>
                    <input
                      type="text"
                      value={shopSlug}
                      onChange={(e) => setShopSlug(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">
                    Shop Address / Location
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">
                    Bio / Products
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                  />
                </div>

                <Button type="submit" variant="primary" size="sm" fullWidth className="font-bold">
                  Save Storefront Info
                </Button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: DIRECT PAYSTACK SPLIT PAYMENTS & BANK ACCOUNT */}
        {activeTab === 'bank' && (
          <form onSubmit={handleSaveAll} className="space-y-3.5 text-xs">
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/15 to-amber-500/10 dark:from-emerald-950/30 rounded-2xl border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-black text-[#0B6B3A] dark:text-emerald-400">
                <CreditCard className="w-4 h-4 text-[#FF5A36]" />
                <span>Direct Paystack Split Payments</span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Connect your Nigerian bank account (Access, GTBank, OPay, PalmPay, Zenith, etc.).
                Customer orders placed in your store deposit <strong>100% directly</strong> into
                your account!
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Select Settlement Bank
              </label>
              <select
                value={bankCode}
                onChange={handleBankSelect}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold focus:ring-2 focus:ring-[#0B6B3A] outline-none"
              >
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name} ({b.ussdPrefix})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                10-Digit NUBAN Account Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 0123456789"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, ''));
                    setAccountName('');
                  }}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono font-bold focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isVerifyingBank}
                  onClick={handleVerifyBankAccount}
                  className="text-xs font-bold shrink-0"
                >
                  Verify Bank
                </Button>
              </div>
            </div>

            {/* Verified Account Name Badge */}
            {accountName && (
              <div className="p-2.5 bg-green-50 dark:bg-green-950/40 rounded-xl border border-green-200 dark:border-green-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-green-800 dark:text-green-300 font-bold truncate">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="truncate">{accountName}</span>
                </div>
                <span className="text-[10px] bg-green-600 text-white font-black px-1.5 py-0.5 rounded-full shrink-0">
                  Verified
                </span>
              </div>
            )}

            {/* Paystack Subaccount Code */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                  Paystack Subaccount Code:
                </span>
                <span className="text-[10px] font-mono font-bold text-[#0B6B3A] dark:text-green-400">
                  {paystackSubaccount || 'Not Generated Yet'}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                isLoading={isCreatingSubaccount}
                onClick={handleCreateSubaccount}
                leftIcon={<Zap className="w-3.5 h-3.5 text-[#FF5A36]" />}
                className="text-xs font-bold"
              >
                {paystackSubaccount ? 'Re-Sync Subaccount' : 'Auto-Generate Paystack Subaccount'}
              </Button>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              className="font-bold text-xs"
            >
              Save Bank & Split Payment Details
            </Button>
          </form>
        )}

        {/* TAB 3: DAILY 8:00 AM WHATSAPP STATUS REMINDER SCHEDULER */}
        {activeTab === 'reminder' && (
          <form onSubmit={handleSaveAll} className="space-y-3.5 text-xs">
            <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/10 dark:from-amber-950/30 rounded-2xl border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-300">
                <Bell className="w-4 h-4 text-[#FF5A36]" />
                <span>Daily WhatsApp Status Sales Reminder</span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Most Nigerian buyers check WhatsApp status between <strong>8:00 AM and 9:00 AM</strong>.
                Receive an automatic morning prompt with today’s hot deal flyer ready to post with 1
                tap!
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <span className="font-bold text-gray-900 dark:text-white block text-xs">
                  Enable Daily Status Reminder
                </span>
                <span className="text-[10px] text-gray-500">
                  Fires automatically every morning
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#0B6B3A] rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Preferred Morning Time
              </label>
              <select
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold focus:ring-2 focus:ring-[#0B6B3A] outline-none"
              >
                <option value="07:00">07:00 AM — Early Bird Hustle</option>
                <option value="08:00">08:00 AM — Recommended Peak Hour (Default)</option>
                <option value="09:00">09:00 AM — Morning Market Rush</option>
                <option value="12:00">12:00 PM — Lunch Break Clearance</option>
                <option value="18:00">06:00 PM — Evening Commute Drop</option>
              </select>
            </div>

            <div className="pt-1 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleTestReminder}
                leftIcon={<Bell className="w-4 h-4 text-amber-500" />}
                className="text-xs font-bold"
              >
                Test Alert Now
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                fullWidth
                className="text-xs font-bold"
              >
                Save Schedule
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
