import React from 'react';
import {
  Sparkles,
  Check,
  Wrench,
  Hammer,
  Church,
  ScissorsLineDashed,
  Shirt,
  Utensils,
  ArrowRight,
  ShieldCheck,
  Zap,
  Camera,
  Layers,
  Smartphone,
  Lock,
} from 'lucide-react';
import { UserPlan, SectorCategory } from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';

export interface HomePageProps {
  userPlan: UserPlan;
  onStartCreate: (sectorPreset?: string) => void;
  onOpenPricing: () => void;
  onOpenTemplates: () => void;
  onOpenShop: () => void;
  onOpenAdmin?: () => void;
  showAdmin?: boolean;
  onOpenPhoneLock: () => void;
  onOpenEvents: () => void;
  onOpenDP?: () => void;
  onOpenMiniProfileModal?: () => void;
}

const SECTOR_CHIPS = [
  { id: 'mechanic', name: 'Auto Mechanics', icon: Wrench },
  { id: 'artisan', name: 'Artisans & Plumbers', icon: Hammer },
  { id: 'church', name: 'Church & Ministries', icon: Church },
  { id: 'thrift', name: '2-4 Photo Multi-Grids', icon: Layers },
  { id: 'barber', name: 'Barbers & Salons', icon: ScissorsLineDashed },
  { id: 'fashion', name: 'Thrift & Fashion', icon: Shirt },
];

