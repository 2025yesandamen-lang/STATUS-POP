import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { AICopySuggestion, UserPlan } from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';

export interface CopyPanelProps {
  productName: string;
  price: number;
  discountPct?: number;
  businessName: string;
  category: string;
  currentHeadline: string;
  userPlan: UserPlan;
  referralCode: string;
  onSelectHeadline: (headline: string) => void;
}

export const CopyPanel: React.FC<CopyPanelProps> = ({
  productName,
  price,
  discountPct,
  businessName,
  category,
  currentHeadline,
  userPlan,
  referralCode,
  onSelectHeadline,
}) => {
  const { showToast } = useToast();
  const [language, setLanguage] = useState<'english' | 'pidgin'>('pidgin');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCaptionIdx, setCopiedCaptionIdx] = useState<number | null>(null);

  const isFreePlan = userPlan === 'free';
  const viralFooter = isFreePlan ? `\n\nMade with StatusPop: status-pop.vercel.app/r/${referralCode}?src=caption` : '';

  // Default AI suggestions tailored for Nigerian retail and artisan sectors
  const [suggestions, setSuggestions] = useState<AICopySuggestion>({
    headlines: [
      language === 'pidgin' ? 'OYA COME CARRY YOUR OWN!' : 'MASSIVE FLASH SALE TODAY!',
      language === 'pidgin' ? 'EXPERT WORK NO BE SCAM' : 'PREMIUM VERIFIED QUALITY',
      language === 'pidgin' ? 'SHARP SHARP DEAL FOR YOU' : 'LIMITED SLOTS AVAILABLE NOW',
    ],
    captions: [
      {
        tone: 'excited',
        text:
          language === 'pidgin'
            ? `Original ${productName || 'service'} na just ₦${price.toLocaleString()}! We dey deliver sharp sharp anywhere for Lagos & nationwide. No dull yourself o, DM or WhatsApp to order now!`
            : `Grab this authentic ${productName || 'deal'} for just ₦${price.toLocaleString()}! Premium quality guaranteed with fast delivery nationwide. Send a DM or WhatsApp to secure yours today!`,
      },
      {
        tone: 'classy',
        text:
          language === 'pidgin'
            ? `Special offer from ${businessName || 'our brand'}. Clean ${productName || 'product'} wey go make you stand out. Pay on delivery available. Chat us on WhatsApp now!`
            : `Elevate your lifestyle with ${productName || 'this service'} from ${businessName || 'our clinic'}. Special price of ₦${price.toLocaleString()}. Tap to WhatsApp to order immediately.`,
      },
    ],
    hashtags: ['#NigerianVendor', '#LagosArtisan', '#NaijaSales', '#OriginalQuality', '#WhatsAppVendor'],
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          price,
          discountPct,
          businessName,
          category,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.headlines && data.captions) {
          setSuggestions(data);
          showToast('AI Copy Ready!', 'New punchy marketing copy generated sharp sharp.', 'success');
          return;
        }
      }

      // Sector-aware fallback
      const pidginHeadlines = [
        `NO CARRY LAST O!`,
        `HOT DROP ALERT!`,
        `CLEAN TOKUNBO QUALITY!`,
        `PRICE DON CRASH WELL WELL!`,
        `FIRST TO PAY NA OWNER!`,
      ];
      const englishHeadlines = [
        `EXCLUSIVE NEW ARRIVAL!`,
        `BEST PRICE IN TOWN!`,
        `DON'T MISS THIS DEAL!`,
        `PREMIUM GRADE-A QUALITY!`,
        `SUPER CLEARANCE DEAL!`,
      ];

      const newHeadlines = (language === 'pidgin' ? pidginHeadlines : englishHeadlines)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const excitedText =
        language === 'pidgin'
          ? `Oya look clean ${productName || 'work'}! At just ₦${price.toLocaleString()}, who go allow this deal pass? Fast delivery nationwide. Tap the WhatsApp button to lock yours down sharp sharp!`
          : `Don't miss out on ${productName || 'this offer'} at only ₦${price.toLocaleString()}! Top-tier quality, fast turnaround, and friendly service. Tap WhatsApp now to book or buy!`;

      const classyText =
        language === 'pidgin'
          ? `Your satisfaction na our priority for ${businessName || 'our shop'}. Clean ${productName || 'service'} ready for you. Send us WhatsApp message make we process your order immediately!`
          : `Authentic ${productName || 'item'} delivered straight to you from ${businessName || 'us'}. Priced at ₦${price.toLocaleString()}. Contact us on WhatsApp for fast response.`;

      setSuggestions({
        headlines: newHeadlines,
        captions: [
          { tone: 'excited', text: excitedText },
          { tone: 'classy', text: classyText },
        ],
        hashtags: ['#NaijaBrand', '#LagosMechanic', '#StatusPop', '#NigerianSmallBusiness', '#QualityFirst'],
      });
      showToast('Copy Refreshed!', 'Generated fresh marketing copy for your status.', 'success');
    } catch (err) {
      showToast('Offline Mode', 'Generated local suggestions for your flyer.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    const fullText = text + viralFooter;
    navigator.clipboard.writeText(fullText);
    setCopiedCaptionIdx(idx);
    showToast(
      'Caption Copied!',
      isFreePlan
        ? 'Copied with referral link! Upgrade to Pro to remove.'
        : 'Paste directly into your WhatsApp Status caption!',
      'success'
    );
    setTimeout(() => setCopiedCaptionIdx(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header and language switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FFC93C]" />
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            AI Sales Copy & Captions
          </h3>
        </div>

        {/* English / Pidgin Toggle */}
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setLanguage('pidgin')}
            className={`tap-target px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              language === 'pidgin'
                ? 'bg-[#0B6B3A] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            🇳🇬 Pidgin
          </button>
          <button
            type="button"
            onClick={() => setLanguage('english')}
            className={`tap-target px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              language === 'english'
                ? 'bg-[#0B6B3A] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Headlines chips */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Flyer Headlines (Tap to apply live to flyer):
        </label>
        <div className="flex flex-wrap gap-2">
          {suggestions.headlines.map((headline, idx) => {
            const isSelected = currentHeadline.toUpperCase() === headline.toUpperCase();
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectHeadline(headline)}
                className={`tap-target text-xs font-bold py-2 px-3 rounded-xl transition-all border text-left ${
                  isSelected
                    ? 'bg-[#FFC93C] text-[#111827] border-[#0B6B3A] ring-2 ring-[#0B6B3A]/20 scale-102'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-[#0B6B3A]'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 mr-1 inline-block text-[#0B6B3A]" />}
                {headline}
              </button>
            );
          })}
        </div>
      </div>

      {/* WhatsApp status captions */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Ready WhatsApp Captions (Tap Copy to paste):
        </label>
        <div className="space-y-2.5">
          {suggestions.captions.map((cap, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 relative group"
            >
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {cap.tone} tone
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cap.text, idx)}
                  className="tap-target inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0B6B3A] dark:text-[#FFC93C] hover:underline"
                >
                  {copiedCaptionIdx === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{cap.text}</p>
              {isFreePlan && (
                <p className="text-[10px] text-gray-400 font-mono mt-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                  + Made with StatusPop: status-pop.vercel.app/r/{referralCode}?src=caption
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Regenerate button */}
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          fullWidth
          isLoading={isLoading}
          onClick={handleGenerate}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Regenerate New Ideas ({language === 'pidgin' ? 'Pidgin' : 'English'})
        </Button>
      </div>
    </div>
  );
};
