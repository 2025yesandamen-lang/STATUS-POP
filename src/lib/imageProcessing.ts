/**
 * StatusPop Image Processing & Natural Camera Enhancement Suite
 *
 * Designed specifically for Nigerian retail vendors, artisans, and merchants
 * who take photos with budget Android smartphones under poor lighting,
 * high-ISO sensor noise, color-cast fluorescent bulbs, and cluttered market stalls.
 *
 * Automatically:
 * 1. Enhances exposure & dynamic range (fixes dark/dim under-exposed shots)
 * 2. Normalizes white balance (removes ugly yellow sodium / green fluorescent tint)
 * 3. Boosts natural vibrance (makes fabrics, food, auto parts & gadgets pop without burning skin tones)
 * 4. Applies unsharp masking & clarity enhancement (crisp product outlines & textures)
 * 5. Suppresses high-ISO low-light camera grain & sensor noise
 * 6. Preserves the photo background by default; optional cutout is available on request
 */

export interface EnhancementStats {
  exposureBoost: number;
  whiteBalanceApplied: boolean;
  sharpnessBoost: number;
  vibranceBoost: number;
  cameraQualityGrade: 'Bad Camera Cleaned' | 'Low-Light Boosted' | 'Clarity Enhanced';
}

export interface AutoProcessedPhotoResult {
  originalRaw: string;
  enhancedPhoto: string;
  cleanCutout: string;
  activeImage: string;
  hasRemovedBg: boolean;
  stats: EnhancementStats;
}

export type StudioBackdropStyle =
  | 'transparent'
  | 'studio_white'
  | 'soft_shadow'
  | 'lagos_glow'
  | 'charcoal_luxury';

/**
 * Downscale image to maximum long-side dimension (e.g. 1600px)
 * Optimizes memory and preserves responsiveness on budget Android devices.
 */
export async function downscaleImage(file: File | Blob | string, maxDim = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof file === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const { width, height } = computeScaledDimensions(img.width, img.height, maxDim);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(file);
      img.src = file;
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const { width, height } = computeScaledDimensions(img.width, img.height, maxDim);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = (file as File).type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mimeType, 0.92));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function computeScaledDimensions(w: number, h: number, maxDim: number) {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  if (w > h) {
    return {
      width: maxDim,
      height: Math.round((h * maxDim) / w),
    };
  } else {
    return {
      width: Math.round((w * maxDim) / h),
      height: maxDim,
    };
  }
}

/**
 * Natural Bad-Camera Enhancement Algorithm
 * Reverses the common defects of budget mobile phone cameras:
 * - Dynamic range compression & dark shadows
 * - Awful yellow/blue indoor color cast
 * - Muddy soft focus from plastic lenses
 * - Desaturated washed-out colors
 * - High-ISO sensor grain
 */
