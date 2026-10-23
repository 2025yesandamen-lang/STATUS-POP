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
Copy `.env.example` to `.env` and fill in the services you want to enable:
```bash
cp .env.example .env
```
Keep all secrets in your local `.env` file or your hosting provider's secret manager. Never commit `.env`.

### Accounts and persistent data

StatusPop uses Better Auth email/password accounts with Neon PostgreSQL. Configure `DATABASE_URL` with the Neon pooled connection string and set `BETTER_AUTH_SECRET` to a unique random value of at least 32 characters. The PostgreSQL URL, auth secret, and provider API keys are server-only and must never be added to frontend `VITE_*` variables.

Generate a secret with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run the Better Auth schema migration after setting `DATABASE_URL` and `BETTER_AUTH_SECRET`:
```bash
npm run auth:migrate
```

The migration uses Better Auth's installed migration API directly, so it does not need `npx` to download a separate CLI. Email verification is temporarily disabled in all environments; users can create accounts and sign in without receiving an email. Paystack checkout accepts the signed-in account email without requiring it to be verified. Password-reset email delivery still requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL` set to an address on a domain verified in Resend. Set `BETTER_AUTH_URL` to your app origin when deploying; local development defaults to `http://localhost:3000`. In Vercel production, the auth URL can use `APP_URL` or Vercel's production domain setting.

After sign-in, StatusPop imports the current browser's vendor profile and products once if the account has no saved profile. Later profile/product changes are synced to PostgreSQL. Data already cleared or stored in a different browser cannot be recovered by this migration. Account-owned product images and exported flyers are uploaded to Cloudinary; set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable uploads. The app keeps local drafts and downloads available if cloud storage is not configured.

### Paystack

The server-side Paystack flow requires `DATABASE_URL`, `PAYSTACK_SECRET_KEY`, `SESSION_SECRET` (at least 32 characters), and an HTTPS production `APP_URL`. It creates payment and entitlement tables in PostgreSQL as needed. In Vercel production, the configured project production domain can supply the app URL if `APP_URL` is omitted. Set Paystack's webhook URL to `https://your-domain/api/paystack/webhook`; use the same Paystack secret for webhook verification unless `PAYSTACK_WEBHOOK_SECRET` is configured. Checkout requires a signed-in account with a valid email address; email verification is currently disabled. The server sets prices, persists pending references before redirect, verifies payments directly with Paystack, validates account/plan/amount/currency, and applies entitlements transactionally and idempotently.

Administrator access remains separate: configure `ADMIN_PASSWORD` (at least 12 characters) and `SESSION_SECRET` (at least 32 characters). Admin login is server-verified, rate-limited, and uses an expiring HttpOnly cookie. The admin dashboard shows real Paystack transaction counts, successful-payment revenue, and the latest 100 payment records from PostgreSQL; customer emails are masked. Shop orders sent to vendors through WhatsApp are not stored in the app. Back up PostgreSQL and configure monitoring, webhook retries, and incident alerts before relying on paid plans in production.

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

### Deploy to Vercel

Import the repository into Vercel and use the included `vercel.json`. The frontend is built to `dist`; the Express API runs as a Vercel Function. Add environment variables in Vercel's project settings. Use a separate Neon database for previews/development when possible, and scope live Paystack keys to Production only. Set `DATABASE_URL`, `DATABASE_SSL=true`, `BETTER_AUTH_SECRET`, Resend settings, and Cloudinary settings for the environments where you want those features. Set `APP_URL` and `BETTER_AUTH_URL` to the production origin when you have it; Better Auth and Paystack can use Vercel's configured production domain as a fallback. Paystack checkout still requires an HTTPS production origin. Vercel functions are request-driven, not persistent background servers. Review Vercel's current plan terms and limits for your intended commercial use.

---

## 📱 App Highlights
- **15 Sector Templates**: Auto Mechanics, Artisans & Plumbers, Church & Ministries, Thrift Multi-Grids, Barbers & Salons, Boutique Fashion, Tech Gadgets.
- **WhatsApp DP Creator**: Dedicated square profile picture generator with business badges, services, and phone number.
- **Special Holiday Flyers**: Independence Day, Christmas, New Year, Easter, Eid, and Customer Appreciation cards.
- **Online payments**: Server-side Paystack initialization, verification, signed webhooks, and PostgreSQL-backed entitlements. Requires production secrets/database configuration; shop orders use a direct WhatsApp handoff and are not stored by this app.
- **Public mini shops**: Signed-in vendors can share `https://status-pop.vercel.app/shop/<store-slug>`. Shop profiles and published products load from PostgreSQL; shop pages stay available independently of Day Pass or Pro flyer-plan expiry. Unpublished products and bank/payment details are not shown publicly.
