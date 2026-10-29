import QRCode from 'qrcode';
import { SpecialEventDesign, CustomCanvasElement } from '../types/index.ts';
import { ensureFontsLoaded } from './imageProcessing.ts';

export interface EventFlyerCustomData {
  businessName: string;
  taglineSlogan: string;
  headlineTitle: string;
  messageQuote: string;
  services: string[];
  phone: string;
  address: string;
  website: string;
  heroImage?: string;
  includePhoto?: boolean; // Toggle for photo vs pure graphic/icon artwork
  customElements?: CustomCanvasElement[];
  customBackground?: string;
  discountText: string;
  saleDates: string;
  promoLabel: string;
  callToAction: string;
}

// Utility: wrap text cleanly within a maxWidth box without overflowing
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 4,
  align: CanvasTextAlign = 'left'
): number {
  ctx.save();
  ctx.textAlign = align;
  const words = text.trim().split(/\s+/);
  let line = '';
  let currentY = y;
  let linesDrawn = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      if (linesDrawn === maxLines - 1) {
        ctx.fillText(`${line}...`, x, currentY);
        linesDrawn++;
        currentY += lineHeight;
        line = '';
        break;
      }
      ctx.fillText(line, x, currentY);
      linesDrawn++;
      currentY += lineHeight;
      line = words[i];
      if (linesDrawn >= maxLines) break;
    } else {
      line = testLine;
    }
  }

  if (line && linesDrawn < maxLines) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  ctx.restore();
  return currentY;
}

// Utility: auto-shrink font size to fit width
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number,
  fontFamily: string,
  fontWeight: string = 'bold',
  align: CanvasTextAlign = 'left'
) {
  ctx.save();
  ctx.textAlign = align;
  let fontSize = maxFontSize;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
    fontSize -= 2;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawBlackFridayPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  showPhoto: boolean
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  if (showPhoto && photo) {
    const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    ctx.drawImage(
      photo,
      (photo.naturalWidth - sourceWidth) / 2,
      (photo.naturalHeight - sourceHeight) / 2,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height
    );
  } else {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, '#FBBF24');
    gradient.addColorStop(1, '#F97316');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 28px "Montserrat", sans-serif';
    ctx.fillText('YOUR CAMPAIGN PHOTO', x + width / 2, y + height / 2, width - 32);
  }
  ctx.restore();
}