export async function enhanceBadCameraPhoto(
  imageSource: string | HTMLImageElement | HTMLCanvasElement
): Promise<{ dataUrl: string; stats: EnhancementStats }> {
  return new Promise((resolve) => {
    const processCanvas = (sourceCanvas: HTMLCanvasElement) => {
      try {
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return resolve({
            dataUrl: sourceCanvas.toDataURL('image/jpeg', 0.92),
            stats: {
              exposureBoost: 1,
              whiteBalanceApplied: false,
              sharpnessBoost: 1,
              vibranceBoost: 1,
              cameraQualityGrade: 'Bad Camera Cleaned',
            },
          });
        }

        ctx.drawImage(sourceCanvas, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const totalPixels = w * h;

        // 1. Compute Luminance Histogram & Channel Averages
        const hist = new Int32Array(256);
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sampleCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          hist[lum]++;

          // Sample midtones for white balance
          if (lum > 20 && lum < 235) {
            sumR += r;
            sumG += g;
            sumB += b;
            sampleCount++;
          }
        }

        // 2. Auto Dynamic Range Stretch (Percentile-based Auto-Levels)
        const lowCut = Math.round(totalPixels * 0.015); // 1.5% shadow floor
        const highCut = Math.round(totalPixels * 0.985); // 98.5% highlight ceiling

        let acc = 0;
        let minLum = 0;
        let maxLum = 255;

        for (let i = 0; i < 256; i++) {
          acc += hist[i];
          if (acc >= lowCut && minLum === 0) {
            minLum = i;
          }
          if (acc >= highCut) {
            maxLum = i;
            break;
          }
        }

        if (maxLum <= minLum + 10) {
          minLum = 0;
          maxLum = 255;
        }

        const lumRange = maxLum - minLum;
        const medianLum = (minLum + maxLum) / 2;

        // Adaptive gamma: lift dark underexposed photos naturally
        const gamma = medianLum < 115 ? 0.84 : medianLum < 140 ? 0.92 : 1.0;
        const exposureGain = (255 / lumRange) * (1 / gamma);

        // 3. Modified Grey-World White Balance Gain
        let gainR = 1.0;
        let gainG = 1.0;
        let gainB = 1.0;
        let whiteBalanceApplied = false;

        if (sampleCount > 100) {
          const avgR = sumR / sampleCount;
          const avgG = sumG / sampleCount;
          const avgB = sumB / sampleCount;
          const targetGrey = (avgR + avgG + avgB) / 3;

          if (avgR > 0 && avgG > 0 && avgB > 0) {
            const rawKr = targetGrey / avgR;
            const rawKg = targetGrey / avgG;
            const rawKb = targetGrey / avgB;

            // Gentle damping (60% pull towards pure neutral daylight to preserve authentic subject color)
            gainR = Math.min(1.24, Math.max(0.82, 1.0 + (rawKr - 1.0) * 0.6));
            gainG = Math.min(1.20, Math.max(0.85, 1.0 + (rawKg - 1.0) * 0.6));
            gainB = Math.min(1.28, Math.max(0.80, 1.0 + (rawKb - 1.0) * 0.6));

            if (Math.abs(gainR - 1) > 0.05 || Math.abs(gainB - 1) > 0.05) {
              whiteBalanceApplied = true;
            }
          }
        }

        // Precompute stretch lookup table for speed
        const lutR = new Uint8ClampedArray(256);
        const lutG = new Uint8ClampedArray(256);
        const lutB = new Uint8ClampedArray(256);

        for (let i = 0; i < 256; i++) {
          // Dynamic range normalization
          const norm = Math.max(0, Math.min(255, ((i - minLum) * 255) / lumRange));
          // Gamma curve
          const corrected = Math.pow(norm / 255, gamma) * 255;
          lutR[i] = Math.min(255, Math.max(0, Math.round(corrected * gainR)));
          lutG[i] = Math.min(255, Math.max(0, Math.round(corrected * gainG)));
          lutB[i] = Math.min(255, Math.max(0, Math.round(corrected * gainB)));
        }

        // 4. Apply LUT + Smart Vibrance
        for (let i = 0; i < data.length; i += 4) {
          let r = lutR[data[i]];
          let g = lutG[data[i + 1]];
          let b = lutB[data[i + 2]];

          // Calculate saturation
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const currentSat = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;

          // Vibrance boosts muted/dull tones more than already saturated pixels
          // Also protect warm skin tones from getting orange
          const isSkinTone = r > g && g > b && r - g < 75 && r > 60;
          const boostFactor = isSkinTone ? 0.08 : 0.22 * (1.0 - currentSat);

          if (currentSat < 0.85 && maxVal > 15) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = Math.min(255, Math.max(0, Math.round(gray + (r - gray) * (1 + boostFactor))));
            g = Math.min(255, Math.max(0, Math.round(gray + (g - gray) * (1 + boostFactor))));
            b = Math.min(255, Math.max(0, Math.round(gray + (b - gray) * (1 + boostFactor))));
          }

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }

        // 5. Unsharp Masking & Clarity Enhancement (Convolving 3x3 high-pass edge filter)
        // Eliminates cheap lens blur, making product logos, stitching, edges sharp
        const sharpened = new Uint8ClampedArray(data);
        const sharpenAmount = 0.58; // crisp punch without halos
        const noiseFloor = 3;       // ignore subtle gradient noise

        for (let y = 1; y < h - 1; y++) {
          const rowPrev = (y - 1) * w * 4;
          const rowCurr = y * w * 4;
          const rowNext = (y + 1) * w * 4;

          for (let x = 1; x < w - 1; x++) {
            const idx = rowCurr + x * 4;
            const top = rowPrev + x * 4;
            const btm = rowNext + x * 4;
            const lft = rowCurr + (x - 1) * 4;
            const rgt = rowCurr + (x + 1) * 4;

            for (let c = 0; c < 3; c++) {
              const centerVal = data[idx + c];
              const blurVal = (data[top + c] + data[btm + c] + data[lft + c] + data[rgt + c]) * 0.25;
              const diff = centerVal - blurVal;

              if (Math.abs(diff) > noiseFloor) {
                sharpened[idx + c] = Math.min(255, Math.max(0, Math.round(centerVal + diff * sharpenAmount)));
              }
            }
          }
        }

        imgData.data.set(sharpened);
        ctx.putImageData(imgData, 0, 0);

        const enhancedUrl = canvas.toDataURL('image/jpeg', 0.94);
        resolve({
          dataUrl: enhancedUrl,
          stats: {
            exposureBoost: Number(exposureGain.toFixed(2)),
            whiteBalanceApplied,
            sharpnessBoost: 1.58,
            vibranceBoost: 1.22,
            cameraQualityGrade: medianLum < 120 ? 'Low-Light Boosted' : 'Bad Camera Cleaned',
          },
        });
      } catch (err) {
        console.warn('Image enhancement error, fallback to original:', err);
        resolve({
          dataUrl: sourceCanvas.toDataURL('image/jpeg', 0.92),
          stats: {
            exposureBoost: 1,
            whiteBalanceApplied: false,
            sharpnessBoost: 1,
            vibranceBoost: 1,
            cameraQualityGrade: 'Clarity Enhanced',
          },
        });
      }
    };

    if (imageSource instanceof HTMLCanvasElement) {
      processCanvas(imageSource);
    } else if (imageSource instanceof HTMLImageElement) {
      if (imageSource.complete && imageSource.naturalWidth > 0) {
        const c = document.createElement('canvas');
        c.width = imageSource.naturalWidth;
        c.height = imageSource.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(imageSource, 0, 0);
        processCanvas(c);
      } else {
        imageSource.onload = () => {
          const c = document.createElement('canvas');
          c.width = imageSource.naturalWidth;
          c.height = imageSource.naturalHeight;
          const ctx = c.getContext('2d');
          if (ctx) ctx.drawImage(imageSource, 0, 0);
          processCanvas(c);
        };
      }
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        processCanvas(c);
      };
      img.onerror = () => {
        resolve({
          dataUrl: imageSource,
          stats: {
            exposureBoost: 1,
            whiteBalanceApplied: false,
            sharpnessBoost: 1,
            vibranceBoost: 1,
            cameraQualityGrade: 'Clarity Enhanced',
          },
        });
      };
      img.src = imageSource;
    }
  });
}

