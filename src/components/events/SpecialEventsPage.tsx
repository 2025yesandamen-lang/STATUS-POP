import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Download,
  Share2,
  Check,
  ChevronLeft,
  ChevronDown,
  Crown,
  Flame,
  HelpCircle,
  RefreshCw,
  Phone,
  MapPin,
  Globe,
  Tag,
  Camera,
  Upload,
  Image as ImageIcon,
  EyeOff,
  Layers,
  Move,
  Trash2,
  ZoomIn,
  ZoomOut,
  Sliders,
  Calendar,
} from 'lucide-react';
import {
  UserPlan,
  VendorProfile,
  SpecialEventDesign,
  SpecialEventType,
  EventLayoutFormat,
  CustomCanvasElement,
} from '../../types/index.ts';
import { EVENT_CATEGORIES, SPECIAL_EVENT_DESIGNS } from '../../lib/specialEvents.ts';
import { exportEventFlyerToDataUrl, EventFlyerCustomData } from '../../lib/eventRender.ts';
import { downscaleImage, enhanceBadCameraPhoto } from '../../lib/imageProcessing.ts';
import { useToast } from '../ui/Toast.tsx';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';

interface SpecialEventsPageProps {
  userPlan: UserPlan;
  vendor: VendorProfile;
  onBack: () => void;
  onOpenPricing: () => void;
}

