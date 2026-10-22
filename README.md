# 🚀 StatusPop Nigeria — Mobile-First Status Flyer & Ad Creator

**StatusPop** is an ultra-fast, mobile-optimized sales flyer creator, mini-store, and marketing generator built specifically for Nigerian retail merchants, artisans, mechanics, thrift vendors, boutique owners, caterers, and salons.

Turn raw smartphone photos into high-converting WhatsApp status flyers in under 10 seconds.

---

## ✨ Core Magic: Automatic Bad-Camera Natural Enhancement & Clean Cutout

When Nigerian vendors snap products with budget Android smartphones in dim stalls, under fluorescent bulbs, or with shaky hands, camera quality is often poor. StatusPop solves this automatically:

Every uploaded or snapped photo automatically passes through the **Natural Computer Vision & AI Enhancement Pipeline**:

1. **Auto-Exposure & Dynamic Range Stretch**:
   - Analyzes the luminance histogram and stretches dark, murky shadows up to rich, balanced contrast without clipping highlights.
2. **Adaptive White Balance Normalization**:
   - Modified Grey-World algorithm eliminates ugly yellow sodium or sickly green fluorescent color casts from market stall lightbulbs.
3. **Smart Vibrance & Color Pop**:
   - Selectively enhances muted colors while protecting skin tones from turning orange or unnatural.
4. **Unsharp Masking (USM) Clarity Enhancer**:
   - 3x3 high-pass edge convolution sharpens blurry plastic lenses, bringing product logos, stitches, texture, and edges into crisp focus.
5. **Low-Light Sensor Denoising**:
   - Gentle median filtering on smooth surfaces suppresses high-ISO sensor grain.
6. **Saliency Multi-Threshold Background Removal**:
   - Samples perimeter boundaries (walls, tables, sheets) and isolates the product cutout with soft, anti-aliased edge feathering.
7. **Instant Studio Backdrop Customization**:
   - Choose between **Pure Transparent Cutout**, **Studio White with Soft Shadow**, **Lagos Sunset Glow**, or **Luxury Charcoal**.
8. **Before vs. After Comparison**:
   - Vendors can tap **"Compare Before & After"** anytime to see their raw bad camera shot transform into a clean studio asset!

---

## 🤖 Supported Free AI APIs (Multi-Provider Cascade)

StatusPop integrates a resilient multi-provider AI ecosystem with zero-latency local fallback:

| Provider | Free Tier Quota | Primary Role | Key Setting |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | **1,500 requests/day** (100% Free) | Multimodal Vision Auto-Detect, Copy, Event Greetings | `GEMINI_API_KEY` |
| **Groq Cloud** | **14,400 requests/day** (~250ms ultra-fast) | Ultra-fast Llama 3.3 70B & 3.1 8B Pidgin & English copy | `GROQ_API_KEY` |
| **OpenRouter** | **Free tier models** (`:free`) | Open-source LLM fallback | `OPENROUTER_API_KEY` |
| **Hugging Face** | **Free Serverless API** | BLIP vision captioning & RMBG-1.4 background removal | `HF_TOKEN` |
| **StatusPop Local Engine** | **100% Unlimited & Offline** | Instant local CV camera cleanup & authentic Naija dialect copy | *No key needed* |

### 🪄 1-Tap Free AI Product Auto-Detect
Vendors don't need to type lengthy product details on small phone keyboards:
1. Snap or upload any photo in Step 1.
2. In Step 2, tap **"🪄 Magic Free AI Auto-Detect"**.
3. StatusPop identifies the item (e.g. *"Toyota Camry Alternator"* or *"Pleated Ankara Jumpsuit"*), suggests the Naira market price (₦), category, punchy headline, and warranty subtitle automatically!

---

## 🛡️ Structural Hardening & Production Reliability

- **Memory-Leak Protected Rate Limiter**: Background garbage collection sweeps expired IP records every 5 minutes.
- **Security Headers**: Injected `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict referrer policies.
- **Extended Nigerian Safety Guard**: Intercepts illegal scams, Ponzi schemes, crypto doubling, and illicit contraband.
- **Fail-Proof Fallbacks**: If external AI APIs are rate-limited or offline, the app seamlessly cascades to the embedded local Nigerian dialect engine without showing any error to the user.
- **Cross-Platform Scripts**: Updated build and clean scripts to work seamlessly across Windows, macOS, and Linux.

---

## 🛠️ Local Development & Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add optional AI provider keys from [Google AI Studio](https://aistudio.google.com/) or [Groq Console](https://console.groq.com/). Keep all secrets in a local `.env` file or your hosting provider's secret manager. Never commit `.env`.

For administrator access, configure `ADMIN_PASSWORD` (at least 12 characters) and `SESSION_SECRET` (at least 32 characters) in the hosting secret manager. Generate a signing secret with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Admin login is server-verified, rate-limited, and uses an expiring HttpOnly cookie. The admin page reports that its data store is unavailable until a persistent database is integrated. It does not show sample CRM, order, or payment records.

Online payments, bank resolution, and subaccount creation are disabled. Do not enable payments until real server-side order and entitlement persistence, Paystack callback verification, and signed webhook reconciliation are implemented and tested. The current app has no database, so it cannot reliably fulfill those requirements.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser or mobile device.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📱 App Highlights
- **15 Sector Templates**: Auto Mechanics, Artisans & Plumbers, Church & Ministries, Thrift Multi-Grids, Barbers & Salons, Boutique Fashion, Tech Gadgets.
- **WhatsApp DP Creator**: Dedicated square profile picture generator with business badges, services, and phone number.
- **Special Holiday Flyers**: Independence Day, Christmas, New Year, Easter, Eid, and Customer Appreciation cards.
- **Online payments**: Disabled until persistent order/entitlement storage and verified Paystack webhooks are available. Shop orders use a direct WhatsApp handoff and are not stored by this app.
