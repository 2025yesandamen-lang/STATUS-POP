import { TemplateTheme } from '../types/index.ts';

/**
 * Draw sector-specific background patterns, textures, and ambient elements
 * Rendered behind text and images on the full-resolution or scaled canvas
 */
export function drawSectorBackgroundPattern(
  ctx: CanvasRenderingContext2D,
  theme: TemplateTheme | undefined,
  width: number,
  height: number,
  scaleY: number
) {
  if (!theme) return;

  ctx.save();

  switch (theme) {
    case 'mechanic': {
      // 1. Industrial Carbon & Crosshatch Diamond Plate
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = -height; x < width + height; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
        ctx.stroke();
      }
      for (let x = width + height; x > -height; x -= step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - height, height);
        ctx.stroke();
      }

      // Large subtle industrial gear watermark in background
      ctx.strokeStyle = 'rgba(255, 90, 54, 0.08)';
      ctx.lineWidth = 18;
      ctx.beginPath();
      const gearX = width * 0.85;
      const gearY = height * 0.45;
      ctx.arc(gearX, gearY, 260, 0, Math.PI * 2);
      ctx.stroke();

      // Gear teeth
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const tx1 = gearX + Math.cos(angle) * 240;
        const ty1 = gearY + Math.sin(angle) * 240;
        const tx2 = gearX + Math.cos(angle) * 290;
        const ty2 = gearY + Math.sin(angle) * 290;
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();
      }
      break;
    }

    case 'artisan': {
      // 2. Technical Blueprint Grid Lines & Measurement Coordinates
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Blueprint coordinate crosshair '+' markers
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = 2;
      for (let x = gridSize * 2; x < width; x += gridSize * 3) {
        for (let y = gridSize * 2; y < height; y += gridSize * 4) {
          ctx.beginPath();
          ctx.moveTo(x - 10, y);
          ctx.lineTo(x + 10, y);
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x, y + 10);
          ctx.stroke();
        }
      }
      break;
    }

    case 'church': {
      // 3. Radiant Celestial Sunburst Rays from Top Center
      const originX = width / 2;
      const originY = 0;
      const rayCount = 28;
      ctx.save();
      for (let i = 0; i < rayCount; i++) {
        const angle1 = (i * Math.PI) / rayCount;
        const angle2 = ((i + 0.5) * Math.PI) / rayCount;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 215, 0, 0.07)' : 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + Math.cos(angle1) * width * 2, originY + Math.sin(angle1) * height * 1.5);
        ctx.lineTo(originX + Math.cos(angle2) * width * 2, originY + Math.sin(angle2) * height * 1.5);
        ctx.closePath();
        ctx.fill();
      }

      // Floating golden holy bokeh orbs
      const sparkles = [
        { x: width * 0.2, y: height * 0.25, r: 8 },
        { x: width * 0.8, y: height * 0.28, r: 12 },
        { x: width * 0.15, y: height * 0.65, r: 10 },
        { x: width * 0.85, y: height * 0.7, r: 14 },
      ];
      ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
      sparkles.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      break;
    }

    case 'barber': {
      // 4. Vintage Charcoal Leatherette Texture with Razor Watermarks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let i = 0; i < 80; i++) {
        const rx = (i * 137) % width;
        const ry = (i * 269) % height;
        ctx.fillRect(rx, ry, 3, 3);
      }

      // Subtle vintage scissors outline in corner
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.12)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(width * 0.9, height * 0.3, 70, 0, Math.PI * 2);
      ctx.arc(width * 0.9, height * 0.42, 70, 0, Math.PI * 2);
      ctx.moveTo(width * 0.86, height * 0.33);
      ctx.lineTo(width * 0.75, height * 0.5);
      ctx.moveTo(width * 0.86, height * 0.39);
      ctx.lineTo(width * 0.75, height * 0.22);
      ctx.stroke();
      break;
    }

    case 'food': {
      // 5. Fiery Sizzling Embers and Hot Steam Swirls
      const embers = [
        { x: width * 0.15, y: height * 0.75, r: 9, c: '#FF5A36' },
        { x: width * 0.28, y: height * 0.68, r: 6, c: '#FFC93C' },
        { x: width * 0.82, y: height * 0.72, r: 8, c: '#FF5A36' },
        { x: width * 0.72, y: height * 0.82, r: 11, c: '#FF9900' },
        { x: width * 0.5, y: height * 0.88, r: 14, c: '#FF5A36' },
      ];
      embers.forEach((em) => {
        ctx.save();
        ctx.shadowColor = em.c;
        ctx.shadowBlur = 20;
        ctx.fillStyle = em.c;
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      break;
    }

    case 'luxury': {
      // 6. Brushed Gold Leaf Dust & Star Flares
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      const goldFlakes = [
        { x: width * 0.1, y: height * 0.15, r: 3 },
        { x: width * 0.9, y: height * 0.2, r: 4 },
        { x: width * 0.12, y: height * 0.85, r: 3.5 },
        { x: width * 0.88, y: height * 0.82, r: 5 },
        { x: width * 0.5, y: height * 0.28, r: 3 },
      ];
      goldFlakes.forEach((f) => {
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      break;
    }

    case 'tech': {
      // 7. Cyberpunk Cyan/Purple Circuit Board & Polygon Nodes
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.lineWidth = 2;
      const circuits = [
        [
          { x: 40, y: height * 0.3 },
          { x: 180, y: height * 0.3 },
          { x: 260, y: height * 0.38 },
        ],
        [
          { x: width - 40, y: height * 0.25 },
          { x: width - 160, y: height * 0.25 },
          { x: width - 240, y: height * 0.35 },
        ],
        [
          { x: 60, y: height * 0.7 },
          { x: 200, y: height * 0.7 },
          { x: 280, y: height * 0.62 },
        ],
      ];
      circuits.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        for (let j = 1; j < line.length; j++) {
          ctx.lineTo(line[j].x, line[j].y);
        }
        ctx.stroke();

        // Node dot
        const last = line[line.length - 1];
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'thrift': {
      // 8. Grungy Streetwear Texture with Angled Tape Elements
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 20; i++) {
        const y = height * 0.2 + i * 40;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;
    }

    case 'boldsale': {
      // 9. Explosive Radial Sunburst Rays
      ctx.save();
      const cx = width / 2;
      const cy = height * 0.45;
      const rays = 24;
      for (let i = 0; i < rays; i++) {
        const a1 = (i * 2 * Math.PI) / rays;
        const a2 = ((i + 0.5) * 2 * Math.PI) / rays;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 201, 60, 0.08)' : 'transparent';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a1) * width, cy + Math.sin(a1) * width);
        ctx.lineTo(cx + Math.cos(a2) * width, cy + Math.sin(a2) * width);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case 'owambe': {
      // 10. Golden Festive Confetti and Swirls
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
      for (let i = 0; i < 35; i++) {
        const x = (i * 97) % width;
        const y = (i * 173) % height;
        const size = (i % 4) + 4;
        ctx.fillRect(x, y, size, size);
      }
      break;
    }

    case 'makeup': {
      // 11. Soft Studio Glamour Light Ring & Pearl Aura
      ctx.save();
      const ringGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        150,
        width / 2,
        height * 0.45,
        450
      );
      ringGrad.addColorStop(0, 'rgba(255, 228, 230, 0.18)');
      ringGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.45, 450, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

/**
 * Draw sector-specific top banners, stamps, and stylized product frames
 * Runs right above backgrounds and images
 */
export function drawSectorDecorations(
  ctx: CanvasRenderingContext2D,
  theme: TemplateTheme | undefined,
  width: number,
  height: number,
  scaleY: number
) {
  if (!theme) return;

  ctx.save();

  switch (theme) {
    case 'mechanic': {
      // Top Hazard Caution Banner (Black & Safety Amber diagonal stripes)
      const bannerH = 46 * scaleY;
      ctx.save();
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, bannerH);

      // Diagonal Caution Stripes
      ctx.fillStyle = '#F59E0B';
      const stripeW = 24;
      for (let x = -bannerH; x < width + bannerH; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, bannerH);
        ctx.lineTo(x + stripeW, bannerH);
        ctx.lineTo(x + stripeW + bannerH, 0);
        ctx.lineTo(x + bannerH, 0);
        ctx.closePath();
        ctx.fill();
      }

      // Banner text pill
      const pillW = 680 * (width / 1080);
      const pillH = 34 * scaleY;
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect((width - pillW) / 2, (bannerH - pillH) / 2, pillW, pillH);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.strokeRect((width - pillW) / 2, (bannerH - pillH) / 2, pillW, pillH);

      ctx.fillStyle = '#FFC93C';
      ctx.font = `900 ${18 * scaleY}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '⚙ CERTIFIED AUTO WORKSHOP • TOKUNBO PARTS & OBD ⚙',
        width / 2,
        bannerH / 2
      );
      ctx.restore();

      // Steel Bolted Rivets around Product Frame Area
      const frameX = width / 2;
      const frameY = 860 * scaleY;
      const fw = 780 * (width / 1080);
      const fh = 700 * scaleY;

      // Heavy industrial metallic border
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 90, 54, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(frameX - fw / 2, frameY - fh / 2, fw, fh);

      // Steel corner rivets
      const rivets = [
        { x: frameX - fw / 2 + 16, y: frameY - fh / 2 + 16 },
        { x: frameX + fw / 2 - 16, y: frameY - fh / 2 + 16 },
        { x: frameX - fw / 2 + 16, y: frameY + fh / 2 - 16 },
        { x: frameX + fw / 2 - 16, y: frameY + fh / 2 - 16 },
      ];
      rivets.forEach((r) => {
        ctx.fillStyle = '#D1D5DB';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();
      break;
    }

    case 'artisan': {
      // Technical Hi-Vis Safety Ribbon at Top
      const bannerH = 46 * scaleY;
      ctx.save();
      ctx.fillStyle = '#064E2B';
      ctx.fillRect(0, 0, width, bannerH);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(0, bannerH - 4, width, 4);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${18 * scaleY}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '⚡ EMERGENCY 1-HR RESPONSE • CERTIFIED TECHNICIAN ⚡',
        width / 2,
        bannerH / 2
      );
      ctx.restore();

      // Technical Blueprint Crosshair brackets around Image
      const bx = width / 2;
      const by = 860 * scaleY;
      const bw = 780 * (width / 1080);
      const bh = 700 * scaleY;
      const cl = 30; // crosshair length

      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 3;

      // Top-Left corner
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2, by - bh / 2 + cl);
      ctx.lineTo(bx - bw / 2, by - bh / 2);
      ctx.lineTo(bx - bw / 2 + cl, by - bh / 2);
      ctx.stroke();

      // Top-Right corner
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2 - cl, by - bh / 2);
      ctx.lineTo(bx + bw / 2, by - bh / 2);
      ctx.lineTo(bx + bw / 2, by - bh / 2 + cl);
      ctx.stroke();

      // Bottom-Left corner
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2, by + bh / 2 - cl);
      ctx.lineTo(bx - bw / 2, by + bh / 2);
      ctx.lineTo(bx - bw / 2 + cl, by + bh / 2);
      ctx.stroke();

      // Bottom-Right corner
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2 - cl, by + bh / 2);
      ctx.lineTo(bx + bw / 2, by + bh / 2);
      ctx.lineTo(bx + bw / 2, by + bh / 2 - cl);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'church': {
      // Golden Filigree Arch Banner at Top
      const bannerH = 48 * scaleY;
      ctx.save();
      const goldGrad = ctx.createLinearGradient(0, 0, width, 0);
      goldGrad.addColorStop(0, '#78350F');
      goldGrad.addColorStop(0.5, '#D97706');
      goldGrad.addColorStop(1, '#78350F');
      ctx.fillStyle = goldGrad;
      ctx.fillRect(0, 0, width, bannerH);

      ctx.fillStyle = '#FFF9EC';
      ctx.font = `900 ${20 * scaleY}px "Playfair Display", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '✦ SPECIAL ANOINTING & BREAKTHROUGH SERVICE ✦',
        width / 2,
        bannerH / 2
      );
      ctx.restore();

      // Cathedral Dome / Arched Golden Frame Border for the Pastor / Choir
      const cx = width / 2;
      const cy = 860 * scaleY;
      const cw = 780 * (width / 1080);
      const ch = 700 * scaleY;

      ctx.save();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
      ctx.shadowBlur = 20;

      // Draw Cathedral Arch Dome
      ctx.beginPath();
      ctx.moveTo(cx - cw / 2, cy + ch / 2);
      ctx.lineTo(cx - cw / 2, cy - ch / 4);
      ctx.arcTo(cx - cw / 2, cy - ch / 2, cx, cy - ch / 2, cw / 2);
      ctx.arcTo(cx + cw / 2, cy - ch / 2, cx + cw / 2, cy - ch / 4, cw / 2);
      ctx.lineTo(cx + cw / 2, cy + ch / 2);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'barber': {
      // Barbershop Pole Diagonal Red-White-Blue Ribbon
      const poleH = 46 * scaleY;
      ctx.save();
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, poleH);

      const stripeW = 20;
      for (let x = -poleH; x < width + poleH; x += stripeW * 3) {
        // Red
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(x, poleH);
        ctx.lineTo(x + stripeW, poleH);
        ctx.lineTo(x + stripeW + poleH, 0);
        ctx.lineTo(x + poleH, 0);
        ctx.fill();

        // White
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x + stripeW, poleH);
        ctx.lineTo(x + stripeW * 2, poleH);
        ctx.lineTo(x + stripeW * 2 + poleH, 0);
        ctx.lineTo(x + stripeW + poleH, 0);
        ctx.fill();

        // Blue
        ctx.fillStyle = '#2563EB';
        ctx.beginPath();
        ctx.moveTo(x + stripeW * 2, poleH);
        ctx.lineTo(x + stripeW * 3, poleH);
        ctx.lineTo(x + stripeW * 3 + poleH, 0);
        ctx.lineTo(x + stripeW * 2 + poleH, 0);
        ctx.fill();
      }

      // Title pill
      const titleW = 620 * (width / 1080);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect((width - titleW) / 2, 6 * scaleY, titleW, 34 * scaleY);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.strokeRect((width - titleW) / 2, 6 * scaleY, titleW, 34 * scaleY);

      ctx.fillStyle = '#FBBF24';
      ctx.font = `900 ${18 * scaleY}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✂ EXECUTIVE VIP GROOMING & SKIN FADE LOUNGE ✂', width / 2, poleH / 2);
      ctx.restore();
      break;
    }

    case 'food': {
      // Sizzling Hot Top Banner
      const foodBannerH = 48 * scaleY;
      ctx.save();
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(0, 0, width, foodBannerH);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, foodBannerH - 4, width, 4);

      ctx.fillStyle = '#FFF7ED';
      ctx.font = `900 ${20 * scaleY}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '♨ SIZZLING HOT & FRESH FROM THE POT • DELICIOUS BUKKA ♨',
        width / 2,
        foodBannerH / 2
      );
      ctx.restore();

      // Sizzling Platter Circular Golden Rim
      const fx = width / 2;
      const fy = 870 * scaleY;
      const fr = 390 * (width / 1080);
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'luxury': {
      // 18K Gold Foil Double-Hairline Header
      const luxH = 48 * scaleY;
      ctx.save();
      ctx.fillStyle = '#090A0F';
      ctx.fillRect(0, 0, width, luxH);

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 8 * scaleY);
      ctx.lineTo(width - 40, 8 * scaleY);
      ctx.moveTo(40, luxH - 8 * scaleY);
      ctx.lineTo(width - 40, luxH - 8 * scaleY);
      ctx.stroke();

      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${18 * scaleY}px "Playfair Display", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♛ ROYAL LUXURY VAULT • 100% GENUINE GOLD ♛', width / 2, luxH / 2);
      ctx.restore();

      // Octagonal Gold Chamfered Frame
      const lx = width / 2;
      const ly = 870 * scaleY;
      const lw = 750 * (width / 1080);
      const lh = 750 * scaleY;
      const c = 40;

      ctx.save();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(lx - lw / 2 + c, ly - lh / 2);
      ctx.lineTo(lx + lw / 2 - c, ly - lh / 2);
      ctx.lineTo(lx + lw / 2, ly - lh / 2 + c);
      ctx.lineTo(lx + lw / 2, ly + lh / 2 - c);
      ctx.lineTo(lx + lw / 2 - c, ly + lh / 2);
      ctx.lineTo(lx - lw / 2 + c, ly + lh / 2);
      ctx.lineTo(lx - lw / 2, ly + lh / 2 - c);
      ctx.lineTo(lx - lw / 2, ly - lh / 2 + c);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'tech': {
      // Cyberpunk Neon Status Bar
      const techH = 46 * scaleY;
      ctx.save();
      ctx.fillStyle = '#050B14';
      ctx.fillRect(0, 0, width, techH);

      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(0, techH - 3, width, 3);

      ctx.fillStyle = '#00E5FF';
      ctx.font = `900 ${18 * scaleY}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '⚡ DIRECT UK USED GADGETS • 100% FACTORY UNLOCKED ⚡',
        width / 2,
        techH / 2
      );
      ctx.restore();

      // Chamfered Neon Cyan Tech Frame
      const tx = width / 2;
      const ty = 870 * scaleY;
      const tw = 760 * (width / 1080);
      const th = 760 * scaleY;
      const ch = 45;

      ctx.save();
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.moveTo(tx - tw / 2 + ch, ty - th / 2);
      ctx.lineTo(tx + tw / 2 - ch, ty - th / 2);
      ctx.lineTo(tx + tw / 2, ty - th / 2 + ch);
      ctx.lineTo(tx + tw / 2, ty + th / 2 - ch);
      ctx.lineTo(tx + tw / 2 - ch, ty + th / 2);
      ctx.lineTo(tx - tw / 2 + ch, ty + th / 2);
      ctx.lineTo(tx - tw / 2, ty + th / 2 - ch);
      ctx.lineTo(tx - tw / 2, ty - th / 2 + ch);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'thrift': {
      // Yaba Tape Sticker Header Banner
      const tapeH = 48 * scaleY;
      ctx.save();
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(0, 0, width, tapeH);

      ctx.fillStyle = '#000000';
      ctx.font = `900 ${20 * scaleY}px "Anton", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '⚡ DIRECT UK BALE OPENING • FIRST TO PAY NA OWNER ⚡',
        width / 2,
        tapeH / 2
      );
      ctx.restore();
      break;
    }

    case 'boutique': {
      // Editorial Lookbook Hairline Header
      const boutH = 46 * scaleY;
      ctx.save();
      ctx.fillStyle = '#2A0818';
      ctx.fillRect(0, 0, width, boutH);
      ctx.fillStyle = '#EC4899';
      ctx.fillRect(0, boutH - 3, width, 3);

      ctx.fillStyle = '#FCE7F3';
      ctx.font = `bold ${18 * scaleY}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦ THE NEW COLLECTION 2026 • LIMITED RUN ✦', width / 2, boutH / 2);
      ctx.restore();
      break;
    }

    case 'owambe': {
      // Festive Owambe Lace Ribbon
      const owH = 48 * scaleY;
      ctx.save();
      ctx.fillStyle = '#581C87';
      ctx.fillRect(0, 0, width, owH);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, owH - 4, width, 4);

      ctx.fillStyle = '#FEF3C7';
      ctx.font = `900 ${19 * scaleY}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '🎉 EXCLUSIVE OWAMBE PARTY & SWISS VOILE LACE 🎉',
        width / 2,
        owH / 2
      );
      ctx.restore();
      break;
    }

    case 'makeup': {
      // Glamour Studio Ribbon
      const makH = 46 * scaleY;
      ctx.save();
      ctx.fillStyle = '#064E3B';
      ctx.fillRect(0, 0, width, makH);
      ctx.fillStyle = '#34D399';
      ctx.fillRect(0, makH - 3, width, 3);

      ctx.fillStyle = '#D1FAE5';
      ctx.font = `bold ${18 * scaleY}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '✨ FLAWLESS GLAM LOOK • BRIDAL & MAKEOVER STUDIO ✨',
        width / 2,
        makH / 2
      );
      ctx.restore();

      // Oval Vanity Ring Light Frame
      const mx = width / 2;
      const my = 870 * scaleY;
      const mrx = 380 * (width / 1080);
      const mry = 380 * scaleY;
      ctx.save();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.4)';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.ellipse(mx, my, mrx, mry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    default:
      break;
  }

  ctx.restore();
}