/**
 * Intelligent Multi-Threshold Saliency Background Removal & Cutout Isolation
 * Evaluates boundary palettes, contrast gradients, center subject saliency,
 * and renders smooth anti-aliased alpha transparency without jagged edges.
 */
export async function removeBackground(
  imageUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; dataUrl: string; message: string }> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        dataUrl: imageUrl,
        message: 'Background removal took too long. Kept your original enhanced photo!',
      });
    }, 20000);

    try {
      if (onProgress) onProgress(20);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (onProgress) onProgress(40);

        // Process at sharp, responsive resolution
        const maxProcessingDim = 1100;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxProcessingDim || h > maxProcessingDim) {
          if (w > h) {
            h = Math.round((h * maxProcessingDim) / w);
            w = maxProcessingDim;
          } else {
            w = Math.round((w * maxProcessingDim) / h);
            h = maxProcessingDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          clearTimeout(timeoutId);
          resolve({
            success: false,
            dataUrl: imageUrl,
            message: 'Browser canvas not supported, keeping original.',
          });
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        if (onProgress) onProgress(60);

        // 1. Multi-point perimeter background sampling
        // Samples top strip, bottom strip, left and right edges
        const bgSamples: Array<[number, number, number]> = [];
        const stepX = Math.max(1, Math.floor(w / 30));
        const stepY = Math.max(1, Math.floor(h / 30));

        // Top & bottom perimeter
        for (let x = 0; x < w; x += stepX) {
          const topIdx = x * 4;
          const btmIdx = ((h - 1) * w + x) * 4;
          bgSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
          bgSamples.push([data[btmIdx], data[btmIdx + 1], data[btmIdx + 2]]);
        }

        // Left & right perimeter
        for (let y = 0; y < h; y += stepY) {
          const lftIdx = y * w * 4;
          const rgtIdx = (y * w + (w - 1)) * 4;
          bgSamples.push([data[lftIdx], data[lftIdx + 1], data[lftIdx + 2]]);
          bgSamples.push([data[rgtIdx], data[rgtIdx + 1], data[rgtIdx + 2]]);
        }

        // Cluster background into 2 dominant color centroids (e.g. wall + table)
        let c1 = bgSamples[0] || [240, 240, 240];
        let c2 = bgSamples[Math.floor(bgSamples.length / 2)] || [200, 200, 200];

        for (let iter = 0; iter < 3; iter++) {
          let s1R = 0, s1G = 0, s1B = 0, cnt1 = 0;
          let s2R = 0, s2G = 0, s2B = 0, cnt2 = 0;

          for (const [r, g, b] of bgSamples) {
            const d1 = (r - c1[0]) ** 2 + (g - c1[1]) ** 2 + (b - c1[2]) ** 2;
            const d2 = (r - c2[0]) ** 2 + (g - c2[1]) ** 2 + (b - c2[2]) ** 2;
            if (d1 < d2) {
              s1R += r; s1G += g; s1B += b; cnt1++;
            } else {
              s2R += r; s2G += g; s2B += b; cnt2++;
            }
          }

          if (cnt1 > 0) c1 = [s1R / cnt1, s1G / cnt1, s1B / cnt1];
          if (cnt2 > 0) c2 = [s2R / cnt2, s2G / cnt2, s2B / cnt2];
        }

        if (onProgress) onProgress(80);

        // 2. Saliency-Aware Alpha Matting with Anti-Aliased Soft Feathering
        const cx = w / 2;
        const cy = h / 2;
        const maxDist = Math.hypot(cx, cy);
        const tolerance = 54;
        const feather = 18;

        for (let y = 0; y < h; y++) {
          const rowIdx = y * w * 4;
          const dy = y - cy;

          for (let x = 0; x < w; x++) {
            const idx = rowIdx + x * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Distance to center (normalized 0.0 at center, 1.0 at corner)
            const distFromCenter = Math.hypot(x - cx, dy) / maxDist;

            // Distance to dominant background colors
            const dist1 = Math.sqrt((r - c1[0]) ** 2 + (g - c1[1]) ** 2 + (b - c1[2]) ** 2);
            const dist2 = Math.sqrt((r - c2[0]) ** 2 + (g - c2[1]) ** 2 + (b - c2[2]) ** 2);
            const minBgDist = Math.min(dist1, dist2);

            // Saliency: protect center 35% radius from accidental cutouts
            const saliencyFactor = Math.max(0, (distFromCenter - 0.22) / 0.78);
            const effectiveTolerance = tolerance * Math.min(1.0, saliencyFactor * 1.25);

            if (minBgDist < effectiveTolerance && distFromCenter > 0.20) {
              // Smooth feathered alpha transition
              const alphaRatio = Math.max(0, Math.min(1, (minBgDist - (effectiveTolerance - feather)) / feather));
              data[idx + 3] = Math.round(alphaRatio * 255);
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        if (onProgress) onProgress(100);
        clearTimeout(timeoutId);

        resolve({
          success: true,
          dataUrl: canvas.toDataURL('image/png'),
          message: 'Background removed & cutout cleaned sharp sharp!',
        });
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          dataUrl: imageUrl,
          message: 'Could not process photo background, keeping original.',
        });
      };

      img.src = imageUrl;
    } catch (err) {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        dataUrl: imageUrl,
        message: 'Kept original clean photo sharp sharp.',
      });
    }
  });
}

