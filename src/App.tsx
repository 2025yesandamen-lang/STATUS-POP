import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  Store,
  Settings,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Check,
  Flame,
  Wrench,
  Hammer,
  Church,
  ScissorsLineDashed,
  Shirt,
  Utensils,
  Plus,
  Trash2,
  Home,
  Smartphone,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Wand2,
  Sun,
  Sliders,
  RefreshCw,
  X,
  Split,
  Clock,
  Bell,
  MessageCircle,
  CircleUserRound,
} from 'lucide-react';
import {
  FlyerTemplate,
  UserFlyerData,
  ProductItem,
  VendorProfile,
  FlyerAspectRatio,
  SectorCategory,
  UserPlan,
} from './types/index.ts';
import { TEMPLATES } from './lib/templates.ts';
import { formatNaira, calculateDiscount } from './lib/format.ts';
import {
  downscaleImage,
  removeBackground,
  autoProcessProductPhoto,
  enhanceBadCameraPhoto,
  applyStudioBackdrop,
  EnhancementStats,
  StudioBackdropStyle,
} from './lib/imageProcessing.ts';
import {
  checkDailyReminderTrigger,
  markDailyReminderDelivered,
  snoozeDailyReminder,
  sendBrowserPushNotification,
} from './lib/reminderScheduler.ts';
import {
  getVendorProfile,
  getProducts,
  synchronizeAccountData,
  clearAccountDataCache,
  recordFlyerCreated,
  recordWhatsAppDpCreated,
  setReferralCookie,
} from './lib/storage.ts';

// UI Components
import { Button } from './components/ui/Button.tsx';
import { Card } from './components/ui/Card.tsx';
import { Stepper, Step } from './components/ui/Stepper.tsx';
import { ToastProvider, useToast } from './components/ui/Toast.tsx';
import { CopyPanel } from './components/editor/CopyPanel.tsx';
import { ExportBar } from './components/editor/ExportBar.tsx';
import { AccountAccessModal } from './components/account/AccountAccessModal.tsx';
const FlyerCanvas = lazy(() => import('./components/editor/FlyerCanvas.tsx').then((module) => ({ default: module.FlyerCanvas })));
const PricingModal = lazy(() => import('./components/pricing/PricingModal.tsx').then((module) => ({ default: module.PricingModal })));
const PublicShop = lazy(() => import('./components/shop/PublicShop.tsx').then((module) => ({ default: module.PublicShop })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard.tsx').then((module) => ({ default: module.AdminDashboard })));
const TemplateBrowser = lazy(() => import('./components/dev/TemplateBrowser.tsx').then((module) => ({ default: module.TemplateBrowser })));
import { HomePage } from './components/home/HomePage.tsx';
const SpecialEventsPage = lazy(() => import('./components/events/SpecialEventsPage.tsx').then((module) => ({ default: module.SpecialEventsPage })));
const WhatsAppDPGenerator = lazy(() => import('./components/dp/WhatsAppDPGenerator.tsx').then((module) => ({ default: module.WhatsAppDPGenerator })));
import { MiniProfileExplainerModal } from './components/vendor/MiniProfileExplainerModal.tsx';

const STEPS: Step[] = [
  { id: 1, title: 'Upload Photos', shortTitle: '1. Photos' },
  { id: 2, title: 'Product Details', shortTitle: '2. Details' },
  { id: 3, title: 'Style & Share', shortTitle: '3. Style' },
];

// 1-Tap Sector Presets
const SECTOR_PRESETS: Record<string, {
  name: string;
  templateId: string;
  productName: string;
  subtitle: string;
  price: number;
  oldPrice: number;
  category: string;
  sector: SectorCategory;
  photos: string[];
}> = {
  mechanic: {
    name: 'Auto Mechanic',
    templateId: 'mechanic-auto-01',
    productName: 'Tokunbo V6 Engine & Computer OBD Scanning',
    subtitle: 'Tested Tokunbo • 6 Months Warranty • Same Day Fix',
    price: 350000,
    oldPrice: 400000,
    category: 'Auto Repair',
    sector: 'mechanic',
    photos: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80',
    ],
  },
  artisan: {
    name: 'Artisan & AC Repair',
    templateId: 'artisan-craft-01',
    productName: 'AC Servicing, Gas Top-up & Inverter Setup',
    subtitle: '1 Hour Rapid Response • Certified Tech • Lagos Island & Mainland',
    price: 18000,
    oldPrice: 25000,
    category: 'Home Service',
    sector: 'artisan',
    photos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    ],
  },
  church: {
    name: 'Church & Praise',
    templateId: 'church-service-01',
    productName: 'Sunday Praise & Miracle Breakthrough Service',
    subtitle: '8:00 AM & 10:30 AM • Powerful Worship & Deliverance',
    price: 0,
    oldPrice: 0,
    category: 'Church & Ministry',
    sector: 'church',
    photos: [
      'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80',
    ],
  },
  barber: {
    name: 'Barber & Salon',
    templateId: 'barber-salon-01',
    productName: 'Executive Skin Fade + Beard Grooming + Facial',
    subtitle: 'Strict Sanitization • VIP Lounge • Complimentary Drinks',
    price: 12000,
    oldPrice: 15000,
    category: 'Barbing & Grooming',
    sector: 'barber',
    photos: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
    ],
  },
  thrift: {
    name: 'Thrift Bales',
    templateId: 'multi-grid-04',
    productName: 'Grade-A Vintage Jackets, Hoodies & Jeans',
    subtitle: 'First to Pay Na Owner • Direct UK Bale Open',
    price: 8000,
    oldPrice: 12000,
    category: 'Thrift & Okrika',
    sector: 'thrift',
    photos: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    ],
  },
  fashion: {
    name: 'Thrift & Fashion',
    templateId: 'new-arrival-01',
    productName: 'Pleated Office Midi Dress & Luxury Heels',
    subtitle: 'High Grade UK Import • Size 10-18 Available',
    price: 22000,
    oldPrice: 30000,
    category: 'Boutique Fashion',
    sector: 'fashion',
    photos: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
    ],
  },
};

