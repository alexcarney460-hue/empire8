import { getSupabaseServer } from '@/lib/supabase-server';
import { runAgent } from './agent-runner';

interface CampaignBrief {
  brief: string;
  channel?: 'email' | 'sms' | 'both';
  campaign_type?: 'one_shot' | 'sequence';
}

interface OrchestratorResult {
  campaign_id: string;
  segment_id: string;
  templates: Array<{ id: string; channel: string; subject?: string }>;
  total_recipients: number;
  status: string;
  agent_runs: string[];
}

/** Full campaign orchestration from a natural language brief */
export async function orchestrateCampaign(input: CampaignBrief): Promise<OrchestratorResult> {
  const supabase = getSupabaseServer();
  if (!supabase) throw new Error('DB unavailable');

  const agentRuns: string[] = [];

  // Step 1: Orchestrator interprets the brief
  const planResult = await runAgent('orchestrator', `
Campaign brief: "${input.brief}"
Channel preference: ${input.channel || 'auto-detect'}
Type: ${input.campaign_type || 'auto-detect'}

Analyze this brief and output a JSON plan with:
{
  "campaign_name": "short descriptive name",
  "channel": "email" | "sms" | "both",
  "campaign_type": "one_shot" | "sequence",
  "audience_description": "describe the target audience for the segmenter",
  "content_brief": "describe what the copy should say",
  "num_steps": 1,
  "step_delays_days": [0],
  "send_days": ["tue", "wed", "thu"],
  "send_window_start": "09:00",
  "send_window_end": "11:00"
}
  `);
  agentRuns.push(planResult.run_id);

  const plan = planResult.parsed as Record<string, unknown> | null;
  if (!plan) throw new Error('Orchestrator failed to produce a valid plan');

  const campaignName = (plan.campaign_name as string) || 'Untitled Campaign';
  const channel = (plan.channel as string) || input.channel || 'email';
  const campaignType = (plan.campaign_type as string) || 'one_shot';
  const audienceDesc = (plan.audience_description as string) || input.brief;
  const contentBrief = (plan.content_brief as string) || input.brief;
  const numSteps = (plan.num_steps as number) || 1;
  const stepDelays = (plan.step_delays_days as number[]) || [0];

  // Step 2: Segmenter builds audience
  const segResult = await runAgent('segmenter', `
Build an audience segment for this campaign:
"${audienceDesc}"

Our CRM has these lists: Cannabis Grows (list_id=1), Grow Distributors (list_id=2).
Contacts have: email, phone, lead_status, lifecycle_stage, city, state, source.
Companies have: name, domain, city, state.

Output JSON:
{
  "segment_name": "descriptive name",
  "segment_description": "what this segment targets",
  "filter_criteria": {
    "has_email": true,
    "lead_status": ["NEW", "CONTACTED"],
    "list_ids": [1],
    "states": []
  }
}
  `);
  agentRuns.push(segResult.run_id);

  const segPlan = segResult.parsed as Record<string, unknown> | null;
  const filterCriteria = segPlan?.filter_criteria || { has_email: true };

  // Create segment in DB
  const { data: segment } = await supabase.from('segments').insert({
    name: (segPlan?.segment_name as string) || 'Campaign Segment',
    description: (segPlan?.segment_description as string) || audienceDesc,
    filter_criteria: filterCriteria,
  }).select('id').single();

  if (!segment) throw new Error('Failed to create segment');

  // Count matching contacts based on filter criteria
  const filters = filterCriteria as Record<string, unknown>;
  let contactQuery = supabase.from('contacts').select('id', { count: 'exact', head: true });
  if (filters.has_email) contactQuery = contactQuery.not('email', 'is', null);
  if (filters.has_phone) contactQuery = contactQuery.not('phone', 'is', null);
  if (Array.isArray(filters.lead_status) && filters.lead_status.length > 0) {
    contactQuery = contactQuery.in('lead_status', filters.lead_status as string[]);
  }
  if (Array.isArray(filters.states) && filters.states.length > 0) {
    contactQuery = contactQuery.in('state', filters.states as string[]);
  }

  const { count: contactCount } = await contactQuery;
  const totalRecipients = contactCount ?? 0;

  // Update segment cached count
  await supabase.from('segments').update({
    cached_count: totalRecipients,
    cached_at: new Date().toISOString(),
  }).eq('id', segment.id);

  // Step 3: Copy Generator creates templates
  const templates: Array<{ id: string; channel: string; subject?: string }> = [];

  for (let step = 0; step < numSteps; step++) {
    const stepLabel = numSteps > 1 ? ` (Step ${step + 1} of ${numSteps})` : '';
    const copyResult = await runAgent('copywriter', `
Generate ${channel === 'sms' ? 'SMS' : 'email'} marketing content${stepLabel}:
"${contentBrief}"

${channel !== 'sms' ? `Output JSON:
{
  "subject_variants": ["Subject A", "Subject B"],
  "body_html": "<html>...</html>",
  "body_text": "plain text version",
  "tokens_used": ["first_name", "company_name", "city"]
}` : `Output JSON:
{
  "body_text": "SMS message under 160 chars with {{first_name}} token",
  "variants": ["variant A", "variant B"],
  "tokens_used": ["first_name", "company_name"]
}`}
    `);
    agentRuns.push(copyResult.run_id);

    const copyData = copyResult.parsed as Record<string, unknown> | null;
    const subjects = (copyData?.subject_variants as string[]) || ['Campaign Email'];
    const bodyHtml = (copyData?.body_html as string) || '';
    const bodyText = (copyData?.body_text as string) || copyResult.output;
    const tokensUsed = (copyData?.tokens_used as string[]) || [];

    // Save template
    const templateChannel = channel === 'both' ? 'email' : channel;
    const { data: template } = await supabase.from('templates').insert({
      name: `${campaignName}${stepLabel}`,
      channel: templateChannel,
      subject: subjects[0] || null,
      body_html: bodyHtml || null,
      body_text: bodyText,
      category: campaignType === 'sequence' ? 'drip' : 'campaign',
      tokens_used: tokensUsed,
      created_by: 'agent',
    }).select('id, channel, subject').single();

    if (template) templates.push(template);
  }

  // Step 4: Create campaign record
  const { data: campaign } = await supabase.from('campaigns').insert({
    name: campaignName,
    description: contentBrief,
    channel,
    campaign_type: campaignType,
    status: 'review',
    segment_id: segment.id,
    send_window_start: (plan.send_window_start as string) || '09:00',
    send_window_end: (plan.send_window_end as string) || '11:00',
    send_days: (plan.send_days as string[]) || ['tue', 'wed', 'thu'],
    batch_size: 50,
    total_recipients: totalRecipients,
    agent_brief: input.brief,
  }).select('id').single();

  if (!campaign) throw new Error('Failed to create campaign');

  // Create sequence steps
  for (let i = 0; i < templates.length; i++) {
    await supabase.from('sequence_steps').insert({
      campaign_id: campaign.id,
      step_number: i + 1,
      template_id: templates[i].id,
      delay_days: stepDelays[i] ?? 0,
      condition: i === 0 ? 'always' : 'no_reply',
    });
  }

  return {
    campaign_id: campaign.id,
    segment_id: segment.id,
    templates,
    total_recipients: totalRecipients,
    status: 'review',
    agent_runs: agentRuns,
  };
}