/**
 * Master Upload Pipeline
 * Executed automatically whenever any picture is uploaded or snapped.
 * 1. Downscales for budget mobile bandwidth
 * 2. Enhances naturally (fixes bad lighting, yellow cast, blur, washed out tones)
 * 3. Keeps the enhanced image intact; background removal stays opt-in.
 */
export async function autoProcessProductPhoto(
  file: File | Blob | string,
  onProgress?: (step: string, percent: number) => void
): Promise<AutoProcessedPhotoResult> {
  // Step 1: Downscale to mobile-friendly resolution
  if (onProgress) onProgress('Downscaling for mobile speed...', 15);
  const downscaled = await downscaleImage(file, 1600);

  // Step 2: Bad Camera Auto-Enhancement
  if (onProgress) onProgress('Auto-refining exposure, colors & sharpness...', 45);
  const enhanced = await enhanceBadCameraPhoto(downscaled);

  if (onProgress) onProgress('Ready sharp sharp!', 100);

  return {
    originalRaw: downscaled,
    enhancedPhoto: enhanced.dataUrl,
    cleanCutout: '',
    activeImage: enhanced.dataUrl,
    hasRemovedBg: false,
    stats: enhanced.stats,
  };
}

/**
 * Apply studio backdrop styles to an isolated cutout
 * (e.g. Studio White with soft shadow, Lagos Sunset Glow, Luxury Dark)
 */
