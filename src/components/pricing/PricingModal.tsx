import React, { useState } from 'react';
import { Check, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { UserPlan } from '../../types/index.ts';
import { recordAnalyticsEvent } from '../../lib/storage.ts';
import { BottomSheet } from '../ui/BottomSheet.tsx';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';

export interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: UserPlan;
  onPlanUpdated: (newPlan: UserPlan) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onPlanUpdated,
}) => {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'day_pass' | 'pro'>('day_pass');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaystackCheckout = async () => {
    setIsProcessing(true);
    recordAnalyticsEvent('upgrade_view', { plan: selectedPlan });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: selectedPlan === 'day_pass' ? 500 : 2500,
        }),
      });

      const checkout = await response.json();
      if (!response.ok || !checkout.data?.authorization_url) {
        throw new Error(checkout.message || 'Online payments are not available yet.');
      }
      window.location.assign(checkout.data.authorization_url);
    } catch (error) {
      setIsProcessing(false);
      showToast(
        'Payment unavailable',
        error instanceof Error ? error.message : 'Please try again later.',
        'error'
      );
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Upgrade StatusPop">
      <div className="space-y-4">
        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-[#FFC93C]/20 text-[#0B6B3A] dark:text-[#FFC93C] font-bold text-xs rounded-full uppercase tracking-wider mb-2">
            No Commitment • Pay As You Go
          </span>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Sell More with Clean, Watermark-Free Flyers
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Over 10,000 Nigerian vendors use StatusPop to boost daily sales.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="space-y-3">
          {/* Day Pass */}
          <div
            onClick={() => setSelectedPlan('day_pass')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedPlan === 'day_pass'
                ? 'border-[#0B6B3A] bg-[#FFF9EC] dark:bg-emerald-950/20 ring-2 ring-[#0B6B3A]/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    Day Pass (24 Hours)
                  </h4>
                  <span className="px-2 py-0.5 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full">
                    POPULAR FOR FLASH SALES
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Perfect for a single big market day or weekend drop.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#0B6B3A] dark:text-[#FFC93C]">
                  ₦500
                </span>
                <span className="text-[10px] text-gray-400 block">one-off</span>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> 24 Hours unlimited flyers
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> 100% Watermark removed
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> 1 Real Special Event Design per celebration (Independence, New Week, Valentine)
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> All 15+ sector templates unlocked
              </li>
            </ul>
          </div>

          {/* Pro Monthly */}
          <div
            onClick={() => setSelectedPlan('pro')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedPlan === 'pro'
                ? 'border-[#0B6B3A] bg-[#FFF9EC] dark:bg-emerald-950/20 ring-2 ring-[#0B6B3A]/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    Pro Unlimited (Monthly)
                  </h4>
                  <span className="px-2 py-0.5 bg-[#0B6B3A] text-white text-[10px] font-bold rounded-full">
                    BEST VALUE
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  For daily sellers posting 10+ status updates weekly.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#0B6B3A] dark:text-[#FFC93C]">
                  ₦2,500
                </span>
                <span className="text-[10px] text-gray-400 block">per month</span>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Unlimited daily flyers
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> No watermark on any export
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Festive packs (Detty December, Eid, Easter)
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0B6B3A]" /> Priority AI caption generator
              </li>
            </ul>
          </div>
        </div>

        {/* Payment availability */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-[#0B6B3A]" />
          <span>Online payments are currently unavailable.</span>
        </div>

        {/* Checkout Button */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isProcessing}
          disabled
          onClick={handlePaystackCheckout}
          leftIcon={<Zap className="w-5 h-5 text-[#FFC93C]" />}
        >
          Payment setup required
        </Button>
      </div>
    </BottomSheet>
  );
};
