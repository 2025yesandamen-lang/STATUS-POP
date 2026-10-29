import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Camera,
  Upload,
  Download,
  Share2,
  Check,
  Crown,
  Sparkles,
  Scissors,
  Wrench,
  Shirt,
  Utensils,
  Smartphone,
  Flame,
  Phone,
  MapPin,
  HelpCircle,
  RefreshCw,
  Eye,
  Layers,
} from 'lucide-react';
import { VendorProfile, UserPlan } from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { useToast } from '../ui/Toast.tsx';
import { formatWhatsAppPhone, formatDisplayPhone } from '../../lib/format.ts';
import { downscaleImage, enhanceBadCameraPhoto } from '../../lib/imageProcessing.ts';
import { drawImageInSlot } from '../../lib/render.ts';
import QRCode from 'qrcode';

interface WhatsAppDPGeneratorProps {
  userPlan: UserPlan;
  vendor: VendorProfile;
  onBack: () => void;
  onOpenPricing: () => void;
  onRecordExport: () => boolean;
}

// Industry Presets specifically for Tailors, Barbers, Mechanics, Electricians, Chefs, Tech vendors
interface DPSectorPreset {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  themeColor: string;
  defaultServices: string[];
  samplePhoto: string;
}

const DP_SECTORS: DPSectorPreset[] = [
  {
    id: 'tailor',
    name: 'Tailor & Fashion Designer',
    icon: '✂️',
    tagline: 'BESPOKE SENATOR & NATIVE WEARS',
    themeColor: '#176B5B',
    defaultServices: ['Senator Styles', 'Agbada & Kaftan', 'Corporate Suits', '48hr Express Delivery'],
    samplePhoto: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'barber',
    name: 'Executive Barber & Salon',
    icon: '💈',
    tagline: 'VIP GROOMING & SKIN FADES',
    themeColor: '#9A653C',
    defaultServices: ['Skin Fade & Beard Dye', 'Facial & Black Mask', 'Home VIP Service', 'Dreadlocks & Braids'],
    samplePhoto: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'mechanic',
    name: 'Auto Mechanic & OBD Scan',
    icon: '🔧',
    tagline: 'TOKUNBO ENGINES & DIAGNOSTICS',
    themeColor: '#A4493D',
    defaultServices: ['Computer OBD Scanning', 'Gearbox & Engine Fix', 'Tokunbo Spare Parts', '24/7 Highway Towing'],
    samplePhoto: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'artisan',
    name: 'Electrician & AC Repair',
    icon: '⚡',
    tagline: 'COOLING, INVERTER & WIRING',
    themeColor: '#456B8A',
    defaultServices: ['AC Servicing & Gas', 'Solar & Inverter Setup', 'Building Wiring', 'Tested Safety Standards'],
    samplePhoto: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'food',
    name: 'Chef, Catering & Buka',
    icon: '🍲',
    tagline: 'PARTY JOLLOF & FRESH SOUPS',
    themeColor: '#B85F3C',
    defaultServices: ['Firewood Party Jollof', 'Bowls of Native Soups', 'Peppered Meat & Fish', 'Outdoor Event Catering'],
    samplePhoto: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'tech',
    name: 'Phones & Laptop Hub',
    icon: '📱',
    tagline: 'UK USED PHONES & ACCESSORIES',
    themeColor: '#65558A',
    defaultServices: ['Clean UK Used Phones', 'Screen & Battery Swap', 'MacBook & Laptops', 'Nationwide Waybill'],
    samplePhoto: 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&auto=format&fit=crop&q=80',
  },
];

