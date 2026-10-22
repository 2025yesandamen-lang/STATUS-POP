import React, { useState } from 'react';
import {
  Download,
  MessageCircle,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  X,
  Share2,
  Smartphone,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FlyerTemplate, UserFlyerData, UserPlan } from '../../types/index.ts';
import { exportFlyerToDataUrl } from '../../lib/render.ts';
import { recordAnalyticsEvent } from '../../lib/storage.ts';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';

export interface ExportBarProps {
  template: FlyerTemplate;
  userData: UserFlyerData;
  userPlan: UserPlan;
  referralCode: string;
  onOpenUpgrade: () => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  template,
  userData,
  userPlan,
  referralCode,
  onOpenUpgrade,
}) => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [exportedDataUrl, setExportedDataUrl] = useState<string>('');
  const [formattedCaption, setFormattedCaption] = useState<string>('');
  const [captionCopied, setCaptionCopied] = useState<boolean>(false);

  const hasWatermark = userPlan === 'free';

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.8 },
        colors: ['#0B6B3A', '#FFC93C', '#FF5A36', '#25D366'],
      });
    } catch (e) {
      // ignore
    }
  };

  const generateSalesCaption = (): string => {
    const viralCaption = hasWatermark
      ? `\n\nMade with StatusPop: statuspop.ng/r/${referralCode}?src=status`
      : '';
    return (
      `*${userData.headline}*\n\n` +
      `🔥 *${userData.productName}*\n` +
      `💰 Special Price: *₦${userData.price.toLocaleString('en-NG')}*${
        userData.oldPrice ? ` ~₦${userData.oldPrice.toLocaleString('en-NG')}~` : ''
      }\n` +
      `${userData.subtitle ? `✨ ${userData.subtitle}\n` : ''}` +
      `\n📍 ${userData.businessName}\n` +
      `📞 WhatsApp or Call: ${userData.phone}\n` +
      `👉 Send a DM or reply to this status to order sharp sharp!${viralCaption}`
    );
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await exportFlyerToDataUrl(template, userData, hasWatermark, referralCode);
      const link = document.createElement('a');
      const filename = `${
        userData.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'flyer'
      }-statuspop.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();

      triggerConfetti();
      recordAnalyticsEvent('flyer_created', {
        templateId: template.id,
        plan: userPlan,
        referralCode,
      });
      showToast(
        'Flyer Downloaded!',
        'Saved in 1080p HD! Ready to post on WhatsApp Status.',
        'success'
      );
    } catch (err) {
      showToast('Export Error', 'Could not export flyer image. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareOnStatus = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await exportFlyerToDataUrl(template, userData, hasWatermark, referralCode);
      setExportedDataUrl(dataUrl);

      const captionText = generateSalesCaption();
      setFormattedCaption(captionText);

      // 1. Auto-copy caption to device clipboard immediately
      try {
        await navigator.clipboard.writeText(captionText);
        setCaptionCopied(true);
      } catch (clipErr) {
        console.warn('Clipboard write warning:', clipErr);
      }

      // 2. Auto-download HD image to device gallery so it is ready in WhatsApp
      const filename = `${
        userData.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'flyer'
      }-statuspop.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      recordAnalyticsEvent('flyer_shared', {
        templateId: template.id,
        plan: userPlan,
        referralCode,
      });

      // 3. Check Web Share API with File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: userData.headline,
            text: captionText,
          });
          triggerConfetti();
          showToast('Shared to WhatsApp!', 'Select My Status to post your flyer.', 'success');
          return;
        } catch (shareErr: any) {
          // If user dismissed system sheet or browser dropped text, show modal guide
          if (shareErr.name !== 'AbortError') {
            console.warn('Navigator share error:', shareErr);
          }
        }
      }

      // 4. Open Dedicated Status Guide Modal with direct 1-tap WhatsApp launch
      setShowStatusModal(true);
      triggerConfetti();
    } catch (err) {
      console.error('Share export error:', err);
      showToast('Notice', 'Flyer image ready for download below.', 'info');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLaunchWhatsApp = () => {
    // Try native app scheme first, then fallback to web
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encodeURIComponent(formattedCaption)}`;
    } else {
      window.open(
        `https://web.whatsapp.com/send?text=${encodeURIComponent(formattedCaption)}`,
        '_blank'
      );
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-[#1A202C] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg space-y-3">
        {hasWatermark && (
          <div className="flex items-center justify-between p-2.5 bg-[#FFF9EC] dark:bg-amber-950/30 rounded-xl border border-[#FFC93C]/40 text-xs text-[#111827] dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF5A36] shrink-0" />
              <span>Free plan has 150px QR referral strip.</span>
            </div>
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="tap-target font-bold text-[#0B6B3A] dark:text-[#FFC93C] underline shrink-0 px-2"
            >
              Remove for ₦300
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            isLoading={isExporting}
            onClick={handleDownload}
            leftIcon={<Download className="w-5 h-5" />}
          >
            Download PNG
          </Button>

          <Button
            type="button"
            variant="whatsapp"
            fullWidth
            isLoading={isExporting}
            onClick={handleShareOnStatus}
            leftIcon={<MessageCircle className="w-5 h-5" />}
            className="font-black shadow-md shadow-emerald-600/25"
          >
            Share on Status
          </Button>
        </div>
      </div>

      {/* Dedicated WhatsApp Status 1-Tap Posting Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A202C] rounded-3xl max-w-md w-full p-5 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#25D366] text-white flex items-center justify-center font-black shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    Post to WhatsApp Status
                  </h3>
                  <p className="text-[11px] text-gray-500">Ready in 2 quick taps!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist of Auto-Prepared Assets */}
            <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Flyer HD Image saved to your Phone Gallery</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Marketing Sales Caption copied to clipboard</span>
              </div>
            </div>

            {/* 3 Steps Guide */}
            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0B6B3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap <strong>"Open WhatsApp"</strong> below.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0B6B3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Go to <strong>Updates / Status</strong> tab & tap the camera icon (or choose{' '}
                  <em>My Status</em>).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0B6B3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Pick your saved flyer image and <strong>tap "Paste"</strong> in the caption field!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                variant="whatsapp"
                fullWidth
                size="lg"
                onClick={handleLaunchWhatsApp}
                leftIcon={<MessageCircle className="w-5 h-5" />}
                className="font-black text-base shadow-lg shadow-emerald-600/30"
              >
                Open WhatsApp Now →
              </Button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(formattedCaption);
                  setCaptionCopied(true);
                  showToast('Caption Re-copied!', 'Ready to paste.', 'success');
                }}
                className="w-full py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{captionCopied ? 'Caption Copied to Clipboard!' : 'Re-copy Caption'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