function renderBlackFridayTemplate(
  ctx: CanvasRenderingContext2D,
  design: SpecialEventDesign,
  data: EventFlyerCustomData,
  photo: HTMLImageElement | null,
  showPhoto: boolean,
  width: number,
  height: number
) {
  const variant = design.designVariant;
  const business = data.businessName.toUpperCase();
  const heading = (data.taglineSlogan || 'BLACK FRIDAY').toUpperCase();
  const promo = (data.promoLabel || 'SPECIAL OFFER').toUpperCase();
  const discount = (data.discountText || '50% OFF').toUpperCase();
  const dates = (data.saleDates || '').toUpperCase();
  const title = (data.headlineTitle || 'SHOP OUR BLACK FRIDAY DEALS').toUpperCase();

  if (variant === 1) {
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#FFCB24');
    background.addColorStop(0.55, '#FF8A00');
    background.addColorStop(1, '#F45B16');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 242, 170, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 185); ctx.lineTo(640, 185); ctx.lineTo(0, 780); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width, 420); ctx.lineTo(width, 1050); ctx.lineTo(650, 1050); ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#111111';
    drawFittedText(ctx, business, 58, 68, width - 116, 35, 18, '"Montserrat", sans-serif', '900');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Montserrat", sans-serif';
    ctx.fillText(dates || 'LIMITED-TIME SALE', 58, 128, width - 116);

    ctx.save();
    ctx.translate(540, 335);
    ctx.rotate(-0.09);
    ctx.fillStyle = '#111111';
    ctx.fillRect(-440, -112, 880, 128);
    ctx.fillStyle = '#FBBF24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawFittedText(ctx, heading, 0, -48, 820, 98, 54, '"Anton", sans-serif', '900', 'center');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-405, 20, 810, 112);
    ctx.fillStyle = '#111111';
    drawFittedText(ctx, promo, 0, 76, 750, 58, 32, '"Anton", sans-serif', '900', 'center');
    ctx.restore();

    drawBlackFridayPhoto(ctx, photo, 40, 545, 430, 660, 28, showPhoto);

    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.roundRect(520, 610, 490, 260, 28);
    ctx.fill();
    ctx.fillStyle = '#FBBF24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawFittedText(ctx, discount, 765, 730, 430, 174, 88, '"Anton", sans-serif', '900', 'center');
    ctx.fillStyle = '#FFFFFF';
    drawFittedText(ctx, title, 540, 920, 450, 35, 20, '"Montserrat", sans-serif', '900', 'center');
    ctx.font = 'bold 21px "Inter", sans-serif';
    ctx.textAlign = 'center';
    drawWrappedText(ctx, data.messageQuote, 765, 965, 430, 29, 3, 'center');
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 21px "Montserrat", sans-serif';
    ctx.fillText(`${data.callToAction || 'SHOP NOW'}  •  ${data.phone}`, 765, 1085, 455);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.fillText(data.website || '', 765, 1120, 450);
  } else if (variant === 2) {
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(590, 0); ctx.lineTo(width, 0); ctx.lineTo(width, height); ctx.lineTo(590, height); ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#FBBF24';
    drawFittedText(ctx, business, 48, 70, 500, 33, 18, '"Montserrat", sans-serif', '900');
    ctx.fillStyle = '#FFFFFF';
    drawFittedText(ctx, heading, 48, 190, 500, 76, 62, '"Anton", sans-serif', '900');
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 25px "Montserrat", sans-serif';
    ctx.fillText(promo, 54, 242, 485);

    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(48, 300, 490, 260, 18);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DISCOUNT', 75, 348);
    ctx.fillStyle = '#FBBF24';
    drawFittedText(ctx, discount, 75, 455, 430, 116, 72, '"Anton", sans-serif', '900');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.fillText(dates || 'LIMITED-TIME OFFER', 58, 610, 470);
    ctx.font = '500 18px "Inter", sans-serif';
    drawWrappedText(ctx, title, 58, 665, 460, 26, 2);
    drawWrappedText(ctx, data.messageQuote, 58, 730, 460, 24, 3);

    drawBlackFridayPhoto(ctx, photo, 630, 120, 400, Math.min(540, height - 220), 12, showPhoto);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 21px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.callToAction || 'SHOP NOW', 830, height - 160, 360);
    ctx.font = 'bold 17px "Inter", sans-serif';
    ctx.fillText(`${data.phone}  ${data.website}`, 830, height - 125, 390);
  } else {
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#21172D');
    background.addColorStop(0.48, '#09172C');
    background.addColorStop(1, '#351A2B');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#D5AA52';
    ctx.lineWidth = 5;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Montserrat", sans-serif';
    ctx.fillText(business, width / 2, 112, width - 130);
    ctx.fillStyle = '#E7C46A';
    drawFittedText(ctx, heading, width / 2, 285, width - 130, 126, 78, '"Anton", sans-serif', '900', 'center');
    ctx.fillStyle = '#FFFFFF';
    drawFittedText(ctx, 'SALE', width / 2, 390, width - 130, 90, 54, '"Anton", sans-serif', '900', 'center');
    ctx.fillStyle = '#E7C46A';
    ctx.font = 'bold 20px "Montserrat", sans-serif';
    ctx.fillText(promo, width / 2, 425, width - 140);

    ctx.fillStyle = '#E6333B';
    ctx.beginPath();
    ctx.roundRect(165, 440, width - 330, 165, 14);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    drawFittedText(ctx, discount, width / 2, 548, width - 390, 100, 58, '"Anton", sans-serif', '900', 'center');

    ctx.fillStyle = '#E7C46A';
    ctx.font = 'bold 29px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dates || promo, width / 2, 690, width - 140);
    ctx.fillStyle = '#FFFFFF';
    drawFittedText(ctx, title, width / 2, 765, width - 150, 37, 22, '"Montserrat", sans-serif', '900', 'center');
    ctx.font = '500 19px "Inter", sans-serif';
    drawWrappedText(ctx, data.messageQuote, width / 2, 820, width - 180, 25, 3, 'center');

    drawBlackFridayPhoto(ctx, photo, width / 2 - 200, 930, 400, 250, 26, showPhoto);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 23px "Montserrat", sans-serif';
    ctx.fillText(data.callToAction || 'SHOP NOW', width / 2, height - 250, width - 150);
    ctx.fillStyle = '#E7C46A';
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.fillText(`${data.phone}  •  ${data.website}`, width / 2, height - 210, width - 130);
  }
}

