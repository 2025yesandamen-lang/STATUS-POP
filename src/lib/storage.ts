import {
  VendorProfile,
  ProductItem,
  CustomerOrder,
  AnalyticsEvent,
  UserPlan,
  PaystackTransaction,
} from '../types/index.ts';

const STORAGE_KEYS = {
  VENDOR: 'statuspop_vendor_profile',
  PRODUCTS: 'statuspop_products',
  ORDERS: 'statuspop_orders',
  EVENTS: 'statuspop_events',
  TRANSACTIONS: 'statuspop_paystack_transactions',
  CRM_VENDORS: 'statuspop_crm_vendors',
  REFERRAL_COOKIE: 'statuspop_ref_code',
};

const DEFAULT_VENDOR: VendorProfile = {
  id: 'vendor_lagos_01',
  businessName: 'Chidi Collections & Wears',
  shopSlug: 'chidi-collections',
  phone: '08023456789',
  whatsappNumber: '2348023456789',
  email: 'chidi@statuspop.ng',
  bio: 'Original UK Grade-A sneakers, native wears & designer perfumes in Lagos. Pay on delivery available!',
  address: 'Shop 14, Tejuosho Ultra Modern Market, Yaba, Lagos',
  referralCode: 'CHIDI99',
  plan: 'free',
  flyersCreatedToday: 1,
  lastFlyerDate: new Date().toISOString().split('T')[0],
  isPhoneVerified: false,
  bankName: 'Access Bank',
  bankCode: '044',
  accountNumber: '0123456789',
  accountName: 'CHIDI OKAFOR ENTERPRISES',
  paystackSubaccountCode: 'ACCT_chidi_lagos_01',
  splitPercentage: 100,
  isBankVerified: true,
  dailyReminderEnabled: true,
  dailyReminderTime: '08:00',
  lastDailyReminderDate: '',
};

const SEED_CRM_VENDORS: VendorProfile[] = [
  DEFAULT_VENDOR,
  {
    id: 'vendor_02',
    businessName: 'Ladipo Speed Auto Clinic',
    shopSlug: 'ladipo-speed-auto',
    phone: '08034567890',
    whatsappNumber: '2348034567890',
    email: 'ladipoauto@gmail.com',
    bio: 'OBD diagnostics, Tokunbo gearboxes & engines. Same day fix.',
    address: 'Warehouse 8, Ladipo Auto Market, Mushin, Lagos',
    referralCode: 'LADIPO01',
    plan: 'pro',
    planExpiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    flyersCreatedToday: 6,
    lastFlyerDate: new Date().toISOString().split('T')[0],
    isPhoneVerified: true,
  },
  {
    id: 'vendor_03',
    businessName: 'Sammy Cooling & Electricals',
    shopSlug: 'sammy-cooling',
    phone: '08098765432',
    whatsappNumber: '2348098765432',
    email: 'sammycooling@gmail.com',
    bio: 'AC repair, gas topup & solar inverter installations in Lagos.',
    address: 'Gbagada Phase 2, Lagos',
    referralCode: 'SAMMYAC',
    plan: 'day_pass',
    planExpiresAt: new Date(Date.now() + 14 * 3600000).toISOString(),
    flyersCreatedToday: 4,
    lastFlyerDate: new Date().toISOString().split('T')[0],
    isPhoneVerified: true,
  },
  {
    id: 'vendor_04',
    businessName: 'Iyabo Kitchen & Grills',
    shopSlug: 'iyabo-kitchen',
    phone: '08055443322',
    whatsappNumber: '2348055443322',
    email: 'iyabofood@gmail.com',
    bio: 'Firewood party jollof, peppered turkey & catfish barbecue.',
    address: 'Surulere, Lagos',
    referralCode: 'IYABO55',
    plan: 'pro',
    planExpiresAt: new Date(Date.now() + 18 * 86400000).toISOString(),
    flyersCreatedToday: 8,
    lastFlyerDate: new Date().toISOString().split('T')[0],
    isPhoneVerified: true,
  },
];

