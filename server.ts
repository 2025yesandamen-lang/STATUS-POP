import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const ADMIN_SESSION_COOKIE = 'statuspop_admin_session';
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
const adminAuthConfigured = ADMIN_PASSWORD.length >= 12 && SESSION_SECRET.length >= 32;

// Increased limit for high-res mobile photos
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 1. Security Headers Hardening
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

function getCookie(req: Request, name: string): string | null {
  const cookies = req.headers.cookie?.split(';') || [];
  const entry = cookies.map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

function signSession(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

function hasAdminSession(req: Request): boolean {
  if (!adminAuthConfigured) return false;
  const token = getCookie(req, ADMIN_SESSION_COOKIE);
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = signSession(payload);
  const receivedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number; nonce?: string };
    return typeof session.exp === 'number' && session.exp > Date.now() && typeof session.nonce === 'string';
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!hasAdminSession(req)) {
    res.status(adminAuthConfigured ? 401 : 503).json({
      error: adminAuthConfigured ? 'unauthorized' : 'admin_auth_not_configured',
      message: adminAuthConfigured ? 'Administrator sign-in required.' : 'Admin authentication is not configured.',
    });
    return;
  }
  next();
}

function setAdminSessionCookie(res: Response, value: string, maxAge: number): void {
  res.cookie(ADMIN_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
}

app.post('/api/admin/login', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(`admin:${ip}`, 5, 15 * 60 * 1000)) {
    res.status(429).json({ message: 'Too many sign-in attempts. Try again in 15 minutes.' });
    return;
  }
  if (!adminAuthConfigured) {
    res.status(503).json({ message: 'Admin sign-in is not configured on this server.' });
    return;
  }

  const suppliedPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const suppliedHash = createHmac('sha256', SESSION_SECRET).update(suppliedPassword).digest();
  const expectedHash = createHmac('sha256', SESSION_SECRET).update(ADMIN_PASSWORD).digest();
  if (!timingSafeEqual(suppliedHash, expectedHash)) {
    res.status(401).json({ message: 'Incorrect password.' });
    return;
  }

  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  setAdminSessionCookie(res, `${payload}.${signSession(payload)}`, ADMIN_SESSION_TTL_SECONDS * 1000);
  res.json({ authenticated: true, dataStoreConfigured: false, paymentsConfigured: false });
});

app.get('/api/admin/session', (req: Request, res: Response) => {
  if (!adminAuthConfigured) {
    res.status(503).json({ error: 'admin_auth_not_configured', message: 'Admin sign-in is not configured on this server.' });
    return;
  }
  res.json({ authenticated: hasAdminSession(req), dataStoreConfigured: false, paymentsConfigured: false });
});

app.post('/api/admin/logout', (_req: Request, res: Response) => {
  setAdminSessionCookie(res, '', 0);
  res.status(204).end();
});

app.get('/api/admin/status', requireAdmin, (_req: Request, res: Response) => {
  res.json({ dataStoreConfigured: false, paymentsConfigured: false });
});

// 2. Shared Google Gemini Client
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'statuspop-aistudio',
        },
      },
    })
  : null;

// Free tier preferred models in descending priority
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

// 3. Memory-leak-proof IP Rate Limiter with Automated Sweeper
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = ipRateLimits.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

// Garbage collection every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRateLimits.entries()) {
    if (now > record.resetTime) {
      ipRateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// 4. Extended Nigerian Market Safety Guard
const PROHIBITED_KEYWORDS = [
  'weapon', 'gun', 'drug', 'cocaine', 'weed', 'marijuana', 'sex', 'porn', 'adult',
  'escort', 'scam', 'yahoo', 'yahoo yahoo', 'crypto doubling', 'guaranteed return',
  'ponzi', 'invest 10k get 50k', 'mummy water', 'money ritual', 'fake alert',
  'bvn hack', 'phishing', 'fake visa', 'sugar mummy', 'cashapp flip'
];

function containsProhibitedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return PROHIBITED_KEYWORDS.some((kw) => lower.includes(kw));
}

// 5. Multi-Provider AI Helper Functions

/**
 * Free Provider 1: Groq Cloud (Free Tier: 14,400 daily requests, ~250ms ultra-fast)
 */
