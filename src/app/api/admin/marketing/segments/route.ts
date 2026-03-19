import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';
import { runAgent } from '@/lib/marketing/agent-runner';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const { data, error } = await supabase
    .from('segments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();

  // AI-powered segment creation
  if (body.generate && body.description) {
    const result = await runAgent('segmenter', `
Build an audience segment for:
"${body.description}"

Our CRM lists: Cannabis Grows (list_id=1), Grow Distributors (list_id=2).
Contact fields: email, phone, first_name, last_name, lead_status, lifecycle_stage, city, state, source.

Output JSON:
{
  "segment_name": "descriptive name",
  "segment_description": "what this targets",
  "filter_criteria": {
    "has_email": true,
    "lead_status": [],
    "states": [],
    "list_ids": []
  },
  "estimated_size": "rough estimate"
}
    `);

    const parsed = result.parsed as Record<string, unknown> | null;
    if (!parsed) {
      return NextResponse.json({ ok: true, generated: result.output, agent_run: result.run_id });
    }

    const { data, error } = await supabase.from('segments').insert({
      name: (parsed.segment_name as string) || body.description.slice(0, 50),
      description: (parsed.segment_description as string) || body.description,
      filter_criteria: parsed.filter_criteria || {},
    }).select().single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data, agent_run: result.run_id }, { status: 201 });
  }

  // Manual segment creation
  const { name, description, filter_criteria } = body;
  if (!name) return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });

  const { data, error } = await supabase.from('segments').insert({
    name,
    description: description || null,
    filter_criteria: filter_criteria || {},
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