export const WhatsAppDPGenerator: React.FC<WhatsAppDPGeneratorProps> = ({
  userPlan,
  vendor,
  onBack,
  onOpenPricing,
  onRecordExport,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Active sector preset
  const [selectedSector, setSelectedSector] = useState<string>('tailor');
  const currentSector = DP_SECTORS.find((s) => s.id === selectedSector) || DP_SECTORS[0];

  // DP Custom Form Data
  const [dpData, setDpData] = useState({
    businessName: vendor.businessName || 'SEYI NIGERIAN BESPOKE TAILORS',
    tagline: currentSector.tagline,
    services: currentSector.defaultServices,
    phone: vendor.phone || '08023456789',
    address: vendor.address || 'Yaba Tejuosho Market, Lagos',
    themeColor: currentSector.themeColor,
    avatarImage: currentSector.samplePhoto,
    layoutStyle: 'circle_badge' as 'circle_badge' | 'modern_card' | 'luxury_gold' | 'square_editorial',
  });

  // Circular WhatsApp crop guide toggle (shows what is inside the round avatar)
  const [showCropGuide, setShowCropGuide] = useState<boolean>(true);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sector' | 'details' | 'services' | 'theme'>('sector');
  const freeDpsUsed = Math.min(vendor.whatsappDpsCreatedTotal || 0, 2);

  // Handle Sector Change
  const handleSelectSector = (secId: string) => {
    setSelectedSector(secId);
    const sec = DP_SECTORS.find((s) => s.id === secId);
    if (sec) {
      setDpData((prev) => ({
        ...prev,
        tagline: sec.tagline,
        services: sec.defaultServices,
        themeColor: sec.themeColor,
        avatarImage: prev.avatarImage === currentSector.samplePhoto ? sec.samplePhoto : prev.avatarImage,
      }));
      showToast(`${sec.name} Loaded!`, 'Services and styling configured.', 'info');
    }
  };

  // Image Upload with Auto Bad-Camera Enhancement
  const handlePhotoUpload = async (file: File) => {
    try {
      showToast('Enhancing photo...', 'Optimizing bad camera lighting & facial clarity.', 'info');
      const downscaled = await downscaleImage(file, 1200);
      const enhanced = await enhanceBadCameraPhoto(downscaled);
      setDpData((prev) => ({ ...prev, avatarImage: enhanced.dataUrl }));
      showToast(
        '✨ Profile Photo Enhanced!',
        'Lighting boosted, colors calibrated & framed cleanly for WhatsApp DP.',
        'success'
      );
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setDpData((prev) => ({ ...prev, avatarImage: dataUrl }));
        showToast('Profile Photo Updated!', 'Framed cleanly for WhatsApp DP.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Render Canvas for 1080x1080 WhatsApp Profile Picture
  useEffect(() => {
    let isCancelled = false;

    const renderDP = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Background Fill
        const isEditorialSquare = dpData.layoutStyle === 'square_editorial';
        const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
        if (isEditorialSquare) {
          bgGrad.addColorStop(0, '#FBFAF6');
          bgGrad.addColorStop(1, '#E9F0EB');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, 1080, 1080);
        } else if (dpData.layoutStyle === 'luxury_gold') {
          bgGrad.addColorStop(0, '#0F1218');
          bgGrad.addColorStop(1, '#1A202C');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, 1080, 1080);
        } else {
          bgGrad.addColorStop(0, '#0F172A');
          bgGrad.addColorStop(0.5, '#1E293B');
          bgGrad.addColorStop(1, '#0B0F19');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, 1080, 1080);
        }

        // Subtle decorative rings centered at 540, 540
        ctx.save();
        if (isEditorialSquare) {
          ctx.strokeStyle = `${dpData.themeColor}55`;
          ctx.lineWidth = 3;
          ctx.strokeRect(34, 34, 1012, 1012);
        } else {
          ctx.strokeStyle = `${dpData.themeColor}33`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(540, 540, 520, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(540, 540, 480, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // 2. Preload Avatar Image
        let avatarImg: HTMLImageElement | null = null;
        if (dpData.avatarImage) {
          avatarImg = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = dpData.avatarImage;
          });
        }

        // 3. Central Photo Frame
        const photoCx = 540;
        const photoCy = isEditorialSquare ? 360 : 390;
        const photoRadius = 220;
        const photoSize = 440;

        ctx.save();
        ctx.shadowColor = isEditorialSquare ? 'rgba(24, 34, 48, 0.22)' : dpData.themeColor;
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 12;
        ctx.fillStyle = dpData.themeColor;
        if (isEditorialSquare) {
          ctx.beginPath();
          ctx.roundRect(photoCx - photoSize / 2 - 12, photoCy - photoSize / 2 - 12, photoSize + 24, photoSize + 24, 36);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(photoCx, photoCy, photoRadius + 12, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        if (isEditorialSquare) {
          ctx.beginPath();
          ctx.roundRect(photoCx - photoSize / 2 - 4, photoCy - photoSize / 2 - 4, photoSize + 8, photoSize + 8, 32);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(photoCx, photoCy, photoRadius + 4, 0, Math.PI * 2);
          ctx.fill();
        }
        if (avatarImg) {
          drawImageInSlot(ctx, avatarImg, photoCx, photoCy, photoSize, photoSize, {
            borderRadius: isEditorialSquare ? 24 : undefined,
            clipShape: isEditorialSquare ? undefined : 'circle',
          });
        } else {
          ctx.fillStyle = '#374151';
          if (isEditorialSquare) {
            ctx.beginPath();
            ctx.roundRect(photoCx - photoSize / 2, photoCy - photoSize / 2, photoSize, photoSize, 24);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(photoCx, photoCy, photoRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // 5. Business Name (Large & Centered)
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = isEditorialSquare ? '#182230' : '#FFFFFF';
        ctx.font = '900 44px "Anton", "Montserrat", sans-serif';
        let bName = dpData.businessName.toUpperCase();
        if (ctx.measureText(bName).width > 900) {
          ctx.font = '900 36px "Anton", "Montserrat", sans-serif';
        }
        ctx.fillText(bName, 540, 695);

        // Tagline / Slogan
        ctx.fillStyle = isEditorialSquare ? '#456156' : '#FFC93C';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText(dpData.tagline.toUpperCase(), 540, 735);
        ctx.restore();

        // 6. Services Pill Grid (4 Services Tagged)
        const servicesY = 770;
        const sList = dpData.services.slice(0, 4);
        const pillW = 420;
        const pillH = 50;

        sList.forEach((srv, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const px = col === 0 ? 540 - pillW - 15 : 540 + 15;
          const py = servicesY + row * (pillH + 12);

          ctx.save();
          ctx.fillStyle = isEditorialSquare ? `${dpData.themeColor}12` : 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.roundRect(px, py, pillW, pillH, 25);
          ctx.fill();
          ctx.strokeStyle = `${dpData.themeColor}66`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Green bullet dot
          ctx.fillStyle = '#25D366';
          ctx.beginPath();
          ctx.arc(px + 24, py + pillH / 2, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isEditorialSquare ? '#182230' : '#F8FAFC';
          ctx.font = '900 20px "Inter", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          let sText = srv;
          if (ctx.measureText(sText).width > pillW - 60) {
            ctx.font = 'bold 17px "Inter", sans-serif';
          }
          ctx.fillText(sText, px + 44, py + pillH / 2);
          ctx.restore();
        });

        // 7. Hotline & WhatsApp Contact Bar at Bottom
        const contactY = 910;
        ctx.save();
        ctx.fillStyle = isEditorialSquare ? dpData.themeColor : '#064E2B';
        ctx.beginPath();
        ctx.roundRect(140, contactY, 800, 72, 36);
        ctx.fill();
        ctx.strokeStyle = isEditorialSquare ? `${dpData.themeColor}AA` : '#25D366';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 32px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `📞 WHATSAPP / CALL: ${dpData.phone}`,
          540,
          contactY + 36
        );
        ctx.restore();

        // Address snippet
        ctx.save();
        ctx.fillStyle = isEditorialSquare ? '#596579' : '#94A3B8';
        ctx.font = '500 18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📍 ${dpData.address}`, 540, 1015);
        ctx.restore();

        // 8. WhatsApp Circular Crop Guide Overlay (Drawn if enabled)
        if (showCropGuide) {
          ctx.save();
          // Draw a semi-transparent dark vignette outside WhatsApp's 1:1 circle (radius 520)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.beginPath();
          ctx.rect(0, 0, 1080, 1080);
          ctx.arc(540, 540, 510, 0, Math.PI * 2, true);
          ctx.fill();

          // Green circle crop boundary line
          ctx.strokeStyle = '#25D366';
          ctx.lineWidth = 5;
          ctx.setLineDash([16, 12]);
          ctx.beginPath();
          ctx.arc(540, 540, 510, 0, Math.PI * 2);
          ctx.stroke();

          // Guide indicator tag
          ctx.setLineDash([]);
          ctx.fillStyle = '#25D366';
          ctx.beginPath();
          ctx.roundRect(540 - 150, 20, 300, 36, 18);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('WhatsApp Profile Crop Safe Area', 540, 38);
          ctx.restore();
        }

        if (!isCancelled) {
          setPreviewDataUrl(canvas.toDataURL('image/png', 1.0));
        }
      } catch (e) {
        console.error('Failed to render WhatsApp DP:', e);
      }
    };

    renderDP();
    return () => {
      isCancelled = true;
    };
  }, [dpData, showCropGuide]);

  // Export Clean HD Image for WhatsApp Profile Picture
  const handleDownloadDP = async () => {
    setIsExporting(true);
    try {
      // Render without the crop guide
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const isEditorialSquare = dpData.layoutStyle === 'square_editorial';

      // 1. Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
      if (isEditorialSquare) {
        bgGrad.addColorStop(0, '#FBFAF6');
        bgGrad.addColorStop(1, '#E9F0EB');
        ctx.fillStyle = bgGrad;
      } else {
        bgGrad.addColorStop(0, '#0F172A');
        bgGrad.addColorStop(0.5, '#1E293B');
        bgGrad.addColorStop(1, '#0B0F19');
        ctx.fillStyle = bgGrad;
      }
      ctx.fillRect(0, 0, 1080, 1080);

      // Rings
      ctx.save();
      if (isEditorialSquare) {
        ctx.strokeStyle = `${dpData.themeColor}55`;
        ctx.lineWidth = 3;
        ctx.strokeRect(34, 34, 1012, 1012);
      } else {
        ctx.strokeStyle = `${dpData.themeColor}33`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(540, 540, 520, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Preload Avatar
      let avatarImg: HTMLImageElement | null = null;
      if (dpData.avatarImage) {
        avatarImg = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = dpData.avatarImage;
        });
      }

      // Central Photo Frame
      const photoCx = 540;
      const photoCy = isEditorialSquare ? 360 : 390;
      const photoRadius = 220;
      const photoSize = 440;

      ctx.save();
      ctx.shadowColor = isEditorialSquare ? 'rgba(24, 34, 48, 0.22)' : dpData.themeColor;
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = dpData.themeColor;
      if (isEditorialSquare) {
        ctx.beginPath();
        ctx.roundRect(photoCx - photoSize / 2 - 12, photoCy - photoSize / 2 - 12, photoSize + 24, photoSize + 24, 36);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(photoCx, photoCy, photoRadius + 12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      if (isEditorialSquare) {
        ctx.beginPath();
        ctx.roundRect(photoCx - photoSize / 2 - 4, photoCy - photoSize / 2 - 4, photoSize + 8, photoSize + 8, 32);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(photoCx, photoCy, photoRadius + 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (avatarImg) {
        drawImageInSlot(ctx, avatarImg, photoCx, photoCy, photoSize, photoSize, {
          borderRadius: isEditorialSquare ? 24 : undefined,
          clipShape: isEditorialSquare ? undefined : 'circle',
        });
      } else {
        ctx.fillStyle = '#374151';
        if (isEditorialSquare) {
          ctx.beginPath();
          ctx.roundRect(photoCx - photoSize / 2, photoCy - photoSize / 2, photoSize, photoSize, 24);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(photoCx, photoCy, photoRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Business Name
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = isEditorialSquare ? '#182230' : '#FFFFFF';
      ctx.font = '900 44px "Anton", "Montserrat", sans-serif';
      let bName = dpData.businessName.toUpperCase();
      if (ctx.measureText(bName).width > 900) {
        ctx.font = '900 36px "Anton", "Montserrat", sans-serif';
      }
      ctx.fillText(bName, 540, 695);

      ctx.fillStyle = isEditorialSquare ? '#456156' : '#FFC93C';
      ctx.font = 'bold 22px "Inter", sans-serif';
      ctx.fillText(dpData.tagline.toUpperCase(), 540, 735);
      ctx.restore();

      // Services Pill Grid
      const servicesY = 770;
      const sList = dpData.services.slice(0, 4);
      const pillW = 420;
      const pillH = 50;

      sList.forEach((srv, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const px = col === 0 ? 540 - pillW - 15 : 540 + 15;
        const py = servicesY + row * (pillH + 12);

        ctx.save();
        ctx.fillStyle = isEditorialSquare ? `${dpData.themeColor}12` : 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.roundRect(px, py, pillW, pillH, 25);
        ctx.fill();
        ctx.strokeStyle = `${dpData.themeColor}66`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#25D366';
        ctx.beginPath();
        ctx.arc(px + 24, py + pillH / 2, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isEditorialSquare ? '#182230' : '#F8FAFC';
        ctx.font = '900 20px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        let sText = srv;
        if (ctx.measureText(sText).width > pillW - 60) {
          ctx.font = 'bold 17px "Inter", sans-serif';
        }
        ctx.fillText(sText, px + 44, py + pillH / 2);
        ctx.restore();
      });

      // Hotline
      const contactY = 910;
      ctx.save();
      ctx.fillStyle = isEditorialSquare ? dpData.themeColor : '#064E2B';
      ctx.beginPath();
      ctx.roundRect(140, contactY, 800, 72, 36);
      ctx.fill();
      ctx.strokeStyle = isEditorialSquare ? `${dpData.themeColor}AA` : '#25D366';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 32px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`📞 WHATSAPP / CALL: ${dpData.phone}`, 540, contactY + 36);
      ctx.restore();

      // Address
      ctx.save();
      ctx.fillStyle = isEditorialSquare ? '#596579' : '#94A3B8';
      ctx.font = '500 18px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📍 ${dpData.address}`, 540, 1015);
      ctx.restore();

      const finalUrl = canvas.toDataURL('image/png', 1.0);
      if (dpData.layoutStyle === 'square_editorial' && userPlan === 'free') {
        showToast('Pro DP template', 'The Editorial Square template is available on the Day Pass or Pro plan.', 'info');
        onOpenPricing();
        return;
      }
      if (!onRecordExport()) {
        showToast('Free DP trial complete', 'Your two free profile-picture downloads are used. Upgrade for unlimited DP exports.', 'info');
        onOpenPricing();
        return;
      }
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `${dpData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_whatsapp_dp.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Profile Picture Downloaded!', 'Crisp 1080x1080 DP ready to set on WhatsApp!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Download Error', 'Could not export profile picture.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9EC] dark:bg-[#0F1318] text-gray-900 dark:text-gray-100 flex flex-col font-sans pb-16">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#1A202C]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="tap-target -ml-2 p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 font-bold text-xs"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <h1 className="font-black text-sm sm:text-base text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
              <span>🟢</span>
              <span>WhatsApp Profile Picture (DP) Creator</span>
            </h1>
            <p className="text-[10px] text-gray-500">
              For Tailors, Barbers, Mechanics & Artisans · {userPlan === 'free' ? `${freeDpsUsed}/2 free DPs used` : 'Unlimited DPs'}
            </p>
          </div>

          <Button
            type="button"
            variant="whatsapp"
            size="sm"
            onClick={handleDownloadDP}
            isLoading={isExporting}
            className="text-xs font-bold shadow-xs"
          >
            Save DP
          </Button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto w-full px-4 py-4 space-y-4">
        {/* 1. TOP-PINNED LIVE WHATSAPP DP PREVIEW */}
        <div className="bg-white dark:bg-[#1A202C] rounded-3xl p-4 border border-gray-200 dark:border-gray-800 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span>Live 1:1 WhatsApp DP Preview</span>
            </span>

            {/* Crop Guide Toggle */}
            <button
              type="button"
              onClick={() => setShowCropGuide(!showCropGuide)}
              className={`tap-target px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                showCropGuide
                  ? 'bg-green-100 dark:bg-green-950/60 text-[#0B6B3A] border-[#0B6B3A]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 border-gray-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showCropGuide ? 'WhatsApp Crop ON' : 'WhatsApp Crop OFF'}</span>
            </button>
          </div>

          {/* Canvas Display Screen */}
          <div className="relative aspect-square w-full max-w-[380px] mx-auto rounded-2xl overflow-hidden bg-gray-950 shadow-inner flex items-center justify-center">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="WhatsApp Profile Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400 p-4">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FFC93C] mb-2" />
                <p className="text-xs">Generating WhatsApp DP...</p>
              </div>
            )}
          </div>

          {/* Quick Photo Actions Directly Underneath Preview */}
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
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
              Take Your Photo
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-4 h-4 text-[#0B6B3A]" />}
              className="text-xs font-bold"
            >
              Upload Gallery
            </Button>
          </div>
        </div>

        {/* 2. COMPACT TABBED CONTROLS UNDERNEATH (NO ENDLESS SCROLLING) */}
        <div className="flex items-center justify-between bg-white dark:bg-[#1A202C] p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          {[
            { id: 'sector', label: '1. Trade / Sector', icon: '👔' },
            { id: 'services', label: '2. 4 Services', icon: '🛠️' },
            { id: 'details', label: '3. Name & Phone', icon: '🏷️' },
            { id: 'theme', label: '4. Colors', icon: '🎨' },
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

        {/* TAB 1: TRADE / SECTOR PRESETS */}
        {activeTab === 'sector' && (
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#0B6B3A] dark:text-green-400">
                Choose Your Profession (Auto-fills Services & Taglines)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DP_SECTORS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleSelectSector(sec.id)}
                  className={`tap-target p-3 rounded-2xl border-2 text-left transition-all ${
                    selectedSector === sec.id
                      ? 'border-[#0B6B3A] bg-green-50/60 dark:bg-green-950/30 ring-1 ring-[#0B6B3A]/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{sec.icon}</div>
                  <div className="font-extrabold text-xs text-gray-900 dark:text-white line-clamp-1">
                    {sec.name}
                  </div>
                  <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                    {sec.tagline}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* TAB 2: 4 SERVICES LIST (PROMINENT ON DP) */}
        {activeTab === 'services' && (
          <Card className="space-y-3">
            <div>
              <h3 className="font-extrabold text-xs text-gray-900 dark:text-white">
                4 Core Services Displayed on Profile Picture
              </h3>
              <p className="text-[11px] text-gray-500">
                Clients see these bullet points on your WhatsApp DP.
              </p>
            </div>

            <div className="space-y-2">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-[#0B6B3A] text-xs font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={dpData.services[idx] || ''}
                    onChange={(e) => {
                      const updated = [...dpData.services];
                      updated[idx] = e.target.value;
                      setDpData((prev) => ({ ...prev, services: updated }));
                    }}
                    placeholder={`e.g. Service ${idx + 1}`}
                    className="tap-target w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-[#0B6B3A]"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* TAB 3: BUSINESS NAME, HOTLINE & ADDRESS */}
        {activeTab === 'details' && (
          <Card className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Your Business or Brand Name *
              </label>
              <input
                type="text"
                value={dpData.businessName}
                onChange={(e) => setDpData((prev) => ({ ...prev, businessName: e.target.value }))}
                placeholder="e.g. SEYI BESPOKE TAILORS LAGOS"
                className="tap-target w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-[#0B6B3A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Tagline / Specialty
              </label>
              <input
                type="text"
                value={dpData.tagline}
                onChange={(e) => setDpData((prev) => ({ ...prev, tagline: e.target.value }))}
                placeholder="e.g. BESPOKE SENATOR & NATIVE WEARS"
                className="tap-target w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold focus:ring-2 focus:ring-[#0B6B3A] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp Hotline
                </label>
                <input
                  type="tel"
                  value={dpData.phone}
                  onChange={(e) => setDpData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="08023456789"
                  className="tap-target w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Shop Address / City
                </label>
                <input
                  type="text"
                  value={dpData.address}
                  onChange={(e) => setDpData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Tejuosho Market Yaba"
                  className="tap-target w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold outline-none"
                />
              </div>
            </div>
          </Card>
        )}

        {/* TAB 4: ACCENT THEME COLOR */}
        {activeTab === 'theme' && (
          <Card className="space-y-3">
            <div>
              <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">DP Template</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDpData((prev) => ({ ...prev, layoutStyle: 'circle_badge' }))}
                  className={`tap-target rounded-xl border-2 p-3 text-left text-xs font-bold ${dpData.layoutStyle === 'circle_badge' ? 'border-[#0B6B3A] bg-green-50 dark:bg-green-950/30' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  Classic Circle <span className="block text-[10px] font-normal text-gray-500">Available on free trial</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (userPlan === 'free') {
                      onOpenPricing();
                      showToast('Pro DP template', 'The Editorial Square template is available on the Day Pass or Pro plan.', 'info');
                      return;
                    }
                    setDpData((prev) => ({ ...prev, layoutStyle: 'square_editorial' }));
                  }}
                  className={`tap-target rounded-xl border-2 p-3 text-left text-xs font-bold ${dpData.layoutStyle === 'square_editorial' ? 'border-[#0B6B3A] bg-green-50 dark:bg-green-950/30' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  Editorial Square {userPlan === 'free' ? '🔒' : ''}
                  <span className="block text-[10px] font-normal text-gray-500">Premium business-ready layout</span>
                </button>
              </div>
            </div>
            <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">
              Pick Your Brand Color
            </span>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { name: 'Evergreen', color: '#176B5B' },
                { name: 'Warm Bronze', color: '#9A653C' },
                { name: 'Terracotta', color: '#A4493D' },
                { name: 'Steel Blue', color: '#456B8A' },
                { name: 'Copper', color: '#B85F3C' },
                { name: 'Plum', color: '#65558A' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setDpData((prev) => ({ ...prev, themeColor: c.color }))}
                  className={`tap-target p-2.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                    dpData.themeColor === c.color
                      ? 'border-[#0B6B3A] bg-green-50 dark:bg-green-950/40 ring-1 ring-[#0B6B3A]'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full shadow-xs"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Primary Download / Share Button Bar */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleDownloadDP}
            isLoading={isExporting}
            leftIcon={<Download className="w-5 h-5" />}
            className="font-bold text-xs"
          >
            Download WhatsApp DP
          </Button>

          <Button
            type="button"
            variant="whatsapp"
            size="lg"
            onClick={() => {
              void handleDownloadDP();
            }}
            leftIcon={<Share2 className="w-5 h-5" />}
            className="font-bold text-xs"
          >
            Set as WhatsApp DP
          </Button>
        </div>
      </main>
    </div>
  );
};
