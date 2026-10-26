import QRCode from 'qrcode';
import { FlyerTemplate, UserFlyerData, ASPECT_RATIOS } from '../types/index.ts';
import { formatNaira, calculateDiscount } from './format.ts';
import { ensureFontsLoaded } from './imageProcessing.ts';
import { drawSectorBackgroundPattern, drawSectorDecorations } from './sectorGraphics.ts';

/**
 * Measure text and shrink font size if text exceeds maximum width or height
 */
export function calculateFittedFontSize(
  text: string,
  fontFamily: string,
  targetFontSize: number,
  maxWidth: number,
  maxLines: number = 1
): number {
  if (typeof document === 'undefined') return targetFontSize;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return targetFontSize;

  let currentSize = targetFontSize;
  const minSize = 18;

  while (currentSize > minSize) {
    ctx.font = `${currentSize}px "${fontFamily}", sans-serif`;

    if (maxLines <= 1) {
      const metrics = ctx.measureText(text);
      if (metrics.width <= maxWidth) {
        return currentSize;
      }

    } else {
      const words = text.split(' ');
      let lines = 1;
      let currentLineWidth = 0;

      for (const word of words) {
        const wordWidth = ctx.measureText(word + ' ').width;
        if (wordWidth > maxWidth) {
          lines = 999;
          break;
        }
        if (currentLineWidth + wordWidth > maxWidth) {
          lines++;
          currentLineWidth = wordWidth;
        } else {
          currentLineWidth += wordWidth;
        }
      }

      if (lines <= maxLines) {
        return currentSize;
      }
    }

    currentSize -= 2;
  }

  return minSize;
}

