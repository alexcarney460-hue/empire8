import Anthropic from '@anthropic-ai/sdk';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are a helpful assistant for Empire 8 Sales Direct, a professional supplier of disposable gloves and cannabis trimming supplies. Keep answers concise and friendly.

PRODUCTS:
- Nitrile gloves: 5mil blue (100/case), 5mil black (100/case), exam grade nitrile
- Latex: exam gloves (100/box)
- Vinyl: clear vinyl gloves (100/box)
- Cannabis trimming: premium scissors, trimming trays, trim bins, extraction supplies
- Available sizes: XS, S, M, L, XL

PRICING TIERS:
- Retail: $80/case ($8/box), 1–29 cases, buy online at /catalog
- Wholesale: $70/case ($7/box), save $10/case off retail, minimum 30 cases, apply at /wholesale
- Distribution: $60/case ($6/box), save $20/case off retail, minimum 120 cases, NET 30 available, apply at /distribution

AFFILIATE PROGRAM:
- Commission tiers: Starter 10% ($0–$10k), Growth 12% ($10k–$25k), Pro 15% ($25k–$75k), Elite 18% ($75k–$150k), Apex 20% ($150k+)
- NET-7 payouts for Elite & Apex
- Apply at /affiliate

SERVICES:
- On-site trimming services available
- Custom orders and bulk sourcing
- Contact for custom branding

CONTACT:
- Email: info@empire8salesdirect.com
- Website: empire8salesdirect.com

Always be helpful and direct. If asked about something outside your knowledge, direct them to info@empire8salesdirect.com. Do not make up prices or product specs not listed above.`;

export async function POST(req: Request) {
  if (!anthropic) {
    return Response.json(
      { error: 'Chat service is currently unavailable.' },
      { status: 503 }
    );
  }

  // Rate limit: 10 requests per minute per IP
  const ip = getClientIp(req);
  if (!rateLimit(`chat:${ip}`, 10, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages)) {
      return Response.json({ error: 'Bad Request: expected { messages: [...] }' }, { status: 400 });
    }

    // Input length validation
    if (messages.length > MAX_MESSAGES) {
      return Response.json({ error: `Too many messages. Maximum is ${MAX_MESSAGES}.` }, { status: 400 });
    }
    for (const m of messages) {
      if (typeof m.role !== 'string' || !['user', 'assistant'].includes(m.role)) {
        return Response.json({ error: 'Invalid message role.' }, { status: 400 });
      }
      if (typeof m.content !== 'string') {
        return Response.json({ error: 'Message content must be a string.' }, { status: 400 });
      }
      if (m.content.length > MAX_MESSAGE_LENGTH) {
        return Response.json({ error: `Message too long. Maximum is ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    return Response.json({
      choices: [{ message: { role: 'assistant', content: text } }],
    });
  } catch (err: unknown) {
    console.error('[/api/chat] error:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