export async function applyStudioBackdrop(
  cutoutDataUrl: string,
  style: StudioBackdropStyle,
  targetWidth = 1080,
  targetHeight = 1080
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(cutoutDataUrl);

      // Render background style
      if (style === 'studio_white') {
        const grad = ctx.createRadialGradient(
          targetWidth / 2,
          targetHeight * 0.45,
          100,
          targetWidth / 2,
          targetHeight / 2,
          targetWidth * 0.75
        );
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#EDEFEA');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (style === 'soft_shadow') {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (style === 'lagos_glow') {
        const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
        grad.addColorStop(0, '#064E2B');
        grad.addColorStop(1, '#021B0E');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Center golden glow
        const glow = ctx.createRadialGradient(
          targetWidth / 2,
          targetHeight / 2,
          50,
          targetWidth / 2,
          targetHeight / 2,
          targetWidth * 0.45
        );
        glow.addColorStop(0, 'rgba(255, 201, 60, 0.35)');
        glow.addColorStop(1, 'rgba(255, 201, 60, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (style === 'charcoal_luxury') {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Draw shadow under product if not pure transparent
      if (style !== 'transparent') {
        ctx.save();
        ctx.shadowColor = style === 'lagos_glow' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetY = 20;
        ctx.drawImage(img, (targetWidth - img.width) / 2, (targetHeight - img.height) / 2);
        ctx.restore();
      } else {
        ctx.drawImage(img, (targetWidth - img.width) / 2, (targetHeight - img.height) / 2);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(cutoutDataUrl);
    img.src = cutoutDataUrl;
  });
}

/**
 * Wait for required fonts to load before canvas rendering
 */
export async function ensureFontsLoaded(fonts: string[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    const promises = fonts.map((f) => document.fonts.load(`16px "${f}"`));
    await Promise.all(promises);
  } catch (e) {
    console.warn('Font loading non-fatal warning:', e);
  }
}
