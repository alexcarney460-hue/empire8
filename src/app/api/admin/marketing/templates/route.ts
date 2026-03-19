import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
import { runAgent } from '@/lib/marketing/agent-runner';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const url = new URL(req.url);
  const channel = url.searchParams.get('channel');

  let query = supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (channel) query = query.eq('channel', channel);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();

  // If "generate" flag is set, use the copywriter agent
  if (body.generate && body.prompt) {
    const channel = body.channel || 'email';
    const result = await runAgent('copywriter', `
Generate a ${channel} template for:
"${body.prompt}"

${channel === 'email' ? `Output JSON:
{
  "name": "template name",
  "subject_variants": ["Subject A", "Subject B"],
  "body_html": "<html>email body</html>",
  "body_text": "plain text version",
  "tokens_used": ["first_name", "company_name"]
}` : `Output JSON:
{
  "name": "template name",
  "body_text": "SMS under 160 chars",
  "tokens_used": ["first_name"]
}`}
    `);

    const parsed = result.parsed as Record<string, unknown> | null;
    if (!parsed) {
      return NextResponse.json({ ok: true, generated: result.output, agent_run: result.run_id });
    }

    const subjects = (parsed.subject_variants as string[]) || [];
    const { data, error } = await supabase.from('templates').insert({
      name: (parsed.name as string) || body.prompt.slice(0, 50),
      channel,
      subject: subjects[0] || null,
      body_html: (parsed.body_html as string) || null,
      body_text: (parsed.body_text as string) || '',
      category: body.category || 'campaign',
      tokens_used: (parsed.tokens_used as string[]) || [],
      created_by: 'agent',
    }).select().single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data, agent_run: result.run_id }, { status: 201 });
  }

  // Manual template creation
  const { name, channel, subject, body_html, body_text, category } = body;
  if (!name || !channel) {
    return NextResponse.json({ ok: false, error: 'name and channel are required' }, { status: 400 });
  }

  const { data, error } = await supabase.from('templates').insert({
    name,
    channel,
    subject: subject || null,
    body_html: body_html || null,
    body_text: body_text || '',
    category: category || null,
    created_by: 'manual',
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
