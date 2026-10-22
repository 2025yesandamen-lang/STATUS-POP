import React, { useState } from 'react';
import { Smartphone, CheckCircle, ShieldCheck } from 'lucide-react';
import { VendorProfile } from '../../types/index.ts';
import { lockPlanToPhone } from '../../lib/storage.ts';
import { BottomSheet } from '../ui/BottomSheet.tsx';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';

export interface PhoneLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: VendorProfile;
  onVerified: (updated: VendorProfile) => void;
}

export const PhoneLockModal: React.FC<PhoneLockModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onVerified,
}) => {
  const { showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(vendor.phone || '');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      showToast('Invalid Phone', 'Please enter a valid 11-digit Nigerian WhatsApp number.', 'error');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const updated = lockPlanToPhone(phoneNumber.trim());
      setIsVerifying(false);
      onVerified(updated);
      showToast('Plan Locked to Phone!', `Your ${updated.plan.toUpperCase()} status is tied to ${phoneNumber}.`, 'success');
      onClose();
    }, 1000);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Lock Subscription to WhatsApp">
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#0B6B3A]/10 text-[#0B6B3A] rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="font-black text-lg text-gray-900 dark:text-white">
            Never Lose Your Pro Status
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Tie your <strong>{vendor.plan.toUpperCase()}</strong> subscription to your Nigerian WhatsApp phone number. It restores instantly across all phones, tablets & laptops.
          </p>
        </div>

        <form onSubmit={handleSavePhone} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              WhatsApp Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                🇳🇬 +234
              </span>
              <input
                type="tel"
                required
                placeholder="8012345678"
                value={phoneNumber.replace(/^234|^0/, '')}
                onChange={(e) => setPhoneNumber('0' + e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-20 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-[#0B6B3A] outline-none"
              />
            </div>
            <span className="text-[11px] text-gray-500 block mt-1">
              e.g. 0802 345 6789 (We send free status updates & sales receipts)
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#0B6B3A]" />
              <span>Multi-device synchronization active</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0B6B3A]" />
              <span>Zero passwords needed — WhatsApp authentication</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="whatsapp"
            size="lg"
            fullWidth
            isLoading={isVerifying}
          >
            Lock Account to This Phone
          </Button>
        </form>
      </div>
    </BottomSheet>
  );
};