// Draw realistic festive stickers (flower, gift box, gold ribbon, fireworks, lantern, heart, star, holly berry, discount tag)
export function drawSticker(
  ctx: CanvasRenderingContext2D,
  iconType: string,
  x: number,
  y: number,
  scale: number = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (iconType === 'flower') {
    // Tropical Flower Blossom with Gold Stamen
    ctx.shadowColor = 'rgba(244, 63, 94, 0.4)';
    ctx.shadowBlur = 15;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.fillStyle = i % 2 === 0 ? '#FB7185' : '#F43F5E';
      ctx.beginPath();
      ctx.ellipse(0, 32, 22, 35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Gold Center
    ctx.fillStyle = '#FFC93C';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (iconType === 'gift_box') {
    // 3D Red Heart Box with Golden Bow (matching Capture_2b77a995.PNG)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;

    // Red Box Body
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.roundRect(-45, -35, 90, 75, 14);
    ctx.fill();

    // Box Lid
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(-50, -45, 100, 22, 8);
    ctx.fill();

    // Gold Ribbon Vertical & Horizontal
    ctx.fillStyle = '#FFC93C';
    ctx.fillRect(-12, -45, 24, 85);
    ctx.fillRect(-50, -10, 100, 20);

    // Gold Ribbon Bow on Top
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.ellipse(-20, -52, 16, 10, -0.4, 0, Math.PI * 2);
    ctx.ellipse(20, -52, 16, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, -48, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (iconType === 'gold_ribbon') {
    // Flowing Golden Celebration Ribbon
    ctx.shadowColor = 'rgba(255, 201, 60, 0.5)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#FFC93C';
    ctx.beginPath();
    ctx.moveTo(-50, 0);
    ctx.bezierCurveTo(-25, -25, 25, 25, 50, 0);
    ctx.lineTo(45, 18);
    ctx.bezierCurveTo(20, 40, -20, -5, -45, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (iconType === 'fireworks') {
    // Multi-tier Fireworks Explosion (matching stock-vector-happy-new-year-square-template...)
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 15;
    const colors = ['#FFC93C', '#F43F5E', '#38BDF8', '#4ADE80', '#A855F7'];
    for (let i = 0; i < 16; i++) {
      ctx.rotate((Math.PI * 2) / 16);
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(45, 0);
      ctx.stroke();

      ctx.fillStyle = colors[(i + 1) % colors.length];
      ctx.beginPath();
      ctx.arc(52, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (iconType === 'lantern') {
    // Golden Hanging Islamic Lantern (matching eid-mubarak...)
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 20;

    // Hanging line
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, -25);
    ctx.stroke();

    // Dome cap
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(25, -10);
    ctx.lineTo(-25, -10);
    ctx.closePath();
    ctx.fill();

    // Body with warm light
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(-20, -10, 40, 45);

    // Filigree cage
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 3;
    ctx.strokeRect(-20, -10, 40, 45);
    ctx.beginPath();
    ctx.moveTo(-20, 12);
    ctx.lineTo(20, 12);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 35);
    ctx.stroke();

    // Base point
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(-15, 35);
    ctx.lineTo(15, 35);
    ctx.lineTo(0, 48);
    ctx.closePath();
    ctx.fill();
  } else if (iconType === 'heart') {
    // 3D Glossy Red Heart
    ctx.shadowColor = 'rgba(225, 29, 72, 0.5)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.bezierCurveTo(-25, -45, -50, -20, -50, 10);
    ctx.bezierCurveTo(-50, 35, -25, 55, 0, 75);
    ctx.bezierCurveTo(25, 55, 50, 35, 50, 10);
    ctx.bezierCurveTo(50, -20, 25, -45, 0, -15);
    ctx.fill();

    // White shine highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-20, 5, 8, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (iconType === 'star') {
    // 4-Point Gold Star Cluster (matching stock-vector-happy-new-year-with-gold-stars...)
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFD700';

    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.quadraticCurveTo(0, 0, 45, 0);
    ctx.quadraticCurveTo(0, 0, 0, 45);
    ctx.quadraticCurveTo(0, 0, -45, 0);
    ctx.quadraticCurveTo(0, 0, 0, -45);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (iconType === 'holly_berry') {
    // Holly Berries with Silk Ribbon (matching stock-vector-red-sale-labels...)
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;

    // Green leaves
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(-25, -15, 22, 12, -0.6, 0, Math.PI * 2);
    ctx.ellipse(25, -15, 22, 12, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // 3 Red berries
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(-10, 8, 12, 0, Math.PI * 2);
    ctx.arc(10, 8, 12, 0, Math.PI * 2);
    ctx.arc(0, -6, 12, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = '#F87171';
    ctx.beginPath();
    ctx.arc(-12, 5, 3, 0, Math.PI * 2);
    ctx.arc(8, 5, 3, 0, Math.PI * 2);
    ctx.arc(-2, -9, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (iconType === 'discount_tag') {
    // Stitched Red Sale Tag (matching stock-vector-red-sale-labels...)
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.roundRect(-45, -30, 90, 60, 12);
    ctx.fill();

    // Stitch border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-40, -25, 80, 50);
    ctx.setLineDash([]);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px "Anton", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SALE', 0, 0);
  }

  ctx.restore();
}

// Draw custom shape container with user photo inside
function drawCustomContainerWithPhoto(
  ctx: CanvasRenderingContext2D,
  el: CustomCanvasElement,
  heroImg: HTMLImageElement | null,
  accentColor: string,
  secondaryColor: string
) {
  const x = el.x;
  const y = el.y;
  const width = el.width || 360;
  const height = el.height || 360;
  const shape = el.shapeType || 'circle';

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 10;

  if (shape === 'circle') {
    const r = width / 2;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    if (heroImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(heroImg, x, y, width, height);
      ctx.restore();
    }

    // Border
    ctx.save();
    ctx.strokeStyle = secondaryColor || '#FFC93C';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (shape === 'heart') {
    // Heart Shape Box Container (matching Capture_2b77a995.PNG)
    const cx = x + width / 2;
    const cy = y + height / 2;
    const scale = width / 200;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.bezierCurveTo(-55, -95, -100, -50, -100, 15);
    ctx.bezierCurveTo(-100, 65, -55, 95, 0, 130);
    ctx.bezierCurveTo(55, 95, 100, 65, 100, 15);
    ctx.bezierCurveTo(100, -50, 55, -95, 0, -35);
    ctx.closePath();

    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    if (heroImg) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.bezierCurveTo(-55, -95, -100, -50, -100, 15);
      ctx.bezierCurveTo(-100, 65, -55, 95, 0, 130);
      ctx.bezierCurveTo(55, 95, 100, 65, 100, 15);
      ctx.bezierCurveTo(100, -50, 55, -95, 0, -35);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(heroImg, -100, -100, 200, 240);
      ctx.restore();
    }

    // Golden border
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#FFC93C';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  } else if (shape === 'arch_window') {
    // Arched window container
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, [width / 2, width / 2, 20, 20]);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    if (heroImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, [width / 2, width / 2, 20, 20]);
      ctx.clip();
      ctx.drawImage(heroImg, x, y, width, height);
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, [width / 2, width / 2, 20, 20]);
    ctx.stroke();
    ctx.restore();
  } else {
    // Rounded Card / Square container
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 24);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    if (heroImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 24);
      ctx.clip();
      ctx.drawImage(heroImg, x, y, width, height);
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = secondaryColor || '#FFC93C';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 24);
    ctx.stroke();
    ctx.restore();
  }
}

// Draw seasonal graphic illustration when user chooses no photo
function drawSeasonalEmblem(
  ctx: CanvasRenderingContext2D,
  eventType: string,
  cx: number,
  cy: number,
  radius: number,
  accentColor: string,
  secondaryColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  if (eventType === 'christmas_detty_december') {
    const grad = ctx.createRadialGradient(0, -20, 10, 0, 0, radius);
    grad.addColorStop(0, '#EF4444');
    grad.addColorStop(0.7, '#B91C1C');
    grad.addColorStop(1, '#7F1D1D');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFC93C';
    ctx.fillRect(-25, -radius - 20, 50, 24);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -radius - 25, 18, 0, Math.PI, true);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, radius * 0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-15, radius * 0.45);
      ctx.lineTo(0, radius * 0.55);
      ctx.lineTo(15, radius * 0.45);
      ctx.stroke();
    }
  } else if (eventType === 'valentine_day') {
    ctx.fillStyle = '#E11D48';
    ctx.shadowColor = 'rgba(225, 29, 72, 0.5)';
    ctx.shadowBlur = 30;

    const scale = radius / 90;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.bezierCurveTo(-50, -80, -90, -40, -90, 10);
    ctx.bezierCurveTo(-90, 50, -50, 80, 0, 110);
    ctx.bezierCurveTo(50, 80, 90, 50, 90, 10);
    ctx.bezierCurveTo(90, -40, 50, -80, 0, -30);
    ctx.fill();

    ctx.fillStyle = '#FFC93C';
    ctx.shadowColor = 'rgba(255, 201, 60, 0.4)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(40, -70);
    ctx.bezierCurveTo(15, -95, -5, -75, -5, -50);
    ctx.bezierCurveTo(-5, -30, 15, -15, 40, 0);
    ctx.bezierCurveTo(65, -15, 85, -30, 85, -50);
    ctx.bezierCurveTo(85, -75, 65, -95, 40, -70);
    ctx.fill();
    ctx.restore();
  } else if (eventType === 'eid_mubarak') {
    ctx.shadowColor = 'rgba(255, 201, 60, 0.6)';
    ctx.shadowBlur = 25;

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI * 0.4, Math.PI * 0.8, false);
    ctx.arc(radius * 0.35, -radius * 0.2, radius * 0.85, Math.PI * 0.8, -Math.PI * 0.4, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, -radius * 0.8);
    ctx.lineTo(15, -10);
    ctx.stroke();

    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(0, -10, 30, 45);
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(15, -25);
    ctx.lineTo(35, -10);
    ctx.lineTo(-5, -10);
    ctx.closePath();
    ctx.fill();
  } else if (eventType === 'independence_day') {
    ctx.shadowColor = 'rgba(11, 107, 58, 0.4)';
    ctx.shadowBlur = 25;

    ctx.fillStyle = '#064E2B';
    ctx.beginPath();
    ctx.roundRect(-radius * 0.75, -radius * 0.8, radius * 1.5, radius * 1.6, 24);
    ctx.fill();

    const barW = (radius * 1.5) / 3;
    ctx.fillStyle = '#0B6B3A';
    ctx.fillRect(-radius * 0.75, -radius * 0.8, barW, radius * 1.6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-radius * 0.75 + barW, -radius * 0.8, barW, radius * 1.6);
    ctx.fillStyle = '#0B6B3A';
    ctx.fillRect(-radius * 0.75 + barW * 2, -radius * 0.8, barW, radius * 1.6);

    ctx.fillStyle = '#FFC93C';
    ctx.font = 'bold 64px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ 64 ★', 0, 0);
  } else {
    ctx.fillStyle = '#FFC93C';
    ctx.shadowColor = 'rgba(255, 201, 60, 0.5)';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 50px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PRO', 0, 0);
  }

  ctx.restore();
}

export async function exportEventFlyerToDataUrl(
  design: SpecialEventDesign,
  data: EventFlyerCustomData,
  hasWatermark: boolean,
  referralCode: string = 'demo'
): Promise<string> {
  const width = 1080;
  const height = design.aspectRatio ? Math.round(width / design.aspectRatio) : width;

  await ensureFontsLoaded([
    'Anton',
    'Bebas Neue',
    'Playfair Display',
    'Pacifico',
    'Poppins',
    'Montserrat',
    'Inter',
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Background
  const customBg = data.customBackground;
  if (customBg === 'professional_slate') {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, '#F8FAFC');
    g.addColorStop(0.58, '#EEF2F6');
    g.addColorStop(1, '#DCE3EA');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.035)';
    ctx.beginPath();
    ctx.moveTo(width * 0.68, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(width * 0.88, height);
    ctx.closePath();
    ctx.fill();
  } else if (customBg === 'valentine_red') {
    // Red Velvet & Floating Hearts (matching Capture_2b77a995.PNG)
    const g = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width);
    g.addColorStop(0, '#E11D48');
    g.addColorStop(0.6, '#9F1239');
    g.addColorStop(1, '#4C0519');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (customBg === 'emerald_islamic') {
    // Emerald Green with Islamic Glow (matching eid-mubarak...)
    const g = ctx.createRadialGradient(width / 2, 300, 50, width / 2, height / 2, width);
    g.addColorStop(0, '#047857');
    g.addColorStop(0.7, '#064E3B');
    g.addColorStop(1, '#022C22');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (customBg === 'christmas_pine') {
    // Snow White with Top Pine Accents
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);
    // Green frame header
    const g = ctx.createLinearGradient(0, 0, width, 0);
    g.addColorStop(0, '#064E2B');
    g.addColorStop(1, '#15803D');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, 24);
  } else {
    // Default event theme background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (design.eventType === 'independence_day') {
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.35, '#F0FDF4');
      bgGrad.addColorStop(1, '#064E2B');
    } else if (design.eventType === 'new_week') {
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.35, '#EFF6FF');
      bgGrad.addColorStop(1, '#0A2540');
    } else if (design.eventType === 'valentine_day') {
      bgGrad.addColorStop(0, '#FFF1F2');
      bgGrad.addColorStop(0.4, '#FFE4E6');
      bgGrad.addColorStop(1, '#881337');
    } else if (design.eventType === 'christmas_detty_december') {
      bgGrad.addColorStop(0, '#FEF2F2');
      bgGrad.addColorStop(0.4, '#FEE2E2');
      bgGrad.addColorStop(1, '#7F1D1D');
    } else {
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.4, '#F8FAFC');
      bgGrad.addColorStop(1, '#0F172A');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Preload hero photo if available
  const shouldIncludePhoto = Boolean(data.includePhoto);
  const heroSrc = data.heroImage || design.heroGraphic;
  let heroImg: HTMLImageElement | null = null;
  if (shouldIncludePhoto && heroSrc) {
    heroImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = heroSrc;
    });
  }

  const layoutFormat = design.layoutFormat || 'circular_portal';
  if (layoutFormat === 'black_friday') {
    renderBlackFridayTemplate(ctx, design, data, heroImg, shouldIncludePhoto, width, height);
    if (hasWatermark) {
      const watermarkHeight = 100;
      const watermarkY = height - watermarkHeight;
      ctx.fillStyle = '#060B12';
      ctx.fillRect(0, watermarkY, width, watermarkHeight);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(0, watermarkY, width, 4);
      const qrData = await QRCode.toDataURL(
        `https://status-pop.vercel.app/r/${referralCode}?src=qr_event`,
        { margin: 1, width: 76 }
      );
      const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Unable to render flyer watermark QR code'));
        image.src = qrData;
      });
      ctx.drawImage(qrImage, 14, watermarkY + 12, 76, 76);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Made with StatusPop', 108, watermarkY + 42);
      ctx.fillStyle = '#FBBF24';
      ctx.font = '16px "Inter", sans-serif';
      ctx.fillText(`status-pop.vercel.app/r/${referralCode}`, 108, watermarkY + 70);
    }
    return canvas.toDataURL('image/png', 1);
  }

  // 2. Render Layout Format

  if (layoutFormat === 'custom_studio') {
    // --- FORMAT 5: CUSTOM CANVAS STUDIO (FREEFORM DRAG & DROP) ---
    // If user has placed custom elements, render them!
    const elements = data.customElements || [];
    for (const el of elements) {
      if (el.type === 'container') {
        drawCustomContainerWithPhoto(ctx, el, heroImg, design.accentColor, design.secondaryColor);
      } else if (el.type === 'sticker' && el.iconType) {
        drawSticker(ctx, el.iconType, el.x, el.y, el.scale || 1);
      } else if (el.type === 'text') {
        ctx.save();
        ctx.fillStyle = el.color || '#FFFFFF';
        ctx.font = `bold ${el.fontSize || 32}px "${el.fontFamily || 'Montserrat'}", sans-serif`;
        drawWrappedText(ctx, el.text || '', el.x, el.y, el.width || 400, (el.fontSize || 32) * 1.3, 4);
        ctx.restore();
      }
    }

  } else if (layoutFormat === 'professional_editorial') {
    const photoX = 590;
    const photoY = 156;
    const photoW = 440;
    const photoH = 424;
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 28);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 28);
    ctx.clip();
    if (shouldIncludePhoto && heroImg) {
      const scale = Math.max(photoW / heroImg.naturalWidth, photoH / heroImg.naturalHeight);
      const sourceWidth = photoW / scale;
      const sourceHeight = photoH / scale;
      ctx.drawImage(
        heroImg,
        (heroImg.naturalWidth - sourceWidth) / 2,
        (heroImg.naturalHeight - sourceHeight) / 2,
        sourceWidth,
        sourceHeight,
        photoX,
        photoY,
        photoW,
        photoH
      );
    } else {
      const fill = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
      fill.addColorStop(0, design.accentColor);
      fill.addColorStop(1, design.secondaryColor);
      ctx.fillStyle = fill;
      ctx.fillRect(photoX, photoY, photoW, photoH);
      drawSeasonalEmblem(ctx, design.eventType, photoX + photoW / 2, photoY + photoH / 2, 135, '#FFFFFF', '#FFFFFF');
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 28);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = design.accentColor;
    ctx.beginPath();
    ctx.roundRect(photoX + 18, photoY + photoH - 58, photoW - 36, 38, 12);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A PROFESSIONAL CELEBRATION', photoX + photoW / 2, photoY + photoH - 39);
    ctx.restore();
  } else if (layoutFormat === 'circular_portal') {
    // --- FORMAT 1: CIRCULAR PORTAL ---
    const cx = 740;
    const cy = 350;
    const radius = 230;

    if (shouldIncludePhoto && heroImg) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(heroImg, cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = design.secondaryColor || '#FFC93C';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      drawSeasonalEmblem(ctx, design.eventType, cx, cy, radius * 0.85, design.accentColor, design.secondaryColor);
    }
  } else if (layoutFormat === 'organic_wave') {
    // --- FORMAT 2: ORGANIC WAVE / SPLIT CARD ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(480, 0);
    ctx.bezierCurveTo(460, 250, 560, 480, width, 540);
    ctx.lineTo(width, 0);
    ctx.closePath();

    if (shouldIncludePhoto && heroImg) {
      ctx.save();
      ctx.clip();
      ctx.drawImage(heroImg, 460, 0, 620, 560);
      ctx.restore();

      ctx.strokeStyle = design.secondaryColor || '#FFC93C';
      ctx.lineWidth = 8;
      ctx.stroke();
    } else {
      const waveGrad = ctx.createLinearGradient(480, 0, width, 540);
      waveGrad.addColorStop(0, design.accentColor);
      waveGrad.addColorStop(1, '#000000');
      ctx.fillStyle = waveGrad;
      ctx.fill();
      ctx.restore();

      drawSeasonalEmblem(ctx, design.eventType, 780, 260, 150, design.accentColor, design.secondaryColor);
    }
    ctx.restore();
  } else if (layoutFormat === 'card_window') {
    // --- FORMAT 3: ARCH WINDOW ---
    const cardX = 540;
    const cardY = 130;
    const cardW = 500;
    const cardH = 480;

    if (shouldIncludePhoto && heroImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, [36, 36, 16, 16]);
      ctx.clip();
      ctx.drawImage(heroImg, cardX, cardY, cardW, cardH);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, [36, 36, 16, 16]);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, [36, 36, 16, 16]);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();

      drawSeasonalEmblem(ctx, design.eventType, cardX + cardW / 2, cardY + cardH / 2, 160, design.accentColor, design.secondaryColor);
    }
  } else {
    // --- FORMAT 4: LUXURY GOLD EMBLEM ---
    const cx = 760;
    const cy = 340;

    if (shouldIncludePhoto && heroImg) {
      const pSize = 380;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx - pSize / 2, cy - pSize / 2, pSize, pSize, 28);
      ctx.clip();
      ctx.drawImage(heroImg, cx - pSize / 2, cy - pSize / 2, pSize, pSize);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#FFC93C';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(cx - pSize / 2, cy - pSize / 2, pSize, pSize, 28);
      ctx.stroke();
      ctx.restore();
    } else {
      drawSeasonalEmblem(ctx, design.eventType, cx, cy, 210, design.accentColor, design.secondaryColor);
    }
  }

  // 3. Header: Business Name & Tagline (AUTO-FITTED)
  const maxHeaderWidth = 480;
  ctx.save();
  ctx.fillStyle = design.accentColor;
  drawFittedText(
    ctx,
    data.businessName.toUpperCase(),
    50,
    72,
    maxHeaderWidth,
    42,
    24,
    '"Montserrat", sans-serif',
    '900'
  );

  ctx.fillStyle = '#4B5563';
  drawFittedText(
    ctx,
    data.taglineSlogan || 'INNOVATE • CONNECT • GROW',
    50,
    104,
    maxHeaderWidth,
    18,
    13,
    '"Inter", sans-serif',
    'bold'
  );
  ctx.restore();

  // 4. Date / Theme Ribbon Tag
  ctx.save();
  const dateText = design.dateOrTheme || 'SPECIAL CELEBRATION';
  ctx.font = 'bold 20px "Inter", sans-serif';
  const dateW = ctx.measureText(dateText).width + 36;
  ctx.fillStyle = design.accentColor;
  ctx.beginPath();
  ctx.roundRect(50, 138, Math.min(dateW, 420), 40, 8);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(dateText, 68, 158);
  ctx.restore();

  // 5. Main Celebration Headline (WRAPPED & FITTED)
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = design.accentColor;
  ctx.font = '900 56px "Anton", sans-serif';
  drawWrappedText(ctx, data.headlineTitle || design.tagline, 50, 195, 440, 58, 3);
  ctx.restore();

  // 6. Inspirational Quote / Prayer / Greetings Box (WRAPPED)
  ctx.save();
  ctx.fillStyle = '#1F2937';
  ctx.font = '500 22px "Inter", sans-serif';
  drawWrappedText(ctx, data.messageQuote || design.defaultMessage, 50, 395, 430, 32, 6);
  ctx.restore();

  // 7. Services / "What We Do" Bar (AUTO-FITTED COLUMNS)
  const servicesY = 645;
  ctx.save();
  ctx.fillStyle = '#0B1C38';
  ctx.beginPath();
  ctx.roundRect(40, servicesY, width - 80, 132, 20);
  ctx.fill();

  ctx.fillStyle = '#FFC93C';
  ctx.font = '900 19px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WE POWER PROGRESS • WHAT WE DO:', 65, servicesY + 28);

  const activeServices = (data.services || design.defaultServices).slice(0, 4);
  const colWidth = (width - 120) / Math.max(activeServices.length, 1);

  activeServices.forEach((serv, i) => {
    const colX = 60 + i * colWidth;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.beginPath();
    ctx.roundRect(colX, servicesY + 45, colWidth - 14, 58, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawFittedText(
      ctx,
      serv,
      colX + (colWidth - 14) / 2,
      servicesY + 76,
      colWidth - 24,
      19,
      15,
      '"Inter", sans-serif',
      '900',
      'center'
    );
  });
  ctx.restore();

  // 8. Contact & Address Bar (NEVER OVERFLOWS)
  const contactY = 788;
  const leftColW = 460;
  const rightColX = 520;
  const rightColW = width - rightColX - 40;

  // Left: Call / WhatsApp Phone Badge
  ctx.save();
  ctx.fillStyle = '#0B6B3A';
  ctx.beginPath();
  ctx.roundRect(40, contactY, leftColW, 95, 20);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CALL / WHATSAPP HOTLINE', 70, contactY + 30);

  ctx.font = '900 34px "Montserrat", sans-serif';
  drawFittedText(
    ctx,
    data.phone || '08023456789',
    70,
    contactY + 68,
    leftColW - 60,
    34,
    22,
    '"Montserrat", sans-serif',
    '900'
  );
  ctx.restore();

  // Right: Shop & Office Address Badge
  ctx.save();
  ctx.fillStyle = '#1F2937';
  ctx.beginPath();
  ctx.roundRect(rightColX, contactY, rightColW, 95, 20);
  ctx.fill();

  ctx.fillStyle = '#9CA3AF';
  ctx.font = 'bold 15px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('OFFICE / WORKSHOP ADDRESS', rightColX + 25, contactY + 28);

  ctx.fillStyle = '#FFC93C';
  ctx.font = 'bold 18px "Inter", sans-serif';
  drawWrappedText(
    ctx,
    data.address || 'SIMBIAT ABIOLA WAY, IKEJA COMPUTER VILLAGE, LAGOS',
    rightColX + 25,
    contactY + 54,
    rightColW - 50,
    22,
    2
  );
  ctx.restore();

  // 9. Website & Social Handles Bar
  const footY = 898;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(40, footY, width - 80, 36);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.textAlign = 'center';
  const cleanBiz = data.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
  ctx.fillText(
    `${data.website || 'status-pop.vercel.app'}  |  info@${cleanBiz || 'store'}.ng  |  @${cleanBiz || 'statuspop'}`,
    width / 2,
    footY + 23
  );
  ctx.restore();

  // 10. StatusPop Watermark for Free Plan
  if (hasWatermark) {
    const wmY = height - 120;
    ctx.save();
    ctx.fillStyle = '#060B12';
    ctx.fillRect(0, wmY, width, 120);

    ctx.fillStyle = '#FFC93C';
    ctx.fillRect(0, wmY, width, 4);

    const qrUrl = `https://status-pop.vercel.app/r/${referralCode}?src=qr_event`;
    const qrData = await QRCode.toDataURL(qrUrl, { margin: 1, width: 100 });
    const qrImg = await new Promise<HTMLImageElement>((res) => {
      const q = new Image();
      q.onload = () => res(q);
      q.src = qrData;
    });

    ctx.drawImage(qrImg, 30, wmY + 10, 100, 100);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px "Inter", sans-serif';
    ctx.fillText('Made with StatusPop 🇳🇬', 150, wmY + 40);

    ctx.fillStyle = '#FFC93C';
    ctx.font = '500 20px "Inter", sans-serif';
    ctx.fillText(`Scan or visit: status-pop.vercel.app/r/${referralCode}`, 150, wmY + 75);

    ctx.font = '16px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('10-Second WhatsApp Flyers for Nigerian Businesses • ₦500 Day Pass', 150, wmY + 100);
    ctx.restore();
  }

  return canvas.toDataURL('image/png', 1.0);
}