function MainContent() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const publicShopSlug = typeof window === 'undefined'
    ? null
    : window.location.pathname.match(/^\/shop\/([a-z0-9-]+)\/?$/i)?.[1]?.toLowerCase() ?? null;

  // App navigation state: default is 'home' so users see the rich landing banner first
  const [currentView, setCurrentView] = useState<'home' | 'create' | 'shop' | 'admin' | 'dev_templates' | 'events' | 'whatsapp_dp'>(() => publicShopSlug ? 'shop' : 'home');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Vendor & storage state
  const [vendor, setVendor] = useState<VendorProfile>(getVendorProfile());
  const [products, setProducts] = useState<ProductItem[]>(getProducts());
  const [publicShop, setPublicShop] = useState<{ vendor: VendorProfile; products: ProductItem[] } | null>(null);
  const [publicShopError, setPublicShopError] = useState<string | null>(null);
  const [isLoadingPublicShop, setIsLoadingPublicShop] = useState(Boolean(publicShopSlug));
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [isMiniProfileModalOpen, setIsMiniProfileModalOpen] = useState(false);
  const activePlan: UserPlan =
    vendor.plan === 'pro' ||
    (vendor.plan === 'day_pass' &&
      Boolean(vendor.planExpiresAt && Date.parse(vendor.planExpiresAt) > Date.now()))
      ? vendor.plan
      : 'free';

  useEffect(() => {
    if (vendor.plan !== 'day_pass' || !vendor.planExpiresAt) return;
    const expiresAt = new Date(vendor.planExpiresAt).getTime();
    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      setVendor((current) => ({ ...current, plan: 'free', planExpiresAt: undefined }));
      return;
    }
    const timeout = window.setTimeout(() => {
      setVendor((current) => ({ ...current, plan: 'free', planExpiresAt: undefined }));
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [vendor.plan, vendor.planExpiresAt]);

  useEffect(() => {
    if (!publicShopSlug) return;
    let cancelled = false;
    const loadPublicShop = async () => {
      try {
        const response = await fetch(`/api/public/shop/${encodeURIComponent(publicShopSlug)}`);
        if (!response.ok) {
          const payload = await response.json() as { message?: string };
          throw new Error(payload.message || 'Unable to load this shop.');
        }
        const data = await response.json() as { vendor: VendorProfile; products: ProductItem[] };
        if (!cancelled) setPublicShop(data);
      } catch (error) {
        if (!cancelled) {
          setPublicShopError(error instanceof Error ? error.message : 'Unable to load this shop.');
        }
      } finally {
        if (!cancelled) setIsLoadingPublicShop(false);
      }
    };
    void loadPublicShop();
    return () => {
      cancelled = true;
    };
  }, [publicShopSlug]);

  useEffect(() => {
    let cancelled = false;
    const syncEntitlement = async () => {
      try {
        const initialSession = await fetch('/api/vendor/session', { credentials: 'same-origin' });
        if (!initialSession.ok) return;
        const initialAccount = await initialSession.json() as {
          authenticated?: boolean;
          email?: string;
          plan?: UserPlan;
          planExpiresAt?: string | null;
        };
        if (!initialAccount.authenticated) {
          if (new URLSearchParams(window.location.search).has('payment_reference') && !cancelled) {
            setIsAccountOpen(true);
            showToast('Sign in required', 'Sign in to the account used for checkout so we can verify the payment.', 'info');
          }
          return;
        }
        const accountData = await synchronizeAccountData();
        if (!cancelled) {
          setIsAuthenticated(true);
          setAccountEmail(initialAccount.email || '');
          setVendor({
            ...accountData.profile,
            plan: initialAccount.plan === 'pro' || initialAccount.plan === 'day_pass' ? initialAccount.plan : 'free',
            planExpiresAt: initialAccount.planExpiresAt || undefined,
          });
          setProducts(accountData.products);
        }
        const params = new URLSearchParams(window.location.search);
        const reference = params.get('payment_reference');
        if (reference) {
          let paymentStatus = 'pending';
          for (let attempt = 0; attempt < 8; attempt += 1) {
            const response = await fetch(`/api/payments/verify/${encodeURIComponent(reference)}`, { credentials: 'same-origin' });
            if (!response.ok) throw new Error('Payment is still being verified.');
            const verification = await response.json();
            paymentStatus = verification.paymentStatus;
            if (paymentStatus !== 'pending') break;
            await new Promise((resolve) => window.setTimeout(resolve, 2500));
          }
          if (paymentStatus === 'success') {
            showToast('Payment verified', 'Your plan is active on your account.', 'success');
          } else if (paymentStatus === 'failed') {
            showToast('Payment not completed', 'No paid plan was activated.', 'error');
          } else {
            showToast('Payment pending', 'Your plan will update after Paystack confirms payment. Refresh to check again.', 'info');
          }
          if (paymentStatus !== 'pending') {
            params.delete('payment_reference');
            const query = params.toString();
            window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
          }
        }
        const sessionResponse = await fetch('/api/vendor/session', { credentials: 'same-origin' });
        if (!sessionResponse.ok) return;
        const session = await sessionResponse.json();
        if (!cancelled) {
          setVendor((current) => ({
            ...current,
            plan: session.plan === 'pro' || session.plan === 'day_pass' ? session.plan : 'free',
            planExpiresAt: session.planExpiresAt || undefined,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Could not refresh vendor account:', error);
          showToast('Account sync unavailable', 'Your local draft remains available; try signing in again to sync.', 'error');
        }
      }
    };
    void syncEntitlement();
    return () => { cancelled = true; };
  }, [showToast]);

  const handleAccountAuthenticated = (account: {
    email: string;
    profile: VendorProfile;
    products: ProductItem[];
    plan: UserPlan;
    planExpiresAt?: string;
  }) => {
    setIsAuthenticated(true);
    setAccountEmail(account.email);
    setVendor({ ...account.profile, plan: account.plan, planExpiresAt: account.planExpiresAt });
    setProducts(account.products);
  };

  const handleAccountSignedOut = () => {
    clearAccountDataCache();
    setIsAuthenticated(false);
    setAccountEmail('');
    setVendor(getVendorProfile());
    setProducts([]);
  };

  // Image processing state
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgRemovalProgress, setBgRemovalProgress] = useState(0);
  const [isAutoProcessingPhoto, setIsAutoProcessingPhoto] = useState<boolean>(false);
  const [autoProcessStep, setAutoProcessStep] = useState<string>('');
  const [lastEnhancementStats, setLastEnhancementStats] = useState<EnhancementStats | null>(null);
  const [showBeforeAfterModal, setShowBeforeAfterModal] = useState<boolean>(false);
  const [selectedStudioBackdrop, setSelectedStudioBackdrop] = useState<StudioBackdropStyle>('transparent');

  // AI Vision Auto-Detect Product State
  const [isDetectingProductAI, setIsDetectingProductAI] = useState<boolean>(false);

  // Daily 8:00 AM WhatsApp Status Reminder State
  const [showDailyReminderPrompt, setShowDailyReminderPrompt] = useState<boolean>(false);

  // Daily Status Posting Scheduler (8:00 AM check)
  useEffect(() => {
    const checkReminder = () => {
      if (checkDailyReminderTrigger(vendor)) {
        setShowDailyReminderPrompt(true);
        sendBrowserPushNotification(
          '🔔 StatusPop 8:00 AM Reminder',
          `Good morning, ${vendor.businessName}! It's peak WhatsApp Status viewing time. Post today's hot deal now!`
        );
      }
    };

    // Check on initial load
    checkReminder();

    // Check every 30 seconds
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, [vendor]);

  // Flyer data state with 1 to 4 photo support
  const [flyerData, setFlyerData] = useState<UserFlyerData>({
    productName: 'Air Max 90 OG Neon Sneakers',
    headline: 'MASSIVE CLEARANCE SALE!',
    subtitle: 'Tested London Used • Free Delivery In Lagos',
    price: 32000,
    oldPrice: 40000,
    discountPct: 20,
    businessName: vendor.businessName,
    phone: vendor.phone,
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    productImages: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    ],
    hasRemovedBg: false,
    aspectRatio: '9:16',
    selectedTemplateId: 'bold-sale-01',
    sector: 'fashion',
    category: 'Fashion',
    multiProductMode: 'single_multi_view',
    multiProducts: [
      { name: 'Samsung Galaxy S23 Ultra', price: 420000, badge: 'UK Used' },
      { name: 'iPhone 14 Pro 128GB', price: 680000, badge: 'Battery 92%' },
      { name: 'Tecno Camon 30 Pro', price: 215000, badge: 'Brand New' },
      { name: 'Itel A70 256GB', price: 82000, badge: 'Budget Star' },
    ],
  });

  // Persistent sticky preview window controls
  const [previewScaleMode, setPreviewScaleMode] = useState<'normal' | 'compact'>('normal');
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState<boolean>(false);

  // Check URL params for referral code (/r/:code?src=qr or caption)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      const src = (params.get('src') as 'qr' | 'caption') || 'direct';
      if (ref) {
        setReferralCookie(ref, src);
        showToast('Welcome!', `Referred by partner code: ${ref} (via ${src.toUpperCase()})`, 'info');
      }
    }
  }, [showToast]);

  const selectedTemplate =
    TEMPLATES.find((t) => t.id === flyerData.selectedTemplateId && (!t.isProOnly || activePlan !== 'free')) ||
    TEMPLATES.find((t) => !t.isProOnly) ||
    TEMPLATES[0];

  // Transition from Home to Create flow
  const handleStartCreate = (sectorPresetKey?: string) => {
    if (sectorPresetKey && SECTOR_PRESETS[sectorPresetKey]) {
      const preset = SECTOR_PRESETS[sectorPresetKey];
      setFlyerData((prev) => ({
        ...prev,
        productName: preset.productName,
        subtitle: preset.subtitle,
        price: preset.price,
        oldPrice: preset.oldPrice,
        discountPct: calculateDiscount(preset.price, preset.oldPrice),
        selectedTemplateId: preset.templateId,
        category: preset.category,
        sector: preset.sector,
        productImages: preset.photos,
        productImage: preset.photos[0],
        hasRemovedBg: false,
      }));
      showToast(`${preset.name} Preset Loaded!`, 'Ready to customize in 10 seconds.', 'success');
    }
    setCurrentView('create');
    setCurrentStep(1);
  };

  // Master Automatic Bad-Camera Enhancement & Background Removal Handler
  const handleImageFile = async (file: File) => {
    try {
      setIsAutoProcessingPhoto(true);
      setAutoProcessStep('1/2: Optimizing for mobile speed...');

      showToast(
        '✨ Enhancing Photo...',
        'Improving lighting and color while keeping your original background.',
        'info'
      );

      const result = await autoProcessProductPhoto(file, (step) => {
        setAutoProcessStep(step);
      });

      setLastEnhancementStats(result.stats);

      setFlyerData((prev) => {
        const currentList = [...(prev.productImages || [])];
        const enhancedList = [...(prev.enhancedOriginalImages || [])];
        const cutoutList = [...(prev.cleanCutoutImages || [])];

        if (currentList.length >= 4) {
          currentList[0] = result.activeImage;
          enhancedList[0] = result.enhancedPhoto;
          cutoutList[0] = result.cleanCutout;
        } else {
          currentList.push(result.activeImage);
          enhancedList.push(result.enhancedPhoto);
          cutoutList.push(result.cleanCutout);
        }

        return {
          ...prev,
          productImage: currentList[0],
          productImages: currentList,
          enhancedOriginalImage: enhancedList[0],
          enhancedOriginalImages: enhancedList,
          cleanCutoutImage: cutoutList[0],
          cleanCutoutImages: cutoutList,
          hasRemovedBg: result.hasRemovedBg,
        };
      });

      showToast(
        '✨ Auto-Enhanced Sharp Sharp!',
        'Lighting and colors improved. Your photo background was kept.',
        'success'
      );
    } catch (err) {
      console.error('Photo processing error:', err);
      showToast('Upload Error', 'Could not process photo file. Please try another.', 'error');
    } finally {
      setIsAutoProcessingPhoto(false);
      setAutoProcessStep('');
    }
  };

  const removePhotoFromTray = (index: number) => {
    setFlyerData((prev) => {
      const updated = prev.productImages.filter((_, i) => i !== index);
      const updatedEnhanced = (prev.enhancedOriginalImages || []).filter((_, i) => i !== index);
      const updatedCutout = (prev.cleanCutoutImages || []).filter((_, i) => i !== index);
      return {
        ...prev,
        productImages: updated,
        productImage: updated[0] || null,
        enhancedOriginalImages: updatedEnhanced,
        enhancedOriginalImage: updatedEnhanced[0] || null,
        cleanCutoutImages: updatedCutout,
        cleanCutoutImage: updatedCutout[0] || null,
      };
    });
    showToast('Photo Removed', 'Slot cleared.', 'info');
  };

  // Background removal toggle (switch between Clean Cutout vs Enhanced Original Photo)
  const handleToggleRemoveBg = async () => {
    if (!flyerData.productImage) {
      showToast('No Photo', 'Upload a product photo first!', 'info');
      return;
    }

    if (flyerData.hasRemovedBg) {
      // Switch back to naturally enhanced original photo
      const enhancedOriginal = flyerData.enhancedOriginalImage || flyerData.productImage;
      setFlyerData((prev) => {
        const updatedList = [...prev.productImages];
        updatedList[0] = enhancedOriginal;
        return {
          ...prev,
          productImage: enhancedOriginal,
          productImages: updatedList,
          hasRemovedBg: false,
        };
      });
      showToast('Enhanced Photo Active', 'Showing original background with boosted lighting.', 'info');
      return;
    }

    // Switch to clean cutout
    if (flyerData.cleanCutoutImage) {
      const cutout = flyerData.cleanCutoutImage;
      setFlyerData((prev) => {
        const updatedList = [...prev.productImages];
        updatedList[0] = cutout;
        return {
          ...prev,
          productImage: cutout,
          productImages: updatedList,
          hasRemovedBg: true,
        };
      });
      showToast('Clean Cutout Active!', 'Background removed sharp sharp.', 'success');
      return;
    }

    setIsProcessingBg(true);
    setBgRemovalProgress(20);

    const result = await removeBackground(flyerData.productImage, (progress) => {
      setBgRemovalProgress(progress);
    });

    setIsProcessingBg(false);

    if (result.success) {
      setFlyerData((prev) => {
        const updatedList = [...prev.productImages];
        updatedList[0] = result.dataUrl;
        return {
          ...prev,
          productImage: result.dataUrl,
          productImages: updatedList,
          cleanCutoutImage: result.dataUrl,
          hasRemovedBg: true,
        };
      });
      showToast('Sharp sharp!', result.message, 'success');
    } else {
      showToast('No wahala!', 'Keeping your clean photo sharp sharp.', 'info');
    }
  };

  // Apply Studio Backdrop to Clean Cutout
  const handleApplyStudioBackdrop = async (style: StudioBackdropStyle) => {
    const baseCutout = flyerData.cleanCutoutImage || flyerData.productImage;
    if (!baseCutout) {
      showToast('No Cutout Found', 'Upload a product photo first!', 'info');
      return;
    }

    setSelectedStudioBackdrop(style);

    if (style === 'transparent') {
      setFlyerData((prev) => {
        const updatedList = [...prev.productImages];
        updatedList[0] = baseCutout;
        return {
          ...prev,
          productImage: baseCutout,
          productImages: updatedList,
          hasRemovedBg: true,
        };
      });
      showToast('Backdrop: Transparent', 'Clean cutout active.', 'info');
      return;
    }

    try {
      showToast('Styling Studio Backdrop...', 'Rendering studio lighting & shadow.', 'info');
      const backed = await applyStudioBackdrop(baseCutout, style);
      setFlyerData((prev) => {
        const updatedList = [...prev.productImages];
        updatedList[0] = backed;
        return {
          ...prev,
          productImage: backed,
          productImages: updatedList,
          hasRemovedBg: true,
        };
      });
      showToast('Studio Backdrop Applied!', 'Ready for flyer.', 'success');
    } catch {
      showToast('Notice', 'Could not apply backdrop, using clean cutout.', 'info');
    }
  };

  // Free AI Vision Auto-Detect Product Feature
  const handleMagicAIDetect = async () => {
    const photoToScan = flyerData.enhancedOriginalImage || flyerData.productImage;
    if (!photoToScan) {
      showToast('No Photo Found', 'Upload or snap a product photo first in Step 1!', 'info');
      return;
    }

    setIsDetectingProductAI(true);
    showToast('🪄 Free AI Scanning...', 'Reading product photo, estimating price & category.', 'info');

    try {
      const response = await fetch('/api/vision-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photoToScan }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const d = result.data;
          setFlyerData((prev) => ({
            ...prev,
            productName: d.productName || prev.productName,
            category: d.category || prev.category,
            price: d.estimatedPriceNgn || prev.price,
            oldPrice: d.oldPriceNgn || prev.oldPrice,
            discountPct: calculateDiscount(d.estimatedPriceNgn || prev.price, d.oldPriceNgn || prev.oldPrice),
            headline: d.headline || prev.headline,
            subtitle: d.subtitle || prev.subtitle,
          }));

          showToast(
            '🪄 Product Auto-Detected!',
            `Found: ${d.productName} • Estimated ₦${(d.estimatedPriceNgn || 0).toLocaleString('en-NG')}`,
            'success'
          );
          return;
        }
      }
      showToast('AI Busy', 'Filled with smart retail defaults.', 'info');
    } catch (err) {
      console.warn('Vision detection error:', err);
      showToast('Offline Mode', 'Keeping current product details.', 'info');
    } finally {
      setIsDetectingProductAI(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#FFF9EC] dark:bg-[#0F1318] text-[#111827] dark:text-[#F9FAFB] flex flex-col font-sans">
      {/* Top Navbar matching the reference design */}
      {!publicShopSlug && <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#1A202C]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Home button if not on Home view */}
            {currentView !== 'home' && (
              <button
                onClick={() => setCurrentView('home')}
                className="tap-target px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-[#0B6B3A] hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5 border border-gray-200 dark:border-gray-700"
                title="Return to Home"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
            )}

            <div
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0B6B3A] text-white flex items-center justify-center font-black shadow-sm text-sm">
                SP
              </div>
              <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white">
                StatusPop
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Template Gallery Link */}
            <button
              onClick={() => setCurrentView('dev_templates')}
              className="tap-target px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <span>{TEMPLATES.length} Templates 📐</span>
            </button>

            {/* Go Pro Button */}
            <button
              onClick={() => setIsPricingOpen(true)}
              className="tap-target px-3 py-1.5 text-xs font-bold rounded-xl bg-[#FFC93C]/25 text-[#0B6B3A] dark:text-[#FFC93C] border border-[#FFC93C]/60 flex items-center gap-1 hover:bg-[#FFC93C]/40 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Go Pro</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAccountOpen(true)}
              className="tap-target p-2 rounded-xl border bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors"
              title={isAuthenticated ? `Account: ${accountEmail}` : 'Sign in or create an account'}
              aria-label={isAuthenticated ? 'Open account settings' : 'Sign in or create an account'}
            >
              <CircleUserRound className="w-4 h-4 text-[#0B6B3A]" />
            </button>

            {/* WhatsApp DP Creator button */}
            <button
              onClick={() => setCurrentView(currentView === 'whatsapp_dp' ? 'home' : 'whatsapp_dp')}
              className={`tap-target px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1 ${
                currentView === 'whatsapp_dp'
                  ? 'bg-[#0B6B3A] text-white border-transparent'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50 hover:bg-emerald-100'
              }`}
              title="Design WhatsApp Profile Picture (DP) with Services"
            >
              <span>🟢</span>
              <span className="hidden sm:inline">WhatsApp DP</span>
              <span className="sm:hidden">DP</span>
            </button>

            {/* Events button */}
            <button
              onClick={() => setCurrentView(currentView === 'events' ? 'home' : 'events')}
              className={`tap-target px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1 ${
                currentView === 'events'
                  ? 'bg-[#0B6B3A] text-white border-transparent'
                  : 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700/50 hover:bg-yellow-100'
              }`}
              title="Nigerian Holiday & Special Event Flyers"
            >
              <span>🎉</span>
              <span className="hidden sm:inline">Events</span>
            </button>

            {/* Create Flyer primary CTA button */}
            {currentView !== 'create' ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleStartCreate()}
                className="font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs"
              >
                Create Flyer
              </Button>
            ) : (
              <button
                onClick={() => setCurrentView('home')}
                className="tap-target px-3 py-1.5 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              >
                View Home
              </button>
            )}

            {/* Mini-Store & Profile */}
            <button
              onClick={() => setIsMiniProfileModalOpen(true)}
              className="tap-target p-2 rounded-xl border bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
              title="How Mini Profile & Store Works"
            >
              <Store className="w-4 h-4 text-[#0B6B3A]" />
            </button>

            {/* Local demo dashboard only; production admin access requires server authentication. */}
            <button
              onClick={() => setCurrentView(currentView === 'admin' ? 'home' : 'admin')}
              className={`tap-target p-2 rounded-xl border transition-colors ${
                currentView === 'admin'
                  ? 'bg-[#0B6B3A] text-white border-transparent'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
              title="Admin Dashboard"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>}

      {/* Main View Router */}
      <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-gray-500" role="status">Loading…</div>}>
      {publicShopSlug ? (
        isLoadingPublicShop ? (
          <div className="flex min-h-screen items-center justify-center text-sm text-gray-500" role="status">Loading shop…</div>
        ) : publicShopError || !publicShop ? (
          <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center dark:bg-[#0F1318]">
            <div className="max-w-md">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Shop unavailable</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {publicShopError || 'This shop could not be found.'}
              </p>
              <a href="/" className="mt-5 inline-block rounded-xl bg-[#0B6B3A] px-4 py-2 text-sm font-bold text-white">
                Visit StatusPop
              </a>
            </div>
          </main>
        ) : (
          <PublicShop vendor={publicShop.vendor} products={publicShop.products} />
        )
      ) : currentView === 'home' ? (
        <HomePage
          userPlan={activePlan}
          onStartCreate={(sectorKey) => handleStartCreate(sectorKey)}
          onOpenPricing={() => setIsPricingOpen(true)}
          onOpenTemplates={() => setCurrentView('dev_templates')}
          onOpenShop={() => setCurrentView('shop')}
          showAdmin
          onOpenAdmin={() => setCurrentView('admin')}
          onOpenPhoneLock={() => isAuthenticated ? setIsMiniProfileModalOpen(true) : setIsAccountOpen(true)}
          onOpenEvents={() => setCurrentView('events')}
          onOpenDP={() => setCurrentView('whatsapp_dp')}
          onOpenMiniProfileModal={() => setIsMiniProfileModalOpen(true)}
        />
      ) : currentView === 'whatsapp_dp' ? (
        <WhatsAppDPGenerator
          userPlan={activePlan}
          vendor={vendor}
          onBack={() => setCurrentView('home')}
          onOpenPricing={() => setIsPricingOpen(true)}
          onRecordExport={() => {
            const result = recordWhatsAppDpCreated(activePlan);
            if (!result.canCreate) return false;
            if (activePlan === 'free') {
              setVendor((current) => ({
                ...current,
                whatsappDpsCreatedTotal: Math.min(2, current.whatsappDpsCreatedTotal + 1),
              }));
            }
            return true;
          }}
        />
      ) : currentView === 'events' ? (
        <SpecialEventsPage
          userPlan={activePlan}
          vendor={vendor}
          onBack={() => setCurrentView('home')}
          onOpenPricing={() => setIsPricingOpen(true)}
        />
      ) : currentView === 'shop' ? (
        <PublicShop
          vendor={vendor}
          products={products}
          onBackToApp={() => setCurrentView('home')}
          onSelectProductForFlyer={(p) => {
            setFlyerData((prev) => ({
              ...prev,
              productName: p.name,
              price: p.price,
              oldPrice: p.originalPrice,
              discountPct: calculateDiscount(p.price, p.originalPrice),
              productImage: p.image,
              productImages: [p.image],
              category: p.category,
              hasRemovedBg: false,
            }));
            setCurrentView('create');
            setCurrentStep(2);
          }}
        />
      ) : currentView === 'admin' ? (
        <AdminDashboard onBack={() => setCurrentView('home')} />
      ) : currentView === 'dev_templates' ? (
        <TemplateBrowser
          onBack={() => setCurrentView('home')}
          userPlan={activePlan}
          onOpenUpgrade={() => setIsPricingOpen(true)}
          onSelectTemplate={(tmpl) => {
            if (tmpl.isProOnly && activePlan === 'free') {
              setIsPricingOpen(true);
              return;
            }
            setFlyerData((prev) => ({ ...prev, selectedTemplateId: tmpl.id }));
            setCurrentView('create');
            setCurrentStep(3);
          }}
        />
      ) : (
        /* Create Flyer 3-Step Creation Studio */
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-4 space-y-4 pb-24">
          {/* One-time Free Trial Usage Alert */}
          {activePlan === 'free' && (
            <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1A202C] rounded-2xl border border-[#FFC93C]/50 shadow-xs text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF5A36] shrink-0" />
                <span>
                  Free trial: <strong>{Math.min(vendor.flyersCreatedTotal, 5)}/5</strong> flyers used
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPricingOpen(true)}
                className="tap-target font-bold text-[#0B6B3A] dark:text-[#FFC93C] underline px-1"
              >
                Unlock paid plans
              </button>
            </div>
          )}

          {/* Scrollable studio grid: editor controls stay above the preview on small screens. */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
            {/* Live preview follows the controls on mobile and sits beside them on desktop. */}
            <div className="order-2 lg:order-1 lg:col-span-5 xl:col-span-5">
              <div className="bg-white/95 dark:bg-[#1A202C]/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden transition-all">
                {/* Preview Header Bar */}
                <div className="px-3.5 py-2.5 bg-gray-50/90 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0B6B3A]"></span>
                    </span>
                    <span className="text-xs font-black tracking-wide text-gray-900 dark:text-white uppercase truncate">
                      Live Preview
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/70 dark:bg-gray-700/70 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                      {selectedTemplate.name}
                    </span>
                  </div>

                  {/* Header actions: Ratio pills + View Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Aspect Ratio Pills */}
                    <div className="flex items-center bg-gray-200/80 dark:bg-gray-700/80 p-0.5 rounded-lg text-[10px] font-bold">
                      {(['9:16', '1:1', '4:5'] as FlyerAspectRatio[]).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setFlyerData((prev) => ({ ...prev, aspectRatio: ratio }))}
                          className={`px-1.5 py-0.5 rounded-md transition-colors ${
                            flyerData.aspectRatio === ratio
                              ? 'bg-[#0B6B3A] text-white shadow-xs'
                              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                          }`}
                          title={`Switch to ${ratio}`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>

                    {/* Scale Size Toggle for Mobile */}
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewScaleMode((prev) => (prev === 'normal' ? 'compact' : 'normal'))
                      }
                      className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-700/60"
                      title={previewScaleMode === 'normal' ? 'Compact Preview' : 'Standard Preview'}
                    >
                      {previewScaleMode === 'normal' ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Mobile Collapse/Expand Eye Button */}
                    <button
                      type="button"
                      onClick={() => setIsPreviewCollapsed((prev) => !prev)}
                      className="lg:hidden p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-700/60"
                      title={isPreviewCollapsed ? 'Show Preview' : 'Hide Preview'}
                    >
                      {isPreviewCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Canvas Body */}
                {!isPreviewCollapsed && (
                  <div className="p-3 bg-neutral-900/90 dark:bg-black flex flex-col items-center justify-center relative overflow-hidden transition-all">
                    <div className="relative flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-white/10 transition-transform duration-200">
                      <FlyerCanvas
                        template={selectedTemplate}
                        userData={flyerData}
                        scale={
                          typeof window !== 'undefined' && window.innerWidth >= 1024
                            ? flyerData.aspectRatio === '1:1' ? 0.30 : flyerData.aspectRatio === '4:5' ? 0.27 : 0.25
                            : previewScaleMode === 'compact'
                            ? flyerData.aspectRatio === '1:1' ? 0.18 : flyerData.aspectRatio === '4:5' ? 0.16 : 0.14
                            : flyerData.aspectRatio === '1:1' ? 0.24 : flyerData.aspectRatio === '4:5' ? 0.21 : 0.18
                        }
                        showWatermark={activePlan === 'free'}
                        referralCode={vendor.referralCode}
                      />
                    </div>

                    {/* Footer info & jump-to-export link */}
                    <div className="w-full mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-300">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold truncate">
                        <Check className="w-3 h-3 shrink-0" />
                        Updates live as you type & upload
                      </span>

                      {currentStep !== 3 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="font-bold text-[#FFC93C] hover:underline flex items-center gap-0.5 shrink-0"
                        >
                          Export Now <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-gray-400 shrink-0">1080p HD Ready</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CONTROLS COLUMN (Scrollable on right or below) */}
            <div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-7 space-y-4">
              {/* Stepper Navigation */}
              <Card padding="sm">
                <Stepper
                  steps={STEPS}
                  currentStep={currentStep}
                  onStepClick={(stepId) => setCurrentStep(stepId)}
                />
              </Card>

          {/* STEP 1: Upload Photos (1 to 4 slots) */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center py-1">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  Add Your Product Photos (1 to 4)
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Snap with your phone camera or upload from gallery. Works on all Android phones!
                </p>
              </div>

              {/* 4-Slot Photo Tray */}
              <div className="bg-white dark:bg-[#1A202C] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                  <span>Your Photo Tray ({flyerData.productImages?.length || 0}/4 Slots)</span>
                  <span className="text-[11px] text-gray-500 font-normal">
                    Slot 1 is your hero picture
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const photo = flyerData.productImages?.[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        className={`aspect-square rounded-xl border-2 border-dashed relative flex flex-col items-center justify-center overflow-hidden transition-all ${
                          photo
                            ? 'border-[#0B6B3A] bg-gray-50 dark:bg-gray-800'
                            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 bg-gray-50/50 dark:bg-gray-800/40'
                        }`}
                      >
                        {photo ? (
                          <>
                            <img
                              src={photo}
                              alt={`Slot ${slotIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhotoFromTray(slotIdx)}
                              className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Slot {slotIdx + 1}
                            </span>
                          </>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer text-center p-1"
                          >
                            <Plus className="w-5 h-5 text-gray-400 mx-auto" />
                            <span className="text-[10px] text-gray-400 font-semibold block">
                              Add {slotIdx + 1}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Auto-Processing Progress Alert */}
                {isAutoProcessingPhoto && (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-500/15 via-amber-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-2xl animate-pulse flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0B6B3A] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 animate-spin text-[#FFC93C]" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                        {autoProcessStep || 'Enhancing your photo...'}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        Improving lighting and color; your original background stays intact.
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                    }}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    onClick={() => cameraInputRef.current?.click()}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Take Photo
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    Upload Gallery
                  </Button>
                </div>

                {/* Auto Enhancement Success Controls & Studio Backdrops */}
                {flyerData.productImage && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#0B6B3A] dark:text-emerald-400">
                          <Sparkles className="w-4 h-4 text-[#FFC93C]" />
                          <span>✨ Auto-Enhanced & Bad Camera Fixed</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowBeforeAfterModal(true)}
                          className="text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 underline underline-offset-2"
                        >
                          <Split className="w-3 h-3" />
                          <span>Compare Before & After</span>
                        </button>
                      </div>

                      {/* Mode Switcher: Clean Cutout vs Enhanced Original */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!flyerData.hasRemovedBg) handleToggleRemoveBg();
                          }}
                          className={`tap-target p-2 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                            flyerData.hasRemovedBg
                              ? 'bg-[#0B6B3A] text-white border-transparent shadow-xs'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>✂️ Clean Cutout</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (flyerData.hasRemovedBg) handleToggleRemoveBg();
                          }}
                          className={`tap-target p-2 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                            !flyerData.hasRemovedBg
                              ? 'bg-[#0B6B3A] text-white border-transparent shadow-xs'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          <span>📸 Enhanced Photo</span>
                        </button>
                      </div>

                      {/* Studio Backdrop Styles (When in Cutout Mode) */}
                      {flyerData.hasRemovedBg && (
                        <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40 space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                            Cutout Studio Backdrop:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { id: 'transparent', label: '✨ Transparent' },
                              { id: 'studio_white', label: '⬜ Studio White' },
                              { id: 'soft_shadow', label: '☁️ Soft Gray' },
                              { id: 'lagos_glow', label: '🌇 Lagos Sunset' },
                              { id: 'charcoal_luxury', label: '🖤 Luxury Dark' },
                            ].map((bd) => (
                              <button
                                key={bd.id}
                                type="button"
                                onClick={() => handleApplyStudioBackdrop(bd.id as StudioBackdropStyle)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  selectedStudioBackdrop === bd.id
                                    ? 'bg-[#0B6B3A] text-white border-transparent shadow-xs'
                                    : 'bg-white/80 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-500'
                                }`}
                              >
                                {bd.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setCurrentStep(2)}
                rightIcon={<ChevronRight className="w-5 h-5" />}
              >
                Next: Enter Product & Price Details
              </Button>
            </div>
          )}

          {/* STEP 2: Product & Service Details */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center py-1">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  Product / Service & Pricing
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Nigerian buyers love clear Naira prices and contact hotlines!
                </p>
              </div>

              {/* 1-Tap Free AI Auto-Detect Product Card */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-[#0B6B3A]/10 dark:from-amber-950/30 dark:to-emerald-950/30 rounded-2xl border-2 border-[#FFC93C]/50 shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Wand2 className="w-4 h-4 text-emerald-950" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span>🪄 Magic Free AI Auto-Detect</span>
                        <span className="text-[9px] bg-[#FF5A36] text-white px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">
                          1-Tap
                        </span>
                      </h3>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                        Let Free AI scan your photo to auto-fill product name, category, Naira price & headline.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isDetectingProductAI}
                    onClick={handleMagicAIDetect}
                    className="text-xs font-extrabold px-3 py-1.5 rounded-xl shrink-0 shadow-sm"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#FFC93C]" />}
                  >
                    Auto-Fill
                  </Button>
                </div>
              </div>

              <Card className="space-y-4">
                {/* Multi-Product Mode Toggle (for 4-photo grid or multi-product vendors) */}
                <div className="p-3 bg-green-50/70 dark:bg-green-950/30 rounded-2xl border border-green-200 dark:border-green-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0B6B3A] dark:text-green-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#FF5A36]" />
                      <span>Pricing & Product Layout Mode</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {flyerData.productImages?.length || 1}/4 Photos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFlyerData((prev) => ({ ...prev, multiProductMode: 'single_multi_view' }))}
                      className={`tap-target p-2.5 rounded-xl border-2 text-left transition-all ${
                        (flyerData.multiProductMode || 'single_multi_view') === 'single_multi_view'
                          ? 'border-[#0B6B3A] bg-white dark:bg-gray-800 shadow-xs ring-1 ring-[#0B6B3A]/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 opacity-75'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1">
                        <span>📸 1 Main Product</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Multiple angles of 1 item with 1 global price.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFlyerData((prev) => ({ ...prev, multiProductMode: 'separate_products' }))}
                      className={`tap-target p-2.5 rounded-xl border-2 text-left transition-all ${
                        flyerData.multiProductMode === 'separate_products'
                          ? 'border-[#0B6B3A] bg-white dark:bg-gray-800 shadow-xs ring-1 ring-[#0B6B3A]/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 opacity-75'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1">
                        <span>🏷️ 4 Separate Products</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Each slot has its own name & separate ₦ price pill!
                      </p>
                    </button>
                  </div>
                </div>

                {flyerData.multiProductMode === 'separate_products' ? (
                  /* 4 SEPARATE PRODUCTS WITH INDIVIDUAL PRICES & NAMES (e.g. Phone Dealer: Samsung, Tecno, iPhone, Itel) */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Set Name & Price for Each of the 4 Slots
                      </span>
                      <span className="text-[10px] text-[#0B6B3A] font-bold">
                        Pills render directly on photo slots
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const item = flyerData.multiProducts?.[slotIdx] || {
                          name: `Product ${slotIdx + 1}`,
                          price: 25000,
                          badge: 'Hot',
                        };

                        return (
                          <div
                            key={slotIdx}
                            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-[#0B6B3A] dark:text-green-400">
                                Slot {slotIdx + 1} Item
                              </span>
                              {flyerData.productImages?.[slotIdx] ? (
                                <span className="text-[9px] text-green-600 font-bold bg-green-100 dark:bg-green-950/60 px-1.5 py-0.5 rounded">
                                  Photo Loaded ✓
                                </span>
                              ) : (
                                <span className="text-[9px] text-gray-400">Add in Step 1</span>
                              )}
                            </div>

                            <div>
                              <input
                                type="text"
                                placeholder={`e.g. ${slotIdx === 0 ? 'Samsung S23' : slotIdx === 1 ? 'iPhone 14 Pro' : slotIdx === 2 ? 'Tecno Camon' : 'Itel A70'}`}
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...(flyerData.multiProducts || [])];
                                  updated[slotIdx] = { ...item, name: e.target.value };
                                  setFlyerData((prev) => ({ ...prev, multiProducts: updated }));
                                }}
                                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none focus:ring-1 focus:ring-[#0B6B3A]"
                              />
                            </div>

                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                                ₦
                              </span>
                              <input
                                type="number"
                                placeholder="Price"
                                value={item.price || ''}
                                onChange={(e) => {
                                  const updated = [...(flyerData.multiProducts || [])];
                                  updated[slotIdx] = { ...item, price: Number(e.target.value) };
                                  setFlyerData((prev) => ({ ...prev, multiProducts: updated }));
                                }}
                                className="w-full pl-6 pr-2 py-1.5 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#0B6B3A] dark:text-[#FFC93C] outline-none focus:ring-1 focus:ring-[#0B6B3A]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* SINGLE MAIN PRODUCT DETAILS */
                  <>
                    {/* Product / Service Title */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Product or Service Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tokunbo V6 Engine & Computer Scanning"
                        value={flyerData.productName}
                        onChange={(e) =>
                          setFlyerData((prev) => ({ ...prev, productName: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                      />
                    </div>

                    {/* Subtitle / Key Highlights */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Subtitle / Service Highlights (e.g. Warranty, Location)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 6 Months Warranty • Pay on Delivery in Lagos"
                        value={flyerData.subtitle || ''}
                        onChange={(e) =>
                          setFlyerData((prev) => ({ ...prev, subtitle: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                      />
                    </div>

                    {/* Price and Old Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Price in Naira (₦) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                            ₦
                          </span>
                          <input
                            type="number"
                            placeholder="25000"
                            value={flyerData.price || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setFlyerData((prev) => ({
                                ...prev,
                                price: val,
                                discountPct: calculateDiscount(val, prev.oldPrice),
                              }));
                            }}
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Original Price (Optional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                            ₦
                          </span>
                          <input
                            type="number"
                            placeholder="35000"
                            value={flyerData.oldPrice || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setFlyerData((prev) => ({
                                ...prev,
                                oldPrice: val,
                                discountPct: calculateDiscount(prev.price, val),
                              }));
                            }}
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {flyerData.discountPct ? (
                      <div className="text-xs font-bold text-[#0B6B3A] dark:text-[#FFC93C] flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Auto discount: -{flyerData.discountPct}% OFF badge will show on flyer!
                      </div>
                    ) : null}
                  </>
                )}

                {/* Business Name and Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ladipo Speed Auto"
                      value={flyerData.businessName}
                      onChange={(e) =>
                        setFlyerData((prev) => ({ ...prev, businessName: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      WhatsApp Hotline
                    </label>
                    <input
                      type="tel"
                      placeholder="08023456789"
                      value={flyerData.phone}
                      onChange={(e) =>
                        setFlyerData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                    />
                  </div>
                </div>

                {/* Sector Categories */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Select Your Business Sector
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'mechanic', name: 'Auto Mechanic' },
                      { id: 'artisan', name: 'Artisans & AC' },
                      { id: 'church', name: 'Church & Ministry' },
                      { id: 'barber', name: 'Barber & Salon' },
                      { id: 'thrift', name: 'Thrift & Bales' },
                      { id: 'food', name: 'Food & Caterer' },
                      { id: 'fashion', name: 'Boutique Fashion' },
                      { id: 'tech', name: 'Phones & Gadgets' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() =>
                          setFlyerData((prev) => ({
                            ...prev,
                            sector: sec.id as SectorCategory,
                            category: sec.name,
                          }))
                        }
                        className={`tap-target px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          flyerData.sector === sec.id
                            ? 'bg-[#0B6B3A] text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {sec.name}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  leftIcon={<ChevronLeft className="w-5 h-5" />}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setCurrentStep(3)}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Next: Choose Template & Export
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Style, Templates, AI & Export */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Template Selector Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Choose Template ({TEMPLATES.length} designs)
                  </label>
                  <button
                    onClick={() => setCurrentView('dev_templates')}
                    className="tap-target text-xs font-bold text-[#0B6B3A] dark:text-[#FFC93C] hover:underline"
                  >
                    Browse All {TEMPLATES.length} →
                  </button>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {TEMPLATES.map((tmpl) => {
                    const isLocked = Boolean(tmpl.isProOnly && activePlan === 'free');
                    const isSelected = !isLocked && flyerData.selectedTemplateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          if (isLocked) {
                            setIsPricingOpen(true);
                            return;
                          }
                          setFlyerData((prev) => ({ ...prev, selectedTemplateId: tmpl.id }));
                        }}
                        className={`tap-target shrink-0 p-3 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-gray-800 border-[#0B6B3A] ring-2 ring-[#0B6B3A]/20 shadow-md scale-102'
                            : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: tmpl.accentColor }}
                          />
                          <div>
                            <span className="font-bold text-xs text-gray-900 dark:text-white block">
                              {tmpl.name}{isLocked ? ' · PRO' : ''}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {tmpl.photoSlots > 1 ? `${tmpl.photoSlots} Photos` : 'Hero Photo'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Copy & Headlines Panel with viral footer for free tier */}
              <Card>
                <CopyPanel
                  productName={flyerData.productName}
                  price={flyerData.price}
                  discountPct={flyerData.discountPct}
                  businessName={flyerData.businessName}
                  category={flyerData.category}
                  currentHeadline={flyerData.headline}
                  userPlan={activePlan}
                  referralCode={vendor.referralCode}
                  onSelectHeadline={(headline) =>
                    setFlyerData((prev) => ({ ...prev, headline }))
                  }
                />
              </Card>

              {/* Export & WhatsApp Share Bar with QR code embedding */}
              <ExportBar
                template={selectedTemplate}
                userData={flyerData}
                userPlan={activePlan}
                referralCode={vendor.referralCode}
                isAuthenticated={isAuthenticated}
                onOpenUpgrade={() => setIsPricingOpen(true)}
                onRecordFlyer={() => {
                  const result = recordFlyerCreated(activePlan);
                  if (!result.canCreate) {
                    showToast('Free trial complete', 'Create five flyers free, then choose a paid plan to continue.', 'info');
                    setIsPricingOpen(true);
                    return false;
                  }
                  if (activePlan === 'free') {
                    setVendor((current) => ({
                      ...current,
                      flyersCreatedTotal: Math.min(5, current.flyersCreatedTotal + 1),
                      flyersCreatedToday: current.flyersCreatedToday + 1,
                    }));
                  }
                  return true;
                }}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  leftIcon={<ChevronLeft className="w-5 h-5" />}
                >
                  Edit Details
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                >
                  Change Photos
                </Button>
              </div>
            </div>
          )}
            </div>
          </div>
        </main>
      )}
      </Suspense>

      {/* Paystack Upgrade BottomSheet */}
      <Suspense fallback={null}><PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentPlan={activePlan}
        isAuthenticated={isAuthenticated}
        accountEmail={accountEmail}
        onRequireAccount={() => setIsAccountOpen(true)}
      /></Suspense>

      <AccountAccessModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onAuthenticated={handleAccountAuthenticated}
        onSignedOut={handleAccountSignedOut}
        currentEmail={accountEmail}
        isAuthenticated={isAuthenticated}
      />

      {/* Mini Profile & Store Explainer Modal */}
      <MiniProfileExplainerModal
        isOpen={isMiniProfileModalOpen}
        onClose={() => setIsMiniProfileModalOpen(false)}
        vendor={vendor}
        products={products}
        onUpdateVendor={(updated) => setVendor(updated)}
        onUpdateProducts={setProducts}
        onOpenStoreView={() => setCurrentView('shop')}
      />

      {/* Bad Camera vs Auto-Enhanced Cutout Comparison Modal */}
      {showBeforeAfterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A202C] rounded-3xl max-w-lg w-full p-5 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    Photo Processing Comparison
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Compare the enhanced photo with an optional background cutout
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBeforeAfterModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  Enhanced Photo (Background Kept)
                </span>
                <div className="aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-neutral-900 relative">
                  <img
                    src={flyerData.enhancedOriginalImage || flyerData.productImage || ''}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Background Preserved
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">Original background retained</p>
              </div>

              <div className="space-y-1.5 text-center">
                <span className="text-[10px] font-bold text-[#0B6B3A] dark:text-[#FFC93C] uppercase tracking-wide">
                  {flyerData.cleanCutoutImage ? 'Optional Background Cutout' : 'Original Background'}
                </span>
                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-[#0B6B3A] bg-emerald-950/20 relative shadow-md">
                  <img
                    src={flyerData.cleanCutoutImage || flyerData.productImage || ''}
                    alt={flyerData.cleanCutoutImage ? 'Background removed cutout' : 'Photo with original background'}
                    className="w-full h-full object-contain p-2"
                  />
                  <span className="absolute bottom-1.5 right-1.5 bg-[#0B6B3A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {flyerData.cleanCutoutImage ? 'Cutout Applied' : 'Background Kept'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {flyerData.cleanCutoutImage
                    ? 'Background removal was applied on request.'
                    : 'Background stays intact unless you choose Clean Cutout.'}
                </p>
              </div>
            </div>

            {/* AI Magic Stats Pills */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-gray-800 dark:text-gray-200 block text-[11px]">
                Applied Automatic Natural Enhancements:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Check className="w-3.5 h-3.5 text-[#0B6B3A]" />
                  <span>Dynamic Range Exposure Lift (+40%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Check className="w-3.5 h-3.5 text-[#0B6B3A]" />
                  <span>Grey-World White Balance Calibrated</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Check className="w-3.5 h-3.5 text-[#0B6B3A]" />
                  <span>Unsharp Mask Clarity Sharpened</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Check className="w-3.5 h-3.5 text-[#0B6B3A]" />
                  <span>Saliency Multi-Threshold Cutout</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={() => setShowBeforeAfterModal(false)}
            >
              Looks Clean Sharp Sharp!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainContent />
    </ToastProvider>
  );
}