export const SpecialEventsPage: React.FC<SpecialEventsPageProps> = ({
  userPlan,
  vendor,
  onBack,
  onOpenPricing,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Active Category & Selected Design
  const [selectedEventType, setSelectedEventType] = useState<SpecialEventType>('independence_day');
  const [selectedVariant, setSelectedVariant] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Picture accommodation toggle: allows designing with or without picture
  const [includePhoto, setIncludePhoto] = useState<boolean>(true);
  const [userUploadedPhoto, setUserUploadedPhoto] = useState<string | null>(null);

  // Custom Studio Canvas elements and background (for Variant 5)
  const [customBackground, setCustomBackground] = useState<string>('gold_sparkles');
  const [customElements, setCustomElements] = useState<CustomCanvasElement[]>([
    { id: 'el-cont-1', type: 'container', x: 540, y: 150, width: 440, height: 440, shapeType: 'heart' },
    { id: 'el-stk-1', type: 'sticker', iconType: 'flower', x: 510, y: 150, scale: 1.1 },
    { id: 'el-stk-2', type: 'sticker', iconType: 'gold_ribbon', x: 960, y: 160, scale: 1.2 },
    { id: 'el-stk-3', type: 'sticker', iconType: 'discount_tag', x: 900, y: 520, scale: 1.0 },
  ]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>('el-cont-1');

  // Direct Touch / Mouse Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [elementStartPos, setElementStartPos] = useState<{ x: number; y: number } | null>(null);

  // Tabbed editing underneath top-pinned canvas
  const [activeTab, setActiveTab] = useState<'format' | 'stickers' | 'text' | 'photo'>('format');

  // Filter available designs for the selected event (5 designs with distinct formats)
  const currentEventDesigns = SPECIAL_EVENT_DESIGNS.filter(
    (d) => d.eventType === selectedEventType
  );

  const activeDesign: SpecialEventDesign =
    currentEventDesigns.find((d) => d.designVariant === selectedVariant) ||
    currentEventDesigns[0] ||
    SPECIAL_EVENT_DESIGNS[0];

  const currentCategoryMeta =
    EVENT_CATEGORIES.find((c) => c.type === selectedEventType) || EVENT_CATEGORIES[0];

  // Form Customization Data matching Nigerian business flyers
  const [customData, setCustomData] = useState<EventFlyerCustomData>({
    businessName: vendor.businessName || 'SAS INNOVATION LIMITED',
    taglineSlogan: 'INNOVATE • CONNECT • GROW',
    headlineTitle: activeDesign.title,
    messageQuote: activeDesign.defaultMessage,
    services: activeDesign.defaultServices || ['Original Quality', 'Nationwide Waybill', 'Tested & Trusted', '24/7 Hotline'],
    phone: vendor.phone || '08023456789',
    address: vendor.address || 'SUITE 14, SIMBIAT ABIOLA WAY, IKEJA COMPUTER VILLAGE, LAGOS',
    website: 'www.statuspop.ng',
    heroImage: activeDesign.heroGraphic,
    includePhoto: true,
  });

  // Multiple Free AI Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<'pidgin' | 'english'>('pidgin');
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ theme: string; text: string }>>([]);
  const [aiHeadlines, setAiHeadlines] = useState<string[]>([]);

  // Live Canvas Preview State
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Update form fields when switching events or variants
  useEffect(() => {
    if (activeDesign) {
      setCustomData((prev) => ({
        ...prev,
        headlineTitle: activeDesign.title,
        messageQuote: activeDesign.defaultMessage,
        services: activeDesign.defaultServices,
        heroImage: userUploadedPhoto || activeDesign.heroGraphic,
        includePhoto,
      }));
    }
  }, [selectedEventType, selectedVariant, includePhoto, userUploadedPhoto]);

  const hasWatermark: boolean = userPlan === 'free';

  // Live canvas render trigger
  useEffect(() => {
    let isCancelled = false;
    const renderPreview = async () => {
      setIsRendering(true);
      try {
        const payload: EventFlyerCustomData = {
          ...customData,
          heroImage: userUploadedPhoto || activeDesign.heroGraphic,
          includePhoto,
          customBackground,
          customElements,
        };
        const dataUrl = await exportEventFlyerToDataUrl(
          activeDesign,
          payload,
          hasWatermark,
          vendor.referralCode
        );
        if (!isCancelled) {
          setPreviewDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Failed to render event flyer preview:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    const timer = setTimeout(renderPreview, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeDesign, customData, hasWatermark, vendor.referralCode, includePhoto, userUploadedPhoto, customBackground, customElements]);

  // Handle Direct Touch / Pointer Drag on the Top-Pinned Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectedVariant !== 5 || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const scale = 1080 / rect.width;
    const canvasX = (e.clientX - rect.left) * scale;
    const canvasY = (e.clientY - rect.top) * scale;

    // Check from top element to bottom
    const hitElement = [...customElements].reverse().find((el) => {
      const w = el.width || 140 * (el.scale || 1);
      const h = el.height || 140 * (el.scale || 1);
      return Math.abs(el.x - canvasX) < w / 1.3 && Math.abs(el.y - canvasY) < h / 1.3;
    });

    if (hitElement) {
      setSelectedElementId(hitElement.id);
      setIsDragging(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setElementStartPos({ x: hitElement.x, y: hitElement.y });
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    } else if (selectedElementId) {
      // Touch anywhere moves currently selected element directly
      const currentEl = customElements.find((el) => el.id === selectedElementId);
      if (currentEl) {
        setIsDragging(true);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setElementStartPos({ x: currentEl.x, y: currentEl.y });
        try {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartPos || !elementStartPos || !selectedElementId || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const scale = 1080 / rect.width;
    const deltaX = (e.clientX - dragStartPos.x) * scale;
    const deltaY = (e.clientY - dragStartPos.y) * scale;

    const newX = Math.round(Math.max(40, Math.min(1040, elementStartPos.x + deltaX)));
    const newY = Math.round(Math.max(40, Math.min(1040, elementStartPos.y + deltaY)));

    setCustomElements((prev) =>
      prev.map((el) => (el.id === selectedElementId ? { ...el, x: newX, y: newY } : el))
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartPos(null);
      setElementStartPos(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Handle Photo Upload with Bad-Camera Natural Enhancement
  const handlePhotoUpload = async (file: File) => {
    try {
      showToast('Enhancing photo...', 'Optimizing lighting, contrast & colors.', 'info');
      const downscaled = await downscaleImage(file, 1400);
      const enhanced = await enhanceBadCameraPhoto(downscaled);
      setUserUploadedPhoto(enhanced.dataUrl);
      setIncludePhoto(true);
      setCustomData((prev) => ({ ...prev, heroImage: enhanced.dataUrl, includePhoto: true }));
      showToast(
        '✨ Photo Enhanced & Added!',
        'Lighting boosted & framed cleanly in your celebration flyer.',
        'success'
      );
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUserUploadedPhoto(dataUrl);
        setIncludePhoto(true);
        setCustomData((prev) => ({ ...prev, heroImage: dataUrl, includePhoto: true }));
        showToast('Photo Added!', 'Your picture is now framed in the celebration flyer.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Copy Generation
  const handleGenerateAICopy = async (type: 'prayers' | 'headlines' = 'prayers') => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/event-greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: selectedEventType,
          eventTitle: currentCategoryMeta.title,
          businessName: customData.businessName,
          services: customData.services,
          language: aiLanguage,
        }),
      });

      const data = await response.json();
      if (data && data.quotes && data.quotes.length > 0) {
        setAiSuggestions(data.quotes);
        if (data.headline) {
          setAiHeadlines([
            data.headline,
            `${currentCategoryMeta.badge} SPECIAL DROP!`,
            `HAPPY ${currentCategoryMeta.badge} FROM ${customData.businessName.toUpperCase()}`,
          ]);
        }
        showToast('AI Suggestions Ready!', 'Tap any suggestion to apply directly to your flyer.', 'success');
      } else {
        throw new Error('Fallback to local');
      }
    } catch {
      const isPidgin = aiLanguage === 'pidgin';
      setAiSuggestions([
        {
          theme: 'Blessings & Favor',
          text: isPidgin
            ? `As we celebrate this ${currentCategoryMeta.title}, your hustle go pay big time! Overwhelming sales and peace for you and your family!`
            : `Wishing our esteemed customers overflowing favor, good health, and peace this season. Thank you for choosing us!`,
        },
        {
          theme: 'Customer Appreciation',
          text: isPidgin
            ? `To our lovely customers, una do well! Thank you for standing with ${customData.businessName}. We promise to always give una the best!`
            : `${customData.businessName} honors this special occasion with you. Here is to bigger milestones and mutual growth!`,
        },
      ]);
      setAiHeadlines([
        currentCategoryMeta.title.toUpperCase(),
        `${currentCategoryMeta.badge} SPECIAL DROP!`,
      ]);
      showToast('Wishes Generated!', 'Pick your favorite message below.', 'info');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Export & Download
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const payload: EventFlyerCustomData = {
        ...customData,
        heroImage: userUploadedPhoto || activeDesign.heroGraphic,
        includePhoto,
        customBackground,
        customElements,
      };
      const dataUrl = await exportEventFlyerToDataUrl(
        activeDesign,
        payload,
        hasWatermark,
        vendor.referralCode
      );

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${selectedEventType}_${customData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_flyer.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Flyer Downloaded!', 'Crisp 1080x1080 HD image ready for WhatsApp.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Download Error', 'Could not export flyer. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp Share
  const handleWhatsAppShare = async () => {
    const caption = `🎉 ${customData.headlineTitle}!\n\n${customData.messageQuote}\n\n📍 ${customData.address}\n📞 Call/WhatsApp: ${customData.phone}\n\n✨ *${customData.businessName}* wishes you all the best!\n\n(Create your own 10-second flyer at statuspop.ng/r/${vendor.referralCode})`;

    if (navigator.share && previewDataUrl) {
      try {
        const blob = await (await fetch(previewDataUrl)).blob();
        const file = new File([blob], `${selectedEventType}_flyer.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: customData.headlineTitle,
            text: caption,
            files: [file],
          });
          return;
        }
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(caption);
    } catch {}
    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, '_blank');
    showToast('Caption Copied!', 'Flyer message copied. Paste to your WhatsApp Status!', 'success');
  };

  // Helper label and icon for layout formats
  const getFormatBadge = (format: EventLayoutFormat) => {
    switch (format) {
      case 'circular_portal':
        return { label: 'Circular Portal', icon: '🔵', desc: 'Overlapping circles' };
      case 'organic_wave':
        return { label: 'Organic Wave', icon: '🌊', desc: 'Curved wave arch' };
      case 'card_window':
        return { label: 'Arch Window', icon: '🏛️', desc: 'Modern arch window' };
      case 'luxury_emblem':
        return { label: 'Luxury Emblem', icon: '👑', desc: 'Gold royal emblem' };
      case 'custom_studio':
        return { label: 'Custom Touch Studio', icon: '🎨', desc: 'Direct touch drag stickers & shapes' };
      default:
        return { label: 'Classic Design', icon: '✨', desc: 'Standard holiday flyer' };
    }
  };

  const selectedElement = customElements.find((e) => e.id === selectedElementId);

  return (
    <div className="min-h-screen bg-[#FFF9EC] dark:bg-[#0F1318] pb-24 text-gray-900 dark:text-gray-100 transition-colors max-w-full overflow-x-hidden">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#1A202C]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="tap-target p-2 -ml-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
              title="Back to Home"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 truncate">
              <h1 className="font-extrabold text-sm sm:text-base flex items-center gap-1.5 text-gray-900 dark:text-white truncate">
                <span>🎉 Celebration Flyer Studio</span>
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                Design is always on top as you make changes!
              </p>
            </div>
          </div>

          {/* Current Plan Badge */}
          <div className="shrink-0 flex items-center gap-2">
            {userPlan === 'free' ? (
              <button
                onClick={onOpenPricing}
                className="tap-target flex items-center gap-1 text-[11px] font-bold bg-[#FFC93C] text-[#064E2B] px-2.5 py-1.5 rounded-xl shadow-xs"
              >
                <span>₦500 Day Pass</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold bg-[#0B6B3A]/10 text-[#0B6B3A] dark:text-green-400 px-2.5 py-1 rounded-full border border-[#0B6B3A]/30">
                <Crown className="w-3.5 h-3.5 text-[#FFC93C]" />
                0 Watermark
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-3 space-y-4">
        {/* 1. WHAT YOU ARE DESIGNING IS RIGHT AT THE TOP (NO MORE ENDLESS SCROLLING) */}
        <div className="bg-white dark:bg-[#1A202C] rounded-3xl p-3.5 border border-gray-200 dark:border-gray-800 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span>Live 1:1 Flyer Preview (Always on Top)</span>
            </span>
            {selectedVariant === 5 && (
              <span className="text-[10px] font-extrabold text-[#0B6B3A] dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Move className="w-3 h-3" />
                <span>Touch & Drag stickers directly!</span>
              </span>
            )}
          </div>

          {/* Interactive Top Canvas Screen with Direct Touch Drag */}
          <div
            ref={canvasContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative aspect-square w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden bg-gray-950 shadow-inner flex items-center justify-center select-none touch-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Celebration Flyer Preview"
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="text-center text-gray-400 p-6 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FFC93C]" />
                <p className="text-xs">Generating your flyer...</p>
              </div>
            )}

            {isRendering && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                <RefreshCw className="w-6 h-6 animate-spin text-white" />
              </div>
            )}

            {/* In Format 5: Direct Visual Selection Ring and Quick Touch Handles on the Canvas */}
            {selectedVariant === 5 && selectedElement && (
              <div
                className="absolute pointer-events-none border-2 border-dashed border-[#FFC93C] rounded-full animate-pulse shadow-lg flex items-center justify-center"
                style={{
                  left: `${(selectedElement.x / 1080) * 100}%`,
                  top: `${(selectedElement.y / 1080) * 100}%`,
                  width: `${((selectedElement.width || 120 * (selectedElement.scale || 1)) / 1080) * 100}%`,
                  height: `${((selectedElement.height || 120 * (selectedElement.scale || 1)) / 1080) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="bg-[#FFC93C] text-[#111827] text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs uppercase">
                  Drag Me
                </span>
              </div>
            )}
          </div>

          {/* Direct Action Buttons Underneath Canvas (Instant Access) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              type="button"
              variant="whatsapp"
              size="sm"
              onClick={handleWhatsAppShare}
              isLoading={isExporting}
              leftIcon={<Share2 className="w-4 h-4" />}
              className="font-bold text-xs"
            >
              Share WhatsApp
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownload}
              isLoading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
              className="font-bold text-xs"
            >
              Download HD PNG
            </Button>
          </div>

          {/* Format 5 Quick Touch Adjuster Chip */}
          {selectedVariant === 5 && selectedElement && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                Selected: {selectedElement.type === 'sticker' ? selectedElement.iconType : selectedElement.shapeType || 'Element'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCustomElements((prev) =>
                      prev.map((e) =>
                        e.id === selectedElementId
                          ? { ...e, scale: Math.max((e.scale || 1) - 0.15, 0.4) }
                          : e
                      )
                    );
                  }}
                  className="tap-target px-2 py-1 rounded-lg bg-white dark:bg-gray-700 border text-xs font-bold"
                  title="Smaller"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomElements((prev) =>
                      prev.map((e) =>
                        e.id === selectedElementId
                          ? { ...e, scale: Math.min((e.scale || 1) + 0.15, 2.5) }
                          : e
                      )
                    );
                  }}
                  className="tap-target px-2 py-1 rounded-lg bg-white dark:bg-gray-700 border text-xs font-bold"
                  title="Bigger"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomElements((prev) => prev.filter((e) => e.id !== selectedElementId));
                    setSelectedElementId(customElements[0]?.id || null);
                    showToast('Removed', 'Element deleted from flyer.', 'info');
                  }}
                  className="tap-target px-2 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-xs font-bold"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. COMPACT TABBED CONTROLS UNDERNEATH (NO MORE ENDLESS SCROLLING) */}
        <div className="flex items-center justify-between bg-white dark:bg-[#1A202C] p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          {[
            { id: 'format', label: '1. Event & Style', icon: '📅' },
            { id: 'stickers', label: '2. Touch Stickers', icon: '🎨' },
            { id: 'text', label: '3. Text & AI', icon: '✍️' },
            { id: 'photo', label: '4. Photo & Info', icon: '📸' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`tap-target flex-1 py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0B6B3A] text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <span className="block sm:inline mr-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: EVENT CATEGORY & 5 FORMATS */}
        {activeTab === 'format' && (
          <Card className="space-y-4">
            {/* Holiday Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Select Holiday or Nigerian Celebration:
              </label>
              <div className="relative">
                <select
                  value={selectedEventType}
                  onChange={(e) => {
                    setSelectedEventType(e.target.value as SpecialEventType);
                    setSelectedVariant(1);
                  }}
                  className="tap-target w-full h-11 pl-3.5 pr-10 text-xs sm:text-sm font-bold rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-2 border-[#0B6B3A] outline-none cursor-pointer appearance-none"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat.type} value={cat.type}>
                      {cat.title} ({cat.dateStr})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#0B6B3A]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 5 Formats Grid */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Choose Format (Format 1-4 Curated + Format 5 Custom Touch Studio):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {currentEventDesigns.map((design) => {
                  const isSelected = selectedVariant === design.designVariant;
                  const formatInfo = getFormatBadge(design.layoutFormat);

                  return (
                    <div
                      key={design.id}
                      onClick={() => setSelectedVariant(design.designVariant)}
                      className={`tap-target relative p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0B6B3A] bg-green-50/60 dark:bg-green-950/30 ring-1 ring-[#0B6B3A]/30'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-black">
                            {formatInfo.icon} F{design.designVariant}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0B6B3A]" />}
                        </div>
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white line-clamp-1">
                          {formatInfo.label}
                        </p>
                      </div>
                      <span className="text-[9px] text-[#0B6B3A] font-semibold block truncate mt-1">
                        {design.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Festive Background Swatches */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Festive Background:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'gold_sparkles', name: 'Gold Dust', icon: '✨' },
                  { id: 'valentine_red', name: 'Red Velvet', icon: '❤️' },
                  { id: 'emerald_islamic', name: 'Emerald', icon: '🌙' },
                  { id: 'christmas_pine', name: 'Pine Snow', icon: '🌲' },
                  { id: 'indep_green', name: 'Naija Flag', icon: '🇳🇬' },
                  { id: 'royal_purple', name: 'Royal Violet', icon: '👑' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setCustomBackground(bg.id)}
                    className={`tap-target p-1.5 rounded-lg border text-left flex items-center gap-1 text-xs transition-all ${
                      customBackground === bg.id
                        ? 'border-[#0B6B3A] bg-green-100 dark:bg-green-900/40 font-bold'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span>{bg.icon}</span>
                    <span className="text-[10px] truncate">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* TAB 2: TOUCH STICKERS & CONTAINERS */}
        {activeTab === 'stickers' && (
          <Card className="space-y-4">
            <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/40 text-xs text-green-900 dark:text-green-300 flex items-center gap-2">
              <Move className="w-4 h-4 text-[#0B6B3A] shrink-0" />
              <span>
                <strong>Direct Touch Drag:</strong> Tap any sticker below to add it, then drag it directly with your finger on the top flyer preview!
              </span>
            </div>

            {/* Photo Container Shapes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Photo Container Frame (Chocolate Heart Box, Circle, Arch, Card):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: 'heart', label: 'Heart Box', icon: '💖' },
                  { type: 'circle', label: 'Circular Portal', icon: '🔵' },
                  { type: 'arch_window', label: 'Arch Window', icon: '🏛️' },
                  { type: 'rounded_card', label: 'Rounded Card', icon: '🎴' },
                ].map((shape) => (
                  <button
                    key={shape.type}
                    type="button"
                    onClick={() => {
                      setCustomElements((prev) => {
                        const existingIdx = prev.findIndex((e) => e.type === 'container');
                        if (existingIdx >= 0) {
                          const updated = [...prev];
                          updated[existingIdx] = {
                            ...updated[existingIdx],
                            shapeType: shape.type as any,
                          };
                          return updated;
                        }
                        const newEl: CustomCanvasElement = {
                          id: `el-cont-${Date.now()}`,
                          type: 'container',
                          x: 540,
                          y: 150,
                          width: 440,
                          height: 440,
                          shapeType: shape.type as any,
                        };
                        setSelectedElementId(newEl.id);
                        return [...prev, newEl];
                      });
                      showToast('Frame Set', `${shape.label} active on flyer!`, 'success');
                    }}
                    className="tap-target p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#0B6B3A] flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <span>{shape.icon}</span>
                    <span>{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Draggable Celebration Stickers */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Add Seasonal Stickers (1-Tap Add, Then Finger Drag on Canvas):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'flower', label: 'Flower', icon: '🌸' },
                  { id: 'gift_box', label: 'Gift Box', icon: '🎁' },
                  { id: 'gold_ribbon', label: 'Ribbon', icon: '🎗️' },
                  { id: 'fireworks', label: 'Fireworks', icon: '🎆' },
                  { id: 'lantern', label: 'Lantern', icon: '🏮' },
                  { id: 'heart', label: 'Red Heart', icon: '❤️' },
                  { id: 'star', label: 'Star', icon: '⭐' },
                  { id: 'holly_berry', label: 'Holly Berry', icon: '🌿' },
                  { id: 'discount_tag', label: 'Sale Tag', icon: '🏷️' },
                ].map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => {
                      const newId = `el-stk-${Date.now()}`;
                      const newEl: CustomCanvasElement = {
                        id: newId,
                        type: 'sticker',
                        iconType: stk.id as any,
                        x: 480 + Math.floor(Math.random() * 160),
                        y: 200 + Math.floor(Math.random() * 220),
                        scale: 1.0,
                      };
                      setCustomElements((prev) => [...prev, newEl]);
                      setSelectedElementId(newId);
                      setSelectedVariant(5); // Switch to custom touch format automatically
                      showToast('Sticker Added!', `Touch and drag ${stk.label} on the flyer above.`, 'success');
                    }}
                    className="tap-target p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#0B6B3A] flex items-center gap-1.5 text-xs font-bold"
                  >
                    <span className="text-base">{stk.icon}</span>
                    <span className="text-[10px] truncate">{stk.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* TAB 3: TEXT, HEADLINES & AI COPY TOOLS */}
        {activeTab === 'text' && (
          <Card className="space-y-4">
            {/* Free AI Copy Generator Bar */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0B6B3A] dark:text-green-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFC93C]" />
                  <span>Free AI Wishes & Quotes</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAiLanguage(aiLanguage === 'pidgin' ? 'english' : 'pidgin')}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border"
                >
                  {aiLanguage === 'pidgin' ? '🇳🇬 Pidgin' : '🇬🇧 English'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateAICopy('prayers')}
                  isLoading={isGeneratingAI}
                  className="text-xs font-bold"
                >
                  Generate Wishes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateAICopy('headlines')}
                  isLoading={isGeneratingAI}
                  className="text-xs font-bold"
                >
                  Generate Titles
                </Button>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto">
                  {aiSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setCustomData((prev) => ({ ...prev, messageQuote: s.text }));
                        showToast('Quote Applied!', s.theme, 'info');
                      }}
                      className="cursor-pointer p-2 rounded-xl bg-white dark:bg-gray-800 border text-xs hover:border-[#0B6B3A]"
                    >
                      <span className="font-bold text-[#0B6B3A] text-[10px] block">{s.theme}</span>
                      <p className="line-clamp-2 text-gray-700 dark:text-gray-300">"{s.text}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Your Business Name
              </label>
              <input
                type="text"
                value={customData.businessName}
                onChange={(e) => setCustomData((prev) => ({ ...prev, businessName: e.target.value }))}
                placeholder="e.g. SAS INNOVATION LIMITED"
                className="tap-target w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold outline-none"
              />
            </div>

            {/* Celebration Headline */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Headline Title on Flyer
              </label>
              <input
                type="text"
                value={customData.headlineTitle}
                onChange={(e) => setCustomData((prev) => ({ ...prev, headlineTitle: e.target.value }))}
                placeholder="e.g. HAPPY INDEPENDENCE DAY NIGERIA!"
                className="tap-target w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-[#0B6B3A] outline-none"
              />
            </div>

            {/* Celebration Message / Quote */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Celebration Prayer or Quote
              </label>
              <textarea
                rows={2}
                value={customData.messageQuote}
                onChange={(e) => setCustomData((prev) => ({ ...prev, messageQuote: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs outline-none"
              />
            </div>

            {/* 4 Services */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                4 Services / Highlights
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={customData.services[idx] || ''}
                    onChange={(e) => {
                      const updated = [...customData.services];
                      updated[idx] = e.target.value;
                      setCustomData((prev) => ({ ...prev, services: updated }));
                    }}
                    placeholder={`Service ${idx + 1}`}
                    className="tap-target px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold outline-none"
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* TAB 4: PHOTO, HOTLINE & ADDRESS */}
        {activeTab === 'photo' && (
          <Card className="space-y-4">
            {/* Include Photo Toggle */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-extrabold text-xs text-gray-900 dark:text-white">
                  Include Photo in Frame?
                </h3>
                <p className="text-[10px] text-gray-500">
                  {includePhoto ? 'Your photo is framed in the layout.' : 'Pure festive artwork & vectors.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIncludePhoto(!includePhoto)}
                className={`tap-target relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includePhoto ? 'bg-[#0B6B3A]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    includePhoto ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {includePhoto && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                  }}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                  }}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  leftIcon={<Camera className="w-4 h-4 text-[#0B6B3A]" />}
                  className="text-xs font-bold"
                >
                  Camera
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-4 h-4 text-[#0B6B3A]" />}
                  className="text-xs font-bold"
                >
                  Gallery
                </Button>

                {userUploadedPhoto && (
                  <button
                    type="button"
                    onClick={() => setUserUploadedPhoto(null)}
                    className="tap-target text-xs text-red-600 font-bold px-2 py-1"
                  >
                    Reset Preset
                  </button>
                )}
              </div>
            )}

            {/* Phone & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Call / WhatsApp Hotline
                </label>
                <input
                  type="tel"
                  value={customData.phone}
                  onChange={(e) => setCustomData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="08023456789"
                  className="tap-target w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Website / Social Handle
                </label>
                <input
                  type="text"
                  value={customData.website}
                  onChange={(e) => setCustomData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="www.statuspop.ng"
                  className="tap-target w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Office / Workshop Address (Never overflows)
              </label>
              <input
                type="text"
                value={customData.address}
                onChange={(e) => setCustomData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Suite 14, Simbiat Abiola Way, Ikeja Computer Village, Lagos"
                className="tap-target w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
              />
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};