export const HomePage: React.FC<HomePageProps> = ({
  userPlan,
  onStartCreate,
  onOpenPricing,
  onOpenTemplates,
  onOpenShop,
  onOpenAdmin,
  showAdmin = true,
  onOpenPhoneLock,
  onOpenEvents,
  onOpenDP,
  onOpenMiniProfileModal,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-4 pt-8 pb-12 text-center space-y-6">
        {/* Top Announcement Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC93C]/20 border border-[#FFC93C]/50 text-xs font-bold text-[#0B6B3A] dark:text-[#FFC93C] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
          <span>Naija Ad Maker • Auto Mechanics, Artisans, Church, Multi-Photo & Stores</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
          Turn your business photos into a polished flyer in{' '}
          <span className="text-[#0B6B3A] dark:text-[#FFC93C] underline decoration-[#FFC93C] decoration-4 underline-offset-4">
            10 seconds.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
          Snap your products or services. Add up to 4 photos. Get instant AI Pidgin & English headlines and post straight to WhatsApp Status.
        </p>

        {/* Primary Make Flyer Now CTA */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => onStartCreate()}
              className="px-8 py-4 text-base sm:text-lg font-bold rounded-2xl shadow-xl shadow-[#0B6B3A]/25 hover:scale-102 transition-transform"
              leftIcon={<Sparkles className="w-5 h-5 text-[#FFC93C]" />}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Make Flyer Now →
            </Button>

            <button
              type="button"
              onClick={onOpenEvents}
              className="tap-target px-6 py-3.5 text-sm sm:text-base font-extrabold rounded-2xl bg-gradient-to-r from-[#0B6B3A] to-[#04331C] text-white hover:from-[#064E2B] hover:to-[#021B0E] border border-green-600/50 shadow-lg shadow-green-900/20 flex items-center gap-2 hover:scale-102 transition-all"
            >
              <span className="text-base">🎉</span>
              <span>Holiday & Event Flyers</span>
              <span className="text-[10px] bg-[#FFC93C] text-[#064E2B] font-black px-1.5 py-0.5 rounded-full uppercase">
                New
              </span>
            </button>
          </div>

          {/* Quick Sector Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-lg">
            {SECTOR_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onStartCreate(chip.id)}
                  className="tap-target px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#0B6B3A] text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                >
                  <Icon className="w-3.5 h-3.5 text-[#0B6B3A] dark:text-[#FFC93C]" />
                  <span>{chip.name}</span>
                </button>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-[#0B6B3A]" /> 100% Free to start
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-[#0B6B3A]" /> Low data friendly
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-[#0B6B3A]" /> 15 Ready Styles
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-[#FF5A36]" /> ₦500 Day Pass
            </span>
            <span>•</span>
            <span
              onClick={onOpenMiniProfileModal}
              className="flex items-center gap-1 text-[#0B6B3A] dark:text-[#FFC93C] cursor-pointer hover:underline font-bold"
            >
              <Check className="w-4 h-4 text-[#0B6B3A]" /> 🏦 Paystack Bank Split
            </span>
            <span>•</span>
            <span
              onClick={onOpenMiniProfileModal}
              className="flex items-center gap-1 text-[#FF5A36] cursor-pointer hover:underline font-bold"
            >
              <Check className="w-4 h-4 text-[#FF5A36]" /> ⏰ 8 AM Status Alert
            </span>
          </div>
        </div>

        {/* Special Events & Holiday Celebrations Banner Card */}
        <div
          onClick={onOpenEvents}
          className="cursor-pointer text-left bg-gradient-to-br from-green-950 via-[#064E2B] to-[#0B6B3A] text-white p-5 rounded-3xl border-2 border-[#FFC93C]/40 shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFC93C] text-[#064E2B] font-extrabold text-[10px] uppercase">
                <Sparkles className="w-3 h-3" />
                Never Pay A Designer Again
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                🇳🇬 Nigerian Holidays & Weekly Motivation Flyers
              </h3>
              <p className="text-xs text-green-100 leading-relaxed">
                Independence Day (Oct 1st), Happy New Week prayers, Valentine's Day, Teachers' Day, and Girlfriend Day. 4 real graphic designs per event with your business name, hotline, and Computer Village address.
              </p>
            </div>

            <div className="shrink-0 flex items-center sm:flex-col sm:items-end justify-between gap-2">
              <span className="text-xs font-bold text-[#FFC93C] bg-black/30 px-3 py-1.5 rounded-xl border border-yellow-400/20">
                Day Pass: ₦500 Only
              </span>
              <button
                type="button"
                className="px-4 py-2 bg-white text-[#064E2B] font-extrabold text-xs rounded-xl shadow-md group-hover:bg-[#FFC93C] transition-colors flex items-center gap-1"
              >
                <span>Open Event Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp DP & Mini Store Showcase Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: WhatsApp Profile Picture (DP) Creator */}
          <div
            onClick={onOpenDP}
            className="cursor-pointer text-left bg-gradient-to-br from-emerald-900 to-green-950 text-white p-5 rounded-3xl border border-emerald-500/40 shadow-lg hover:scale-[1.01] transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#25D366] text-black font-extrabold text-[10px] uppercase mb-2">
                <span>🟢</span>
                <span>For Tailors, Barbers, Mechanics & Chefs</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                WhatsApp Profile Picture (DP) Creator
              </h3>
              <p className="text-xs text-green-100/85 mt-1 leading-relaxed">
                Design a professional WhatsApp circular DP with your photo, business name, 4 core services, verified checkmark, and hotline!
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-emerald-800">
              <span className="text-[11px] font-bold text-[#FFC93C]">WhatsApp Circle Crop Guide</span>
              <span className="text-xs font-extrabold text-white flex items-center gap-1">
                <span>Create DP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: How Mini Store Works */}
          <div
            onClick={onOpenMiniProfileModal}
            className="cursor-pointer text-left bg-gradient-to-br from-amber-950/90 to-gray-900 text-white p-5 rounded-3xl border border-yellow-500/30 shadow-lg hover:scale-[1.01] transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFC93C] text-black font-extrabold text-[10px] uppercase mb-2">
                <span>🏪</span>
                <span>24/7 Web Shopfront</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                How Your Mini Profile & Store Works
              </h3>
              <p className="text-xs text-amber-100/85 mt-1 leading-relaxed">
                Your personalized shop link where buyers browse your catalog and send orders directly into your WhatsApp inbox. Zero commissions!
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-amber-900/60">
              <span className="text-[11px] font-bold text-[#FFC93C]">status-pop.vercel.app/shop/[your-name]</span>
              <span className="text-xs font-extrabold text-white flex items-center gap-1">
                <span>See My Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3 Value Proposition Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
          <Card padding="md" className="border-t-4 border-t-[#0B6B3A] space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#0B6B3A]/10 text-[#0B6B3A] font-bold text-xs flex items-center justify-center mb-1">
              1
            </span>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              1 to 4 Photo Grids
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Show single products or multiple angles, 4-photo mega clearance collages, and Before & After service results.
            </p>
          </Card>

          <Card padding="md" className="border-t-4 border-t-[#FFC93C] space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#FFC93C]/20 text-[#0B6B3A] font-bold text-xs flex items-center justify-center mb-1">
              2
            </span>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Specialized Sectors
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Auto mechanics, electricians, plumbers, carpenters, churches, and barbers no longer need to pay expensive graphic designers!
            </p>
          </Card>

          <Card padding="md" className="border-t-4 border-t-[#25D366] space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#25D366]/20 text-[#0B6B3A] font-bold text-xs flex items-center justify-center mb-1">
              3
            </span>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              AI Captions in Pidgin
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Get punchy, excited captions in natural Nigerian Pidgin or English. Tap to copy and post with 1-click.
            </p>
          </Card>
        </div>

        {/* Simple, Honest Naija Pricing Section */}
        <div className="pt-8">
          <Card padding="lg" className="bg-white dark:bg-[#1A202C] shadow-md border border-gray-200 dark:border-gray-800 text-center space-y-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Simple, Honest Naija Pricing
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Start free, or grab a ₦500 Day Pass for your big market sales day.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {/* Free Plan */}
              <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Free</h4>
                      <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                        ₦0
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">forever</span>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> 3 flyers per day
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> 4 essential templates
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> StatusPop watermark with QR
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Instant WhatsApp export
                    </li>
                  </ul>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => onStartCreate()}
                >
                  Start Free
                </Button>
              </div>

              {/* Day Pass */}
              <div className="p-5 rounded-2xl border-2 border-[#FFC93C] bg-[#FFF9EC]/40 dark:bg-amber-950/20 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Day Pass</h4>
                      <div className="text-2xl font-black text-[#0B6B3A] dark:text-[#FFC93C] mt-0.5">
                        ₦500
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">for 24 hours</span>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> 24 hours unlimited flyers
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> No watermark at all
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> 1 Real Special Event Design per celebration (Independence, New Week, Valentine)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Current sector designs plus premium studio templates
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> High-res PNG export
                    </li>
                  </ul>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={onOpenPricing}
                >
                  Choose Plan
                </Button>
              </div>

              {/* Pro Vendor */}
              <div className="p-5 rounded-2xl border-2 border-[#0B6B3A] bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col justify-between space-y-4 relative shadow-md">
                <span className="absolute -top-3 right-4 bg-[#0B6B3A] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Popular
                </span>
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Pro Vendor</h4>
                      <div className="text-2xl font-black text-[#0B6B3A] dark:text-[#FFC93C] mt-0.5">
                        ₦2,500
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">per month</span>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Unlimited flyers every day
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Zero watermark forever
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Premium Studio designs and festive packs
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> All 3 aspect ratios (9:16, 1:1, 4:5)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Festive packs & seasonal drops
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Priority AI caption generator
                    </li>
                  </ul>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={onOpenPricing}
                >
                  Choose Plan
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Dark Footer Matching Reference Image */}
      <footer className="w-full bg-[#0E1520] text-gray-300 py-6 px-4 border-t border-gray-800 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="font-bold text-white block">
              StatusPop — Snap. Price. Sell.
            </span>
            <span className="text-[11px] text-gray-400">
              Built for Nigerian vendors hustling on WhatsApp Status, Instagram & TikTok.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-400">
            <button
              onClick={onOpenEvents}
              className="text-[#FFC93C] font-bold hover:text-yellow-300 transition-colors flex items-center gap-1"
            >
              <span>🎉 Holiday & Event Flyers</span>
            </button>
            <span>•</span>
            <button
              onClick={onOpenTemplates}
              className="hover:text-white transition-colors"
            >
              All Templates
            </button>
            <span>•</span>
            <button
              onClick={onOpenShop}
              className="hover:text-white transition-colors"
            >
              My Mini-Store
            </button>
            <span>•</span>
            <button
              onClick={onOpenPhoneLock}
              className="hover:text-white transition-colors"
            >
              Vendor Profile
            </button>
          </div>

          {showAdmin && onOpenAdmin && <div>
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-lg bg-[#0B6B3A] text-white text-[11px] font-bold hover:bg-[#064E2B] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Dashboard</span>
            </button>
          </div>}
        </div>
      </footer>
    </div>
  );
};
