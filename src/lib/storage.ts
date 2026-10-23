import { VendorProfile, ProductItem, AnalyticsEvent } from '../types/index.ts';
import { uploadMedia } from './media.ts';

const STORAGE_KEYS = {
  VENDOR: 'statuspop_vendor_profile',
  PRODUCTS: 'statuspop_products',
  EVENTS: 'statuspop_events',
  CRM_VENDORS: 'statuspop_crm_vendors',
  REFERRAL_COOKIE: 'statuspop_ref_code',
};

const DEFAULT_VENDOR: VendorProfile = {
  id: `vendor_${crypto.randomUUID()}`,
  businessName: '',
  shopSlug: '',
  phone: '',
  whatsappNumber: '',
  email: '',
  bio: '',
  address: '',
  referralCode: '',
  plan: 'free',
  flyersCreatedToday: 0,
  lastFlyerDate: new Date().toISOString().split('T')[0],
  isPhoneVerified: false,
  isBankVerified: false,
  dailyReminderEnabled: true,
  dailyReminderTime: '08:00',
  lastDailyReminderDate: '',
};

let cloudSyncEnabled = false;
let cloudSyncGeneration = 0;
let cloudWriteQueue = Promise.resolve();

function writeVendorLocally(profile: VendorProfile): void {
  localStorage.setItem(STORAGE_KEYS.VENDOR, JSON.stringify(profile));
}

function writeProductsLocally(products: ProductItem[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

async function productsWithCloudImages(products: ProductItem[]): Promise<ProductItem[]> {
  return Promise.all(products.map(async (product) => {
    if (!product.image.startsWith('data:')) return product;
    const uploaded = await uploadMedia(product.image, 'product');
    return { ...product, image: uploaded.secureUrl };
  }));
}

async function writePreparedAccountData(
  profile: VendorProfile,
  cloudProducts: ProductItem[],
  shouldApplyLocally: () => boolean = () => true
): Promise<void> {
  const response = await fetch('/api/vendor/data', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, products: cloudProducts }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(result.message || 'Could not save your account data.');
  }
  if (shouldApplyLocally()) writeProductsLocally(cloudProducts);
}

async function writeAccountData(
  profile: VendorProfile,
  products: ProductItem[],
  shouldApplyLocally: () => boolean
): Promise<void> {
  const cloudProducts = await productsWithCloudImages(products);
  if (!shouldApplyLocally()) return;
  await writePreparedAccountData(profile, cloudProducts, shouldApplyLocally);
}

function queueAccountDataWrite(): void {
  if (!cloudSyncEnabled || typeof window === 'undefined') return;
  const generation = cloudSyncGeneration;
  const isCurrentSync = () => cloudSyncEnabled && generation === cloudSyncGeneration;
  cloudWriteQueue = cloudWriteQueue
    .then(async () => {
      if (!isCurrentSync()) return;
      const rawProfile = localStorage.getItem(STORAGE_KEYS.VENDOR);
      const profile = rawProfile ? JSON.parse(rawProfile) as VendorProfile : DEFAULT_VENDOR;
      await writeAccountData(profile, getProducts(), isCurrentSync);
    })
    .catch((error: unknown) => {
      console.error('Could not synchronize StatusPop account data:', error);
    });
}

export async function synchronizeAccountData(): Promise<{ profile: VendorProfile; products: ProductItem[] }> {
  const generation = ++cloudSyncGeneration;
  cloudSyncEnabled = false;
  const isCurrentSync = () => generation === cloudSyncGeneration;
  const response = await fetch('/api/vendor/data', { credentials: 'same-origin' });
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(result.message || 'Could not load your account data.');
  }

  if (!isCurrentSync()) throw new Error('Account data sync was cancelled.');
  const cloudData = await response.json() as { profile: VendorProfile | null; products: ProductItem[] };
  if (cloudData.profile) {
    const profile = { ...cloudData.profile, id: cloudData.profile.id || getVendorProfile().id };
    writeVendorLocally(profile);
    writeProductsLocally(cloudData.products);
    cloudSyncEnabled = true;
    return { profile, products: cloudData.products };
  }

  const profile = getVendorProfile();
  const products = getProducts();
  const migratedProducts = await productsWithCloudImages(products);
  if (!isCurrentSync()) throw new Error('Account data sync was cancelled.');
  await writePreparedAccountData(profile, migratedProducts, isCurrentSync);
  if (!isCurrentSync()) throw new Error('Account data sync was cancelled.');
  writeVendorLocally(profile);
  writeProductsLocally(migratedProducts);
  cloudSyncEnabled = true;
  return { profile, products: migratedProducts };
}

export function disableAccountDataSync(): void {
  cloudSyncEnabled = false;
  cloudSyncGeneration++;
}

export function clearAccountDataCache(): void {
  disableAccountDataSync();
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.VENDOR);
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
}