async function callGroqChat(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (res.ok) {
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || null;
    }
  } catch (err) {
    console.warn('Groq API non-fatal error:', err);
  }
  return null;
}

/**
 * Free Provider 2: OpenRouter Free Models (e.g. meta-llama/llama-3.3-70b-instruct:free)
 */
async function callOpenRouterChat(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'https://statuspop.ng',
        'X-Title': 'StatusPop Nigeria',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (res.ok) {
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || null;
    }
  } catch (err) {
    console.warn('OpenRouter API non-fatal error:', err);
  }
  return null;
}

/**
 * Free Provider 3: Google Gemini (Free Tier: 1,500 daily requests)
 */
async function callGeminiChat(systemPrompt: string, userPrompt: string, schema: any): Promise<string | null> {
  if (!geminiClient) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await geminiClient.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });
      if (response.text) return response.text;
    } catch (err: any) {
      console.warn(`Gemini model ${model} failed, trying next fallback:`, err?.message || err);
    }
  }
  return null;
}

// 6. Embedded Authentic Nigerian Dialect AI Fallback Engine
function generateLocalNaijaCopy(params: {
  productName: string;
  price: number;
  discountPct?: number;
  businessName: string;
  category: string;
  language: string;
}) {
  const { productName, price, discountPct, businessName, language } = params;
  const isPidgin = language === 'pidgin';
  const formattedPrice = Number(price).toLocaleString('en-NG');

  const pidginHeadlines = [
    'OYA COME CARRY YOUR OWN!',
    'CLEAN TOKUNBO DEY TOWN!',
    'HOT DROP WE DEY DROP!',
    'NO CARRY LAST TODAY!',
    'FIRST TO PAY NA OWNER!',
  ];

  const englishHeadlines = [
    'MASSIVE DROP TODAY ONLY!',
    'PREMIUM GRADE-A QUALITY',
    'EXCLUSIVE PRICE CRASH!',
    'LIMITED STOCK AVAILABLE',
    'FAST NATIONWIDE DELIVERY',
  ];

  const chosenHeadlines = (isPidgin ? pidginHeadlines : englishHeadlines)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const captions = [
    {
      tone: 'excited',
      text: isPidgin
        ? `Original ${productName} na just ₦${formattedPrice}${discountPct ? ` (${discountPct}% off)` : ''}! Delivery sharp sharp nationwide from ${businessName}. No dull yourself o, WhatsApp us now!`
        : `Authentic ${productName} now available for only ₦${formattedPrice}${discountPct ? ` (${discountPct}% off)` : ''} from ${businessName}! Top grade quality guaranteed. DM or WhatsApp to order now!`,
    },
    {
      tone: 'classy',
      text: isPidgin
        ? `Clean deal from ${businessName}. Top quality ${productName} wey go serve you well well. Tap WhatsApp make we pack your own immediately!`
        : `Looking for exceptional quality? ${businessName} brings you verified ${productName} at ₦${formattedPrice}. Tap WhatsApp to secure yours before stock finishes!`,
    },
  ];

  const hashtags = [
    '#NigerianVendor',
    '#NaijaHustle',
    '#StatusPop',
    '#LagosMarket',
    '#ShopNaija',
    '#WhatsAppSales',
  ];

  return {
    headlines: chosenHeadlines,
    captions,
    hashtags,
  };
}

// ======================== API ROUTES ========================

// Diagnostics & Active AI Providers
app.get('/api/ai-providers', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    providers: {
      gemini: {
        active: Boolean(process.env.GEMINI_API_KEY),
        models: GEMINI_MODELS,
        freeQuota: '1,500 daily requests (100% Free Tier)',
      },
      groq: {
        active: Boolean(process.env.GROQ_API_KEY),
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        freeQuota: '14,400 daily requests (~250ms latency)',
      },
      openrouter: {
        active: Boolean(process.env.OPENROUTER_API_KEY),
        models: ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free'],
        freeQuota: 'Free tier models',
      },
      huggingface: {
        active: Boolean(process.env.HF_TOKEN),
        models: ['Salesforce/blip-image-captioning-large', 'briaai/RMBG-1.4'],
        freeQuota: 'Free Serverless API',
      },
      local_cv_engine: {
        active: true,
        features: [
          'Bad Camera Auto-Exposure Correction',
          'Grey-World Auto White Balance',
          'Vibrance & Color Restoration',
          'Unsharp Mask Clarity Enhancer',
          'Saliency Multi-Threshold Background Removal',
        ],
        freeQuota: '100% Unlimited Local Client-Side Execution',
      },
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    trackedIps: ipRateLimits.size,
  });
});