export function drawImageInSlot(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  options: { borderRadius?: number; clipShape?: 'circle' } = {}
): void {
  const imageWidth = 'naturalWidth' in image && typeof image.naturalWidth === 'number'
    ? image.naturalWidth
    : image.width;
  const imageHeight = 'naturalHeight' in image && typeof image.naturalHeight === 'number'
    ? image.naturalHeight
    : image.height;
  if (!Number.isFinite(imageWidth) || imageWidth <= 0 || !Number.isFinite(imageHeight) || imageHeight <= 0) {
    throw new Error('Cannot fit an image into a template slot before it has valid dimensions.');
  }

  const x = centerX - width / 2;
  const y = centerY - height / 2;
  const coverScale = Math.max(width / imageWidth, height / imageHeight);
  const cropWidth = width / coverScale;
  const cropHeight = height / coverScale;
  const cropX = (imageWidth - cropWidth) / 2;
  const cropY = (imageHeight - cropHeight) / 2;

  ctx.save();
  ctx.beginPath();
  if (options.clipShape === 'circle') {
    ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else if (options.borderRadius) {
    ctx.roundRect(x, y, width, height, options.borderRadius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.clip();
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height);
  ctx.restore();
}

export function shouldRenderSingleProductDetail(
  template: FlyerTemplate,
  userData: UserFlyerData,
  textKey: string | undefined
): boolean {
  const isSeparateMultiProductLayout =
    template.photoSlots > 1 && userData.multiProductMode === 'separate_products';
  return !isSeparateMultiProductLayout || (textKey !== 'productName' && textKey !== 'price');
}

/**
 * Generate a scannable QR Code as Data URL
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 256,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

/**
 * Render template and user data directly to an offscreen full-resolution canvas
 * and export as high-fidelity PNG (1080x1920, 1080x1080, 1080x1350)
 */
export async function exportFlyerToDataUrl(
  template: FlyerTemplate,
  userData: UserFlyerData,
  hasWatermark: boolean,
  referralCode: string = 'demo'
): Promise<string> {
  const { width: targetWidth, height: targetHeight } = ASPECT_RATIOS[userData.aspectRatio];
  const baseWidth = 1080;
  const baseHeight = 1920;
  const scaleY = targetHeight / baseHeight;

  // 1. Ensure fonts are loaded
  await ensureFontsLoaded([
    'Anton',
    'Bebas Neue',
    'Playfair Display',
    'Pacifico',
    'Poppins',
    'Montserrat',
    'Inter',
  ]);

  // 2. Setup high-res canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 3. Preload all product images (up to 4)
  const imagesToLoad: string[] = [];
  if (userData.productImages && userData.productImages.length > 0) {
    imagesToLoad.push(...userData.productImages);
  } else if (userData.productImage) {
    imagesToLoad.push(userData.productImage);
  }

  const loadedImages: (HTMLImageElement | null)[] = await Promise.all(
    imagesToLoad.map(
      (src) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          if (!src) return resolve(null);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        })
    )
  );

  // 4. Preload QR code if watermark is enabled
  let qrImgObj: HTMLImageElement | null = null;
  if (hasWatermark) {
    const qrUrl = `https://status-pop.vercel.app/r/${referralCode}?src=qr`;
    const qrDataUrl = await generateQrDataUrl(qrUrl);
    if (qrDataUrl) {
      qrImgObj = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = qrDataUrl;
      });
    }
  }

  // 5. Render layers in order
  for (const layer of template.layers) {
    if (layer.type === 'background') {
      if (layer.fillType === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
        grad.addColorStop(0, layer.color1);
        grad.addColorStop(1, layer.color2 || layer.color1);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.fillStyle = layer.color1;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      if (layer.accentCircleColor && layer.accentCircleRadius && layer.accentCirclePos) {
        ctx.save();
        ctx.beginPath();
        const cx = (layer.accentCirclePos.x / baseWidth) * targetWidth;
        const cy = layer.accentCirclePos.y * scaleY;
        const rad = layer.accentCircleRadius * Math.min(1, scaleY);
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fillStyle = layer.accentCircleColor;
        ctx.fill();
        ctx.restore();
      }

      // Render sector-specific background textures, banners & frames
      drawSectorBackgroundPattern(ctx, template.theme, targetWidth, targetHeight, scaleY);
      drawSectorDecorations(ctx, template.theme, targetWidth, targetHeight, scaleY);
    } else if (layer.type === 'product_image') {
      const slot = layer.slotIndex ?? 0;
      const imgObj = loadedImages[slot] || loadedImages[0];

      if (imgObj) {
        ctx.save();
        const px = (layer.x / baseWidth) * targetWidth;
        const py = layer.y * scaleY;
        const pw = layer.width * Math.min(1, scaleY);
        const ph = layer.height * Math.min(1, scaleY);

        if (layer.shadowBlur) {
          ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = layer.shadowBlur;
          ctx.shadowOffsetY = layer.shadowOffsetY || 15;
        }

        drawImageInSlot(ctx, imgObj, px, py, pw, ph, {
          borderRadius: layer.borderRadius,
          clipShape: layer.clipShape,
        });
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
          // Optional slot badge (e.g. BEFORE / AFTER)
          ctx.save();
          const px = (layer.x / baseWidth) * targetWidth;
          const py = (layer.y - layer.height / 2 + 30) * scaleY;
          ctx.font = 'bold 24px "Inter", sans-serif';
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.beginPath();
          ctx.roundRect(px - 60, py - 18, 120, 36, 12);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(layer.label, px, py);
          ctx.restore();
        }
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
        const bx = (layer.x / baseWidth) * targetWidth;
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
        const radius = layer.cornerRadius || 20;
        ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, radius);
        ctx.fill();

        ctx.fillStyle = layer.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bx, by);
        ctx.restore();
      }
    } else if (layer.type === 'text') {
      if (!shouldRenderSingleProductDetail(template, userData, layer.textKey)) continue;

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
        const tx = (layer.x / baseWidth) * targetWidth;
        const ty = layer.y * scaleY;
        const baseFontSize = layer.fontSize * Math.min(1, scaleY);
        const maxBoxWidth = targetWidth * 0.92;
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
      const cx = (layer.x / baseWidth) * targetWidth;
      const cy = layer.y * scaleY;
      const cw = (layer.width || 840) * (targetWidth / baseWidth);
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
    } else if (layer.type === 'watermark' && hasWatermark) {
      // 150px clean bottom strip with QR Code + Referral link
      ctx.save();
      const stripHeight = 150;
      const stripY = targetHeight - stripHeight;

      // Dark elevated strip background
      ctx.fillStyle = '#060B12';
      ctx.fillRect(0, stripY, targetWidth, stripHeight);

      // Gold accent top border line
      ctx.fillStyle = '#FFC93C';
      ctx.fillRect(0, stripY, targetWidth, 4);

      // Scannable QR code (126px x 126px) on left
      if (qrImgObj) {
        ctx.drawImage(qrImgObj, 36, stripY + 12, 126, 126);
      }

      // Branding text beside QR code
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.font = 'bold 32px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Made with StatusPop 🇳🇬', 180, stripY + 45);

      ctx.font = '500 24px "Inter", sans-serif';
      ctx.fillStyle = '#FFC93C';
      ctx.fillText(`Scan QR or visit: status-pop.vercel.app/r/${referralCode}`, 180, stripY + 85);

      ctx.font = 'normal 20px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText('Create 10-second WhatsApp sales flyers for your business', 180, stripY + 118);

      ctx.restore();
    }
  }

  return canvas.toDataURL('image/png', 1.0);
}