const SEED_TRANSACTIONS: PaystackTransaction[] = [
  {
    id: 'trx_1',
    reference: 'PAY_1730009123_4821',
    vendorPhone: '08034567890',
    businessName: 'Ladipo Speed Auto Clinic',
    plan: 'pro',
    amount: 2500,
    currency: 'NGN',
    status: 'success',
    channel: 'card',
    signature: '7f9a8b1c4e2d3f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    paidAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'trx_2',
    reference: 'PAY_1730018492_3012',
    vendorPhone: '08098765432',
    businessName: 'Sammy Cooling & Electricals',
    plan: 'day_pass',
    amount: 500,
    currency: 'NGN',
    status: 'success',
    channel: 'bank_transfer',
    signature: '3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a7f9a8b1c4e2d3f0a5b6c7d8e9f0a1b2c',
    paidAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'trx_3',
    reference: 'PAY_1730029312_9941',
    vendorPhone: '08055443322',
    businessName: 'Iyabo Kitchen & Grills',
    plan: 'pro',
    amount: 2500,
    currency: 'NGN',
    status: 'success',
    channel: 'ussd',
    signature: '1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a7f9a8b1c4e2d3f0a5b6c7d8e9f0a',
    paidAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const SEED_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_1',
    name: 'Air Max 90 OG Neon Sneakers',
    description: 'Clean UK used condition, original box, size 42-45 available. Very comfortable for daily drip.',
    price: 32000,
    originalPrice: 40000,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    isPublished: true,
    inStock: true,
    stockCount: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    name: 'Party Jollof & Peppered Turkey Combo',
    description: 'Freshly prepared firewood smokey party jollof with soft peppered jumbo turkey and fried plantain.',
    price: 6500,
    originalPrice: 8000,
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
    isPublished: true,
    inStock: true,
    stockCount: 25,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    name: 'Luxury Arabian Vanilla Oud (100ml)',
    description: 'Long-lasting projection for 48 hours. Sweet warm vanilla notes that turn heads everywhere you enter.',
    price: 24500,
    originalPrice: 30000,
    category: 'Beauty',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&auto=format&fit=crop&q=80',
    isPublished: true,
    inStock: true,
    stockCount: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    name: '5 Yards Swiss Voile Lace (Lilac & Gold)',
    description: 'High-density pure cotton Swiss voile. Does not itch or fade. Perfect for wedding owanbe guest.',
    price: 45000,
    originalPrice: 55000,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
    isPublished: true,
    inStock: true,
    stockCount: 5,
    createdAt: new Date().toISOString(),
  },
];

const SEED_ORDERS: CustomerOrder[] = [
  {
    id: 'ord_101',
    orderNumber: 'SP-9482',
    vendorId: 'vendor_lagos_01',
    customerName: 'Amina Bello',
    customerPhone: '08139485721',
    customerAddress: 'Block B, 1004 Estate, Victoria Island, Lagos',
    items: [
      {
        id: 'item_1',
        productId: 'prod_1',
        productName: 'Air Max 90 OG Neon Sneakers',
        price: 32000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
      },
    ],
    totalAmount: 32000,
    status: 'completed',
    referralCode: 'CHIDI99',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ord_102',
    orderNumber: 'SP-9531',
    vendorId: 'vendor_lagos_01',
    customerName: 'Emeka Okafor',
    customerPhone: '09058372619',
    customerAddress: 'Plot 12, Admiralty Way, Lekki Phase 1, Lagos',
    items: [
      {
        id: 'item_2',
        productId: 'prod_3',
        productName: 'Luxury Arabian Vanilla Oud (100ml)',
        price: 24500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&auto=format&fit=crop&q=80',
      },
    ],
    totalAmount: 24500,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ord_103',
    orderNumber: 'SP-9604',
    vendorId: 'vendor_lagos_01',
    customerName: 'Folake Adeyemi',
    customerPhone: '08091122334',
    customerAddress: 'Surulere, Lagos (Call when near National Stadium)',
    items: [
      {
        id: 'item_3',
        productId: 'prod_2',
        productName: 'Party Jollof & Peppered Turkey Combo',
        price: 6500,
        quantity: 3,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80',
      },
    ],
    totalAmount: 19500,
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

export function getVendorProfile(): VendorProfile {
  if (typeof window === 'undefined') return DEFAULT_VENDOR;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VENDOR);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.VENDOR, JSON.stringify(DEFAULT_VENDOR));
      return DEFAULT_VENDOR;
    }
    const profile: VendorProfile = JSON.parse(data);
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
    localStorage.setItem(STORAGE_KEYS.VENDOR, JSON.stringify(profile));
    // Also update in CRM list
    const crm = getCrmVendors();
    const idx = crm.findIndex((v) => v.id === profile.id || v.phone === profile.phone);
    if (idx >= 0) {
      crm[idx] = profile;
    } else {
      crm.unshift(profile);
    }
    localStorage.setItem(STORAGE_KEYS.CRM_VENDORS, JSON.stringify(crm));
  } catch (e) {
    console.error('Failed to save vendor profile', e);
  }
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