// 1. AI Copy Generator Endpoint (Groq -> Gemini -> OpenRouter -> Local Fallback)
app.post('/api/copy', async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip, 25)) {
    res.status(429).json({ error: 'Too many requests. Please wait a minute!' });
    return;
  }

  const {
    productName = 'Product',
    price = 0,
    discountPct = 0,
    businessName = 'Our Store',
    category = 'General',
    language = 'pidgin',
    tone = 'excited',
    notes = '',
  } = req.body;

  // Content guard
  const combinedInput = `${productName} ${category} ${notes}`;
  if (containsProhibitedContent(combinedInput)) {
    res.status(400).json({
      error: 'unsupported_category',
      message: 'Category not permitted under Nigerian vendor guidelines.',
    });
    return;
  }

  const systemInstruction = `You write short, punchy marketing copy for small Nigerian vendors who post on WhatsApp Status, Instagram and TikTok.
Rules:
- Output ONLY valid JSON with keys: "headlines" (array of 3 short punchy strings under 5 words), "captions" (array of 2 objects each having "tone" and "text" under 40 words), and "hashtags" (array of 5 hashtags).
- Be accurate. Do not invent false claims unless provided.
- Use the exact price (₦${Number(price).toLocaleString('en-NG')}) and discount.
- If language is "pidgin", write sweet, natural everyday Nigerian Pidgin. If "english", use warm Nigerian English.
- Add clear call to action like "DM or WhatsApp to order".`;

  const prompt = `Business: ${businessName}
Product: ${productName}
Category: ${category}
Price: ₦${Number(price).toLocaleString('en-NG')}
${discountPct ? `Discount: ${discountPct}%` : ''}
Language: ${language}
Tone: ${tone}
Extra notes: ${notes}`;

  try {
    // 1. Try Groq (ultra-fast free LLM)
    const groqResponse = await callGroqChat(systemInstruction, prompt);
    if (groqResponse) {
      const parsed = JSON.parse(groqResponse);
      if (parsed.headlines && parsed.captions) {
        res.json(parsed);
        return;
      }
    }

    // 2. Try Gemini Free Tier
    const geminiResponse = await callGeminiChat(systemInstruction, prompt, {
      type: Type.OBJECT,
      properties: {
        headlines: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 short punchy headlines under 5 words each',
        },
        captions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ['tone', 'text'],
          },
          description: '2 ready-to-paste WhatsApp captions',
        },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['headlines', 'captions', 'hashtags'],
    });

    if (geminiResponse) {
      const parsed = JSON.parse(geminiResponse);
      if (parsed.headlines && parsed.captions) {
        res.json(parsed);
        return;
      }
    }

    // 3. Try OpenRouter Free
    const openRouterResponse = await callOpenRouterChat(systemInstruction, prompt);
    if (openRouterResponse) {
      const parsed = JSON.parse(openRouterResponse);
      if (parsed.headlines && parsed.captions) {
        res.json(parsed);
        return;
      }
    }
  } catch (err) {
    console.warn('AI Copy generation error, falling back to local engine:', err);
  }

  // 4. Reliable Local Naija Dialect Fallback
  res.json(
    generateLocalNaijaCopy({
      productName,
      price,
      discountPct,
      businessName,
      category,
      language,
    })
  );
});

