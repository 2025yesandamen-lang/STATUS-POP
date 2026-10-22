import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { FlyerTemplate, UserFlyerData, ASPECT_RATIOS } from '../../types/index.ts';
import { formatNaira, calculateDiscount } from '../../lib/format.ts';
import { calculateFittedFontSize } from '../../lib/render.ts';
import { ensureFontsLoaded } from '../../lib/imageProcessing.ts';
import { drawSectorBackgroundPattern, drawSectorDecorations } from '../../lib/sectorGraphics.ts';

export interface FlyerCanvasProps {
  template: FlyerTemplate;
  userData: UserFlyerData;
  scale?: number;
  showWatermark?: boolean;
  referralCode?: string;
  className?: string;
}

export const FlyerCanvas: React.FC<FlyerCanvasProps> = ({
  template,
  userData,
  scale = 0.25,
  showWatermark = true,
  referralCode = 'demo',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const { width: fullWidth, height: fullHeight } = ASPECT_RATIOS[userData.aspectRatio];
  const previewWidth = Math.round(fullWidth * scale);
  const previewHeight = Math.round(fullHeight * scale);

  // Preload fonts
  useEffect(() => {
    let isMounted = true;
    ensureFontsLoaded([
      'Anton',
      'Bebas Neue',
      'Playfair Display',
      'Pacifico',
      'Poppins',
      'Montserrat',
      'Inter',
    ]).then(() => {
      if (isMounted) setFontsLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Generate QR Code data URL for preview
  useEffect(() => {
    if (showWatermark) {
      QRCode.toDataURL(`https://statuspop.ng/r/${referralCode}?src=qr`, {
        margin: 1,
        width: 128,
      }).then((url) => setQrDataUrl(url));
    }
  }, [showWatermark, referralCode]);

  // Draw preview onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina support
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = previewWidth * dpr;
    canvas.height = previewHeight * dpr;
    ctx.scale(dpr * scale, dpr * scale);

    const baseWidth = 1080;
    const baseHeight = 1920;
    const scaleY = fullHeight / baseHeight;

    // Background
    for (const layer of template.layers) {
      if (layer.type === 'background') {
        if (layer.fillType === 'gradient') {
          const grad = ctx.createLinearGradient(0, 0, fullWidth, fullHeight);
          grad.addColorStop(0, layer.color1);
          grad.addColorStop(1, layer.color2 || layer.color1);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, fullWidth, fullHeight);
        } else {
          ctx.fillStyle = layer.color1;
          ctx.fillRect(0, 0, fullWidth, fullHeight);
        }

        if (layer.accentCircleColor && layer.accentCircleRadius && layer.accentCirclePos) {
          ctx.save();
          ctx.beginPath();
          const cx = (layer.accentCirclePos.x / baseWidth) * fullWidth;
          const cy = layer.accentCirclePos.y * scaleY;
          const rad = layer.accentCircleRadius * Math.min(1, scaleY);
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.fillStyle = layer.accentCircleColor;
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Render sector-specific background textures, ambient glows & patterns
    drawSectorBackgroundPattern(ctx, template.theme, fullWidth, fullHeight, scaleY);

    // Prepare list of images to draw
    const rawImages = userData.productImages?.length > 0
      ? userData.productImages
      : userData.productImage
      ? [userData.productImage]
      : [];

    const drawAllLayers = (imgElements: (HTMLImageElement | null)[], qrImg: HTMLImageElement | null) => {
      // Render sector-specific top banners, stamps & frames
      drawSectorDecorations(ctx, template.theme, fullWidth, fullHeight, scaleY);

      for (const layer of template.layers) {
        if (layer.type === 'product_image') {
          const slot = layer.slotIndex ?? 0;
          const imgObj = imgElements[slot] || imgElements[0];

          const px = (layer.x / baseWidth) * fullWidth;
          const py = layer.y * scaleY;
          const pw = layer.width * Math.min(1, scaleY);
          const ph = layer.height * Math.min(1, scaleY);

          if (imgObj) {
            ctx.save();
            if (layer.shadowBlur) {
              ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.5)';
              ctx.shadowBlur = layer.shadowBlur;
              ctx.shadowOffsetY = layer.shadowOffsetY || 15;
            }

            if (layer.borderRadius) {
              ctx.beginPath();
              ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, layer.borderRadius);
              ctx.clip();
            }

            ctx.drawImage(imgObj, px - pw / 2, py - ph / 2, pw, ph);
            ctx.restore();

            // Multi-Product Support: Separate Name & Price per slot (e.g. iPhone, Samsung, Tecno, Itel)
            const itemData = userData.multiProducts?.[slot];
            if (userData.multiProductMode === 'separate_products' && itemData) {
              // Separate Product Name Banner
              if (itemData.name) {
                ctx.save();
                ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
                ctx.beginPath();
                ctx.roundRect(px - pw / 2 + 10, py - ph / 2 + 10, pw - 20, 44, 12);
                ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 20px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(itemData.name, px, py - ph / 2 + 32);
                ctx.restore();
              }

              // Separate Price Tag Pill
              if (itemData.price > 0) {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.4)';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#FFC93C';
                ctx.beginPath();
                ctx.roundRect(px - 110, py + ph / 2 - 56, 220, 46, 14);
                ctx.fill();
                ctx.strokeStyle = '#111827';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.fillStyle = '#064E2B';
                ctx.font = '900 24px "Montserrat", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(formatNaira(itemData.price), px, py + ph / 2 - 33);
                ctx.restore();
              }
            } else if (layer.label) {
              ctx.save();
              ctx.font = 'bold 24px "Inter", sans-serif';
              ctx.fillStyle = 'rgba(0,0,0,0.7)';
              ctx.beginPath();
              ctx.roundRect(px - 60, py - ph / 2 + 15, 120, 36, 12);
              ctx.fill();
              ctx.fillStyle = '#FFFFFF';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(layer.label, px, py - ph / 2 + 33);
              ctx.restore();
            }
          } else {
            // Placeholder box
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 12]);
            ctx.beginPath();
            ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, layer.borderRadius || 24);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = 'bold 32px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Photo Slot ${slot + 1}`, px, py);
            ctx.restore();
          }
        } else if (layer.type === 'badge') {
          const discount = userData.discountPct || calculateDiscount(userData.price, userData.oldPrice);
          let text = layer.defaultText || '';
          if (layer.badgeType === 'discount' && discount > 0) {
            text = `-${discount}% OFF`;
          } else if (!text) {
            text = 'VERIFIED';
          }

          if (text) {
            ctx.save();
            const bx = (layer.x / baseWidth) * fullWidth;
            const by = layer.y * scaleY;
            const fontSize = layer.fontSize * Math.min(1, scaleY);
            ctx.font = `bold ${fontSize}px "${layer.fontFamily}", sans-serif`;
            const metrics = ctx.measureText(text);
            const padX = 26;
            const padY = 14;
            const bw = metrics.width + padX * 2;
            const bh = fontSize + padY * 2;

            ctx.fillStyle = layer.fill;
            ctx.beginPath();
            ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, layer.cornerRadius || 20);
            ctx.fill();

            ctx.fillStyle = layer.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, bx, by);
            ctx.restore();
          }
        } else if (layer.type === 'text') {
          let content = '';
          if (layer.textKey === 'businessName') content = userData.businessName.toUpperCase();
          else if (layer.textKey === 'headline') content = userData.headline;
          else if (layer.textKey === 'subtitle') content = userData.subtitle || layer.defaultText;
          else if (layer.textKey === 'productName') content = userData.productName;
          else if (layer.textKey === 'price') content = formatNaira(userData.price);
          else if (layer.textKey === 'phone') content = userData.phone;
          else content = layer.defaultText;

          if (content) {
            ctx.save();
            const tx = (layer.x / baseWidth) * fullWidth;
            const ty = layer.y * scaleY;
            const baseFontSize = layer.fontSize * Math.min(1, scaleY);
            const maxBoxWidth = fullWidth * 0.92;
            const fittedSize = calculateFittedFontSize(
              content,
              layer.fontFamily,
              baseFontSize,
              maxBoxWidth,
              layer.maxLines || 1
            );

            ctx.font = `${layer.fontWeight || 'normal'} ${fittedSize}px "${layer.fontFamily}", sans-serif`;
            ctx.fillStyle = layer.fill;
            ctx.textAlign = layer.align || 'center';
            ctx.textBaseline = 'middle';

            if (layer.letterSpacing && 'letterSpacing' in ctx) {
              (ctx as any).letterSpacing = `${layer.letterSpacing}px`;
            }

            ctx.fillText(content, tx, ty);
            ctx.restore();
          }
        } else if (layer.type === 'cta') {
          ctx.save();
          const cx = (layer.x / baseWidth) * fullWidth;
          const cy = layer.y * scaleY;
          const cw = (layer.width || 840) * (fullWidth / baseWidth);
          const ch = (layer.height || 96) * Math.min(1, scaleY);
          const fontSize = layer.fontSize * Math.min(1, scaleY);

          ctx.fillStyle = layer.fill;
          ctx.beginPath();
          ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, layer.cornerRadius || 48);
          ctx.fill();

          ctx.font = `bold ${fontSize}px "${layer.fontFamily}", sans-serif`;
          ctx.fillStyle = layer.textColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(layer.text, cx, cy);
          ctx.restore();
        } else if (layer.type === 'watermark' && showWatermark) {
          ctx.save();
          const stripHeight = 150;
          const stripY = fullHeight - stripHeight;

          ctx.fillStyle = '#060B12';
          ctx.fillRect(0, stripY, fullWidth, stripHeight);

          ctx.fillStyle = '#FFC93C';
          ctx.fillRect(0, stripY, fullWidth, 4);

          if (qrImg) {
            ctx.drawImage(qrImg, 36, stripY + 12, 126, 126);
          }

          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';

          ctx.font = 'bold 32px "Inter", sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('Made with StatusPop 🇳🇬', 180, stripY + 45);

          ctx.font = '500 24px "Inter", sans-serif';
          ctx.fillStyle = '#FFC93C';
          ctx.fillText(`Scan QR or visit: statuspop.ng/r/${referralCode}`, 180, stripY + 85);

          ctx.font = 'normal 20px "Inter", sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.fillText('Create 10-second WhatsApp sales flyers', 180, stripY + 118);

          ctx.restore();
        }
      }
    };

    // Load images
    const promises = rawImages.map(
      (src) =>
        new Promise<HTMLImageElement | null>((res) => {
          if (!src) return res(null);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => res(null);
          img.src = src;
        })
    );

    let qrPromise = Promise.resolve<HTMLImageElement | null>(null);
    if (showWatermark && qrDataUrl) {
      qrPromise = new Promise((res) => {
        const q = new Image();
        q.onload = () => res(q);
        q.onerror = () => res(null);
        q.src = qrDataUrl;
      });
    }

    Promise.all([Promise.all(promises), qrPromise]).then(([imgElements, qrImg]) => {
      drawAllLayers(imgElements, qrImg);
    });
  }, [
    template,
    userData,
    scale,
    showWatermark,
    referralCode,
    qrDataUrl,
    previewWidth,
    previewHeight,
    fullWidth,
    fullHeight,
    fontsLoaded,
  ]);

  return (
    <div
      className={`relative inline-block rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 ${className}`}
      style={{
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        aspectRatio: `${fullWidth} / ${fullHeight}`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${previewWidth}px`,
          height: `${previewHeight}px`,
        }}
        className="block"
      />
    </div>
  );
};