export function getCrmVendors(): VendorProfile[] {
  if (typeof window === 'undefined') return SEED_CRM_VENDORS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CRM_VENDORS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CRM_VENDORS, JSON.stringify(SEED_CRM_VENDORS));
      return SEED_CRM_VENDORS;
    }
    return JSON.parse(data);
  } catch {
    return SEED_CRM_VENDORS;
  }
}

export function updateCrmVendorPlan(vendorId: string, newPlan: UserPlan): void {
  const vendors = getCrmVendors();
  const v = vendors.find((vend) => vend.id === vendorId);
  if (v) {
    v.plan = newPlan;
    if (newPlan === 'pro') {
      v.planExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (newPlan === 'day_pass') {
      v.planExpiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
    } else {
      v.planExpiresAt = undefined;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CRM_VENDORS, JSON.stringify(vendors));
      const current = getVendorProfile();
      if (current.id === vendorId) {
        saveVendorProfile(v);
      }
    }
  }
}

export function getPaystackTransactions(): PaystackTransaction[] {
  if (typeof window === 'undefined') return SEED_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
      return SEED_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_TRANSACTIONS;
  }
}

export function recordPaystackTransaction(
  plan: UserPlan,
  amount: number,
  channel: 'card' | 'bank_transfer' | 'ussd' = 'card'
): PaystackTransaction {
  const profile = getVendorProfile();
  const txs = getPaystackTransactions();
  const newTx: PaystackTransaction = {
    id: `trx_${Date.now()}`,
    reference: `PAY_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
    vendorPhone: profile.phone,
    businessName: profile.businessName,
    plan,
    amount,
    currency: 'NGN',
    status: 'success',
    channel,
    signature: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    paidAt: new Date().toISOString(),
  };

  txs.unshift(newTx);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  }
  return newTx;
}

export function updateVendorPlan(plan: UserPlan, durationHours?: number): VendorProfile {
  const profile = getVendorProfile();
  profile.plan = plan;
  if (durationHours) {
    const expires = new Date(Date.now() + durationHours * 3600 * 1000);
    profile.planExpiresAt = expires.toISOString();
  } else if (plan === 'pro') {
    const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    profile.planExpiresAt = expires.toISOString();
  } else {
    profile.planExpiresAt = undefined;
  }
  saveVendorProfile(profile);
  recordPaystackTransaction(plan, plan === 'day_pass' ? 500 : 2500);
  return profile;
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
  if (typeof window === 'undefined') return SEED_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
      return SEED_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PRODUCTS;
  }
}

export function saveProducts(products: ProductItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
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

export function getOrders(): CustomerOrder[] {
  if (typeof window === 'undefined') return SEED_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(SEED_ORDERS));
      return SEED_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ORDERS;
  }
}

export function saveOrders(orders: CustomerOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders', e);
  }
}

export function createOrder(
  order: Omit<CustomerOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): CustomerOrder {
  const orders = getOrders();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newOrder: CustomerOrder = {
    ...order,
    id: `ord_${Date.now()}`,
    orderNumber: `SP-${randomNum}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  saveOrders(orders);
  recordAnalyticsEvent('order_submitted', { orderNumber: newOrder.orderNumber, total: newOrder.totalAmount });
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: CustomerOrder['status']): void {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveOrders(orders);
    if (status === 'completed') {
      recordAnalyticsEvent('order_completed', { orderId, amount: order.totalAmount });
    }
  }
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