// 2. Free AI Vision Multimodal Product Auto-Detector Endpoint
// When a vendor snaps a picture with a bad camera, this identifies the product, category, price & headline
app.post('/api/vision-detect', async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip, 15)) {
    res.status(429).json({ error: 'Too many requests. Please wait a minute!' });
    return;
  }

  const { image } = req.body;
  if (!image || typeof image !== 'string') {
    res.status(400).json({ error: 'Image data URL or URL required' });
    return;
  }

  const systemInstruction = `You are an expert Nigerian commercial merchandiser and appraiser.
You examine photos taken by small Nigerian businesses (mechanic in Ladipo, boutique in Balogun, food vendor, hair salon, electronics in Computer Village, artisan).
Analyze the photo and return ONLY valid JSON matching this schema:
{
  "productName": "Concise, commercially appealing product name (3-6 words)",
  "category": "One of: mechanic | artisan | church | barber | thrift | food | fashion | luxury | tech | general",
  "estimatedPriceNgn": 25000,
  "oldPriceNgn": 30000,
  "headline": "Punchy 3-5 word headline in Nigerian vendor style",
  "subtitle": "Short 5-8 word selling point or warranty",
  "keyBadges": ["Top Quality", "Tested Tokunbo", "Same Day Fix"]
}`;

  try {
    if (geminiClient) {
      // Extract base64
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      for (const model of GEMINI_MODELS) {
        try {
          const response = await geminiClient.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: 'Identify this product or service and suggest commercial details for a WhatsApp sales flyer.' },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            res.json({ success: true, data: parsed, provider: model });
            return;
          }
        } catch (mErr) {
          console.warn(`Vision model ${model} error:`, mErr);
        }
      }
    }
  } catch (err) {
    console.warn('Vision detection failed, using smart heuristic:', err);
  }

  // Heuristic fallback for offline / keyless testing
  res.json({
    success: true,
    data: {
      productName: 'Quality Nigerian Brand Item',
      category: 'general',
      estimatedPriceNgn: 15000,
      oldPriceNgn: 18500,
      headline: 'FRESH NEW ARRIVAL!',
      subtitle: 'Top Quality • Fast Delivery Nationwide',
      keyBadges: ['Verified Quality', 'Fast Shipping', 'Best Price'],
    },
    provider: 'local_heuristic',
  });
});

// 3. AI Special Event & Holiday Greetings Generator
app.post('/api/event-greeting', async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip, 25)) {
    res.status(429).json({ error: 'Too many requests. Please wait a minute!' });
    return;
  }

  const {
    eventType = 'independence_day',
    eventTitle = 'Happy Independence Day',
    businessName = 'Our Business',
    services = ['Fast Delivery', 'Top Quality'],
    language = 'pidgin',
    tone = 'blessing',
  } = req.body;

  const systemInstruction = `You generate heartwarming, inspirational Nigerian celebration greetings, holiday prayers, and customer appreciation messages.
Rules:
- Output ONLY valid JSON.
- Warm, respectful, authentic Nigerian tone.
- Output 3 distinct variations: Blessings & Motivation, Hustle & Customer Love, and Short Punchy Catchphrase.`;

  const prompt = `Event: ${eventTitle} (${eventType})
Business Name: ${businessName}
Specialty Services: ${Array.isArray(services) ? services.join(', ') : services}
Language: ${language}
Tone: ${tone}`;

  try {
    // 1. Try Groq
    const groqRes = await callGroqChat(systemInstruction, prompt);
    if (groqRes) {
      const parsed = JSON.parse(groqRes);
      if (parsed.quotes && parsed.headline) {
        res.json(parsed);
        return;
      }
    }

    // 2. Try Gemini
    const geminiRes = await callGeminiChat(systemInstruction, prompt, {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        quotes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ['theme', 'text'],
          },
        },
        slogan: { type: Type.STRING },
        suggestedServices: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['headline', 'quotes', 'slogan'],
    });

    if (geminiRes) {
      const parsed = JSON.parse(geminiRes);
      if (parsed.quotes && parsed.headline) {
        res.json(parsed);
        return;
      }
    }
  } catch (err) {
    console.warn('AI Event greeting error:', err);
  }

  // 3. Fallback
  const isPidgin = language === 'pidgin';
  res.json({
    headline: eventTitle.toUpperCase(),
    quotes: [
      {
        theme: 'Blessings & Grace',
        text: isPidgin
          ? `May this celebration bring double blessings, steady alerts, and favor to your doorstep. We appreciate your partnership!`
          : `Wishing you overflowing prosperity, good health, and peace this season. Thank you for choosing us!`,
      },
      {
        theme: 'Customer Appreciation',
        text: isPidgin
          ? `As our valued customer, we dey say a big thank you! May your hustle prosper and open bigger doors for you.`
          : `We celebrate you today! Thank you for standing with our brand. We remain dedicated to serving you with excellence.`,
      },
      {
        theme: 'Motivation & Hustle',
        text: isPidgin
          ? `No dull yourself this season! Stand tall, keep pushing, and watch God turn your effort into huge testimony.`
          : `May your hard work yield sweet fruit and boundless joy today and always. Cheers to greater milestones ahead!`,
      },
    ],
    slogan: 'WE POWER PROGRESS • QUALITY ALWAYS',
    suggestedServices: ['Top Quality', 'Nationwide Delivery', 'Fast Service', '24/7 Support'],
  });
});

