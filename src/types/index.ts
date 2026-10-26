export type FlyerAspectRatio = '9:16' | '1:1' | '4:5';

export interface CanvasDimensions {
  width: number;
  height: number;
  name: string;
}

export const ASPECT_RATIOS: Record<FlyerAspectRatio, CanvasDimensions> = {
  '9:16': { width: 1080, height: 1920, name: 'WhatsApp Status (9:16)' },
  '1:1': { width: 1080, height: 1080, name: 'Square Post (1:1)' },
  '4:5': { width: 1080, height: 1350, name: 'Portrait Feed (4:5)' },
};

export type FontChoice =
  | 'Anton'
  | 'Bebas Neue'
  | 'Playfair Display'
  | 'Pacifico'
  | 'Poppins'
  | 'Montserrat'
  | 'Inter';

export type SectorCategory =
  | 'mechanic'
  | 'artisan'
  | 'church'
  | 'barber'
  | 'thrift'
  | 'food'
  | 'fashion'
  | 'luxury'
  | 'tech'
  | 'general';

export type SpecialEventType =
  | 'independence_day'
  | 'new_week'
  | 'valentine_day'
  | 'teachers_day'
  | 'girlfriend_day'
  | 'christmas_detty_december'
  | 'eid_mubarak'
  | 'easter_celebration'
  | 'customer_appreciation'
  | 'new_year_launch';

export type EventLayoutFormat =
  | 'circular_portal' // Overlapping circles & floating seasonal elements (like Christmas / Valentine couple)
  | 'organic_wave'    // Diagonal curved wave / split card with speaker/service bullets (like Church / Matters of Heart)
  | 'card_window'     // Elegant rounded arch/window with calendar tag & side photo
  | 'luxury_emblem'   // Pure emblem, glowing festive typography & seasonal icon (gorgeous with or without photo)
  | 'custom_studio';  // Interactive drag & drop custom studio with user-picked icons, containers, text & backgrounds

export type CanvasElementType = 'text' | 'sticker' | 'container' | 'badge';

export interface CustomCanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: FontChoice;
  color?: string;
  iconType?:
    | 'flower'
    | 'gift_box'
    | 'gold_ribbon'
    | 'fireworks'
    | 'lantern'
    | 'heart'
    | 'star'
    | 'holly_berry'
    | 'discount_tag'
    | 'spanner'
    | 'phone';
  shapeType?: 'circle' | 'heart' | 'arch_window' | 'square' | 'rounded_card';
  image?: string | null;
  scale?: number;
}

export interface SpecialEventDesign {
  id: string;
  eventType: SpecialEventType;
  title: string;
  dateOrTheme: string;
  tagline: string;
  defaultMessage: string;
  accentColor: string;
  secondaryColor: string;
  heroGraphic: string; // Image asset, seasonal photo, or emblem
  designVariant: 1 | 2 | 3 | 4 | 5; // 5 real designs: 4 pre-curated + 1 custom drag & drop studio
  layoutFormat: EventLayoutFormat;
  isProExclusive?: boolean;
  defaultServices: string[];
}

export interface BaseLayer {
  id: string;
  type: 'background' | 'product_image' | 'text' | 'badge' | 'cta' | 'watermark' | 'shape';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
}

export interface BackgroundLayer extends BaseLayer {
  type: 'background';
  fillType: 'solid' | 'gradient' | 'pattern';
  color1: string;
  color2?: string;
  gradientAngle?: number;
  accentCircleColor?: string;
  accentCircleRadius?: number;
  accentCirclePos?: { x: number; y: number };
}

export interface ProductImageLayer extends BaseLayer {
  type: 'product_image';
  width: number;
  height: number;
  slotIndex?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  borderRadius?: number;
  clipShape?: 'circle';
  label?: string;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  textKey:
    | 'headline'
    | 'productName'
    | 'subtitle'
    | 'price'
    | 'oldPrice'
    | 'businessName'
    | 'phone'
    | 'discountTag'
    | 'custom';
  defaultText: string;
  fontFamily: FontChoice;
  fontSize: number;
  fontWeight?: 'bold' | 'normal' | '800' | '900';
  fill: string;
  align: 'left' | 'center' | 'right';
  maxLines?: number;
  letterSpacing?: number;
  lineHeight?: number;
  backgroundPill?: {
    fill: string;
    paddingX: number;
    paddingY: number;
    cornerRadius: number;
  };
}

