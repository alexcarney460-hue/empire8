import Anthropic from '@anthropic-ai/sdk';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are a helpful assistant for Empire 8 Sales Direct, a licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties. Keep answers concise and friendly.

PRODUCTS:
- Premium indoor flower (multiple strains, lab-tested)
- Concentrates: live resin, distillate, shatter, wax
- Edibles: gummies, chocolates, beverages, baked goods
- Pre-rolls: singles, multi-packs, infused pre-rolls
- Vape cartridges and disposable vapes
- Dispensary accessories and supplies

PRICING:
- Wholesale pricing available for licensed NY dispensaries
- Volume discounts for consistent ordering
- Distribution-tier pricing for high-volume partners
- NET 30 terms available for qualified accounts
- Contact for specific product pricing and availability

SERVICES:
- Wholesale cannabis distribution across all 62 NY counties
- Dedicated account rep for each dispensary partner
- Recurring order programs (weekly, biweekly, monthly)
- Custom product sourcing and brand partnerships

CONTACT:
- Email: info@empire8salesdirect.com
- Website: empire8salesdirect.com
- Apply for wholesale: /wholesale
- Dispensary sign up: /dispensary-signup

Always be helpful and direct. If asked about something outside your knowledge, direct them to info@empire8salesdirect.com. Do not make up prices or product details not listed above.`;

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