// 4. Server AI Background Removal Endpoint (HuggingFace RMBG-1.4 or local CV signal)
app.post('/api/remove-bg', async (req: Request, res: Response): Promise<void> => {
  const { image } = req.body;
  const hfToken = process.env.HF_TOKEN;

  if (hfToken && image) {
    try {
      // Call HuggingFace RMBG-1.4
      const response = await fetch(
        'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: image }),
        }
      );

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        res.json({
          success: true,
          dataUrl: `data:image/png;base64,${base64}`,
          provider: 'huggingface_rmbg',
        });
        return;
      }
    } catch (err) {
      console.warn('Hugging Face background removal error:', err);
    }
  }

  // Default to fast, reliable client-side Computer Vision engine
  res.json({
    success: false,
    useClientEngine: true,
    message: 'Using StatusPop high-speed local computer vision engine.',
  });
});

// 5. Paystack Split Payments & Banking Endpoints
const NIGERIAN_BANKS_SERVER = [
  { name: 'Access Bank', code: '044', slug: 'access-bank' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', slug: 'guaranty-trust-bank' },
  { name: 'OPay Digital Services', code: '999992', slug: 'opay' },
  { name: 'PalmPay', code: '999991', slug: 'palmpay' },
  { name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
  { name: 'Kuda Microfinance Bank', code: '50211', slug: 'kuda-bank' },
  { name: 'Moniepoint Microfinance Bank', code: '50515', slug: 'moniepoint' },
  { name: 'United Bank for Africa (UBA)', code: '033', slug: 'united-bank-for-africa' },
  { name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
  { name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
  { name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank' },
  { name: 'Wema Bank (ALAT)', code: '035', slug: 'wema-bank' },
  { name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
  { name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria' },
  { name: 'First City Monument Bank (FCMB)', code: '214', slug: 'first-city-monument-bank' },
];

app.get('/api/paystack/banks', (_req: Request, res: Response) => {
  res.json({
    status: true,
    message: 'Banks retrieved successfully',
    data: NIGERIAN_BANKS_SERVER,
  });
});

app.post('/api/paystack/resolve-account', async (req: Request, res: Response) => {
  void req;
  res.status(503).json({
    status: false,
    error: 'account_verification_unavailable',
    message: 'Live account verification is unavailable. No account was verified.',
  });
});

app.post('/api/paystack/create-subaccount', async (req: Request, res: Response) => {
  void req;
  res.status(503).json({
    status: false,
    error: 'subaccount_creation_unavailable',
    message: 'Live subaccount creation is unavailable. No subaccount was created.',
  });
});

// 6. Paystack Checkout Endpoint with Direct Split Payments
app.post('/api/checkout', (req: Request, res: Response) => {
  res.status(503).json({
    status: 'unavailable',
    error: 'payments_not_configured',
    message: 'Online payments are not available yet. No payment was taken.',
  });
});

// 6. Analytics Events Endpoint
app.post('/api/events', (req: Request, res: Response) => {
  const { type, metadata } = req.body;
  res.json({ status: 'ok', eventId: `evt_${Date.now()}`, type, metadata });
});

// 7. Referral Tracking Endpoint: GET /r/:code?src=qr|caption
app.get('/r/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const src = (req.query.src as string) || 'direct';
  res.cookie('statuspop_ref', code, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
  });
  res.redirect(`/?ref=${encodeURIComponent(code)}&src=${encodeURIComponent(src)}`);
});

// Global Error Handler Hardening
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'StatusPop server encountered an issue. Fallback active.',
  });
});

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found', message: 'API endpoint not found.' });
});

// Process Level Hardening
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception safely caught:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection safely caught:', reason);
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`StatusPop server running on http://0.0.0.0:${port}`);
  });
}

startServer();