export interface BadgeLayer extends BaseLayer {
  type: 'badge';
  badgeType: 'discount' | 'new' | 'limited' | 'hot' | 'service' | 'verified';
  fill: string;
  textColor: string;
  fontFamily: FontChoice;
  fontSize: number;
  cornerRadius?: number;
  textKey?: string;
  defaultText?: string;
}

export interface CtaLayer extends BaseLayer {
  type: 'cta';
  text: string;
  fontFamily: FontChoice;
  fontSize: number;
  fill: string;
  textColor: string;
  cornerRadius: number;
  icon?: 'whatsapp' | 'phone' | 'cart';
}

export interface WatermarkLayer extends BaseLayer {
  type: 'watermark';
  text: string;
  fontFamily: FontChoice;
  fontSize: number;
  fill: string;
  textColor: string;
  includeQr?: boolean;
}

export type TemplateLayer =
  | BackgroundLayer
  | ProductImageLayer
  | TextLayer
  | BadgeLayer
  | CtaLayer
  | WatermarkLayer;

export type TemplateTheme =
  | 'mechanic'
  | 'artisan'
  | 'church'
  | 'barber'
  | 'multigrid'
  | 'splitduo'
  | 'tripleshowcase'
  | 'boldsale'
  | 'food'
  | 'luxury'
  | 'thrift'
  | 'boutique'
  | 'tech'
  | 'owambe'
  | 'makeup';

export interface FlyerTemplate {
  id: string;
  name: string;
  category: SectorCategory;
  theme?: TemplateTheme;
  description: string;
  accentColor: string;
  photoSlots: number;
  isProOnly?: boolean;
  layers: TemplateLayer[];
}

export interface UserFlyerData {
  productName: string;
  headline: string;
  subtitle?: string;
  price: number;
  oldPrice?: number;
  discountPct?: number;
  businessName: string;
  phone: string;
  productImage: string | null;
  productImages: string[];
  enhancedOriginalImage?: string | null;
  enhancedOriginalImages?: string[];
  cleanCutoutImage?: string | null;
  cleanCutoutImages?: string[];
  hasRemovedBg: boolean;
  aspectRatio: FlyerAspectRatio;
  selectedTemplateId: string;
  sector: SectorCategory;
  notes?: string;
  category: string;
  multiProductMode?: 'single_multi_view' | 'separate_products';
  multiProducts?: Array<{
    name: string;
    price: number;
    oldPrice?: number;
    badge?: string;
    image?: string;
  }>;
}

export interface AICopySuggestion {
  headlines: string[];
  captions: Array<{
    tone: 'excited' | 'classy' | 'urgency';
    text: string;
  }>;
  hashtags: string[];
}

export type UserPlan = 'free' | 'day_pass' | 'pro';

export interface NigerianBank {
  name: string;
  code: string;
  slug: string;
  ussdPrefix?: string;
}

export interface VendorProfile {
  id: string;
  businessName: string;
  shopSlug: string;
  phone: string;
  whatsappNumber: string;
  email?: string;
  bio?: string;
  address?: string;
  referralCode: string;
  referredBy?: string;
  plan: UserPlan;
  planExpiresAt?: string;
  flyersCreatedToday: number;
  flyersCreatedTotal: number;
  lastFlyerDate: string;
  isPhoneVerified?: boolean;

  // Paystack Direct Split Payments & Nigerian Bank Account
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  paystackSubaccountCode?: string;
  splitPercentage?: number; // e.g. 100 for 100% payout to vendor
  isBankVerified?: boolean;

  // Daily Status Reminder Settings
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string; // e.g. "08:00"
  lastDailyReminderDate?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  isPublished: boolean;
  inStock: boolean;
  stockCount?: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  campaignId?: string;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type:
    | 'flyer_created'
    | 'flyer_shared'
    | 'watermark_click'
    | 'qr_scan'
    | 'caption_click'
    | 'upgrade_view'
    | 'paid'
    | 'order_submitted'
    | 'order_completed'
    | 'event_flyer_created';
  vendorId?: string;
  referralCode?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PaystackTransaction {
  id: string;
  reference: string;
  vendorPhone: string;
  businessName: string;
  plan: UserPlan;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  channel: 'card' | 'bank_transfer' | 'ussd';
  signature: string;
  paidAt: string;
}