function clearLegacyDemoData(): void {
  if (typeof window === 'undefined' || localStorage.getItem('statuspop_demo_cleanup_v1')) return;
  try {
    const legacyProfile = localStorage.getItem(STORAGE_KEYS.VENDOR);
    if (legacyProfile && JSON.parse(legacyProfile).id === 'vendor_lagos_01') {
      localStorage.removeItem(STORAGE_KEYS.VENDOR);
    }

    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]') as ProductItem[];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products.filter((item) => !/^prod_[1-4]$/.test(item.id))));

    const orders = JSON.parse(localStorage.getItem('statuspop_orders') || '[]') as Array<{ id?: string }>;
    localStorage.setItem('statuspop_orders', JSON.stringify(orders.filter((order) => !['ord_101', 'ord_102', 'ord_103'].includes(order.id || ''))));

    localStorage.removeItem('statuspop_paystack_transactions');
    localStorage.removeItem('statuspop_crm_vendors');
    localStorage.setItem('statuspop_demo_cleanup_v1', 'complete');
  } catch {
    localStorage.removeItem('statuspop_paystack_transactions');
    localStorage.removeItem('statuspop_crm_vendors');
  }
}

clearLegacyDemoData();

export function getVendorProfile(): VendorProfile {
  if (typeof window === 'undefined') return DEFAULT_VENDOR;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VENDOR);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.VENDOR, JSON.stringify(DEFAULT_VENDOR));
      return DEFAULT_VENDOR;
    }
    const profile: VendorProfile = JSON.parse(data);
    if (profile.id === 'vendor_lagos_01') {
      localStorage.removeItem(STORAGE_KEYS.VENDOR);
      return DEFAULT_VENDOR;
    }
    profile.plan = 'free';
    profile.planExpiresAt = undefined;
    profile.isBankVerified = false;
    profile.paystackSubaccountCode = undefined;
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastFlyerDate !== today) {
      profile.flyersCreatedToday = 0;
      profile.lastFlyerDate = today;
      saveVendorProfile(profile);
    }
    return profile;
  } catch (e) {
    return DEFAULT_VENDOR;
  }
}

export function saveVendorProfile(profile: VendorProfile): void {
  if (typeof window === 'undefined') return;
  try {
    writeVendorLocally(profile);
    queueAccountDataWrite();
  } catch (e) {
    console.error('Failed to save vendor profile', e);
  }
}

export async function saveAccountData(profile: VendorProfile, products: ProductItem[]): Promise<void> {
  if (typeof window === 'undefined') return;
  if (cloudSyncEnabled) {
    const cloudProducts = await productsWithCloudImages(products);
    await writePreparedAccountData(profile, cloudProducts);
  } else {
    writeProductsLocally(products);
  }
  writeVendorLocally(profile);
}

export function lockPlanToPhone(phone: string): VendorProfile {
  const profile = getVendorProfile();
  profile.phone = phone;
  profile.whatsappNumber = phone.startsWith('0') ? '234' + phone.slice(1) : phone;
  profile.isPhoneVerified = true;
  saveVendorProfile(profile);

  // Store in phone lookup registry
  if (typeof window !== 'undefined') {
    localStorage.setItem(`statuspop_phone_${phone}`, JSON.stringify(profile));
  }
  return profile;
}

export function lookupVendorByPhone(phone: string): VendorProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`statuspop_phone_${phone}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function recordFlyerCreated(): { canCreate: boolean; remaining: number } {
  const profile = getVendorProfile();
  const isPaid =
    profile.plan === 'pro' ||
    (profile.plan === 'day_pass' && profile.planExpiresAt && new Date(profile.planExpiresAt) > new Date());

  if (isPaid) {
    profile.flyersCreatedToday += 1;
    saveVendorProfile(profile);
    recordAnalyticsEvent('flyer_created', { plan: profile.plan });
    return { canCreate: true, remaining: 999 };
  }

  const dailyLimit = 3;
  if (profile.flyersCreatedToday >= dailyLimit) {
    return { canCreate: false, remaining: 0 };
  }

  profile.flyersCreatedToday += 1;
  saveVendorProfile(profile);
  recordAnalyticsEvent('flyer_created', { plan: 'free', count: profile.flyersCreatedToday });
  return { canCreate: true, remaining: dailyLimit - profile.flyersCreatedToday };
}

export function getProducts(): ProductItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      return [];
    }
    const products: ProductItem[] = JSON.parse(raw);
    return products.filter((product) => !/^prod_[1-4]$/.test(product.id));
  } catch {
    return [];
  }
}

export function saveProducts(products: ProductItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    writeProductsLocally(products);
    queueAccountDataWrite();
  } catch (e) {
    console.error('Failed to save products', e);
  }
}

export function addOrUpdateProduct(product: ProductItem): void {
  const list = getProducts();
  const existingIdx = list.findIndex((p) => p.id === product.id);
  if (existingIdx >= 0) {
    list[existingIdx] = product;
  } else {
    list.unshift(product);
  }
  saveProducts(list);
}

export function recordAnalyticsEvent(type: AnalyticsEvent['type'], metadata?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    events.unshift({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      timestamp: new Date().toISOString(),
      metadata,
    });
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events.slice(0, 200)));
  } catch {
    // ignore
  }
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setReferralCookie(code: string, src: 'qr' | 'caption' | 'direct' = 'direct'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REFERRAL_COOKIE, code);
  recordAnalyticsEvent(src === 'qr' ? 'qr_scan' : src === 'caption' ? 'caption_click' : 'watermark_click', {
    code,
    src,
  });
}

export function getReferralCookie(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFERRAL_COOKIE);
}
