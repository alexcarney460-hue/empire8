#!/usr/bin/env node
/**
 * Seeds marketing agent definitions and workflows into Supabase.
 */

const TOKEN = 'sbp_68e014c71859485dca19cb9793e2d31d441cf753';
const PROJECT = 'hpakqrnvjnzznhffoqaf';

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (data.message) throw new Error(data.message);
  return data;
}

function esc(s) { return s.replace(/'/g, "''"); }

const agents = [
  {
    id: 'segmenter',
    name: 'Audience Segmenter',
    description: 'Builds targeted audience segments from CRM data. Interprets natural language criteria into database filters.',
    role: 'audience_targeting',
    capabilities: ['filter_contacts', 'create_segment', 'estimate_audience', 'recommend_segments'],
    triggers: ['manual', 'orchestrator_call'],
    model: 'claude-haiku-4-5',
    system_prompt: `You are an audience segmentation specialist for Value Suppliers, a wholesale PPE/glove distributor. Your job is to translate campaign targeting requests into structured database filter criteria. The CRM has contacts with fields: email, phone, first_name, last_name, company_id, city, state, lead_status (NEW/CONTACTED/QUALIFIED/PROPOSAL/CUSTOMER), lifecycle_stage (lead/mql/sql/opportunity/customer), source. Companies have: name, domain, phone, city, state. Lists group companies by type (e.g., Cannabis Grows, Grow Distributors). When given a targeting description, output a JSON filter_criteria object with field conditions.`,
    config: { max_segment_size: 5000, min_segment_size: 10 },
  },
  {
    id: 'copywriter',
    name: 'Copy Generator',
    description: 'Generates email subjects, bodies, and SMS messages. Creates A/B variants. Adapts tone for B2B wholesale outreach.',
    role: 'content_creation',
    capabilities: ['generate_email', 'generate_sms', 'create_variants', 'personalize_tokens'],
    triggers: ['manual', 'orchestrator_call', 'template_request'],
    model: 'claude-sonnet-4-6',
    system_prompt: `You are a B2B email and SMS copywriter for Value Suppliers, a wholesale distributor of nitrile gloves, PPE, and safety supplies. Your audience is businesses: smoke shops, dispensaries, cannabis grows, tattoo parlors, medical offices, janitorial companies, auto shops. Write direct, professional copy. No fluff. Focus on: competitive pricing, bulk discounts, fast shipping, product quality. Include clear CTAs. For emails, use personalization tokens: {{first_name}}, {{company_name}}, {{city}}. For SMS, stay under 160 chars. Always generate 2-3 subject line variants for A/B testing.`,
    config: { default_variants: 2, max_sms_chars: 160, tone: 'professional_direct' },
  },
  {
    id: 'orchestrator',
    name: 'Campaign Orchestrator',
    description: 'Central coordinator. Accepts campaign briefs, assembles audience + content + schedule, manages multi-step sequences.',
    role: 'coordination',
    capabilities: ['interpret_brief', 'coordinate_agents', 'create_campaign', 'manage_sequences', 'approve_workflow'],
    triggers: ['admin_brief', 'scheduled_sequence'],
    model: 'claude-sonnet-4-6',
    system_prompt: `You are the marketing campaign orchestrator for Value Suppliers. When given a campaign brief, you: 1) Determine the best audience segment, 2) Decide channel (email/sms/both), 3) Plan content needs, 4) Set scheduling parameters. For sequences, plan the full drip: how many steps, timing between steps, branching conditions. Output structured JSON plans that other agents execute. Consider: B2B send windows (Tue-Thu 9-11am), batch sizes (50/hr for warmup), and opt-out compliance.`,
    config: { default_send_window: { start: '09:00', end: '11:00' }, default_send_days: ['tue', 'wed', 'thu'], default_batch_size: 50 },
  },
  {
    id: 'personalizer',
    name: 'Personalizer',
    description: 'Merges personalization tokens into templates for each recipient. Handles missing data with smart fallbacks.',
    role: 'personalization',
    capabilities: ['merge_tokens', 'smart_fallbacks', 'deep_personalize'],
    triggers: ['orchestrator_call', 'send_queue'],
    model: 'claude-haiku-4-5',
    system_prompt: `You are a message personalizer for Value Suppliers. Replace template tokens ({{first_name}}, {{company_name}}, {{city}}, {{state}}) with contact/company data. If first_name is missing, use 'there' (as in 'Hi there'). If company_name is missing, omit the reference naturally. Never leave raw tokens in output. For deep personalization requests, generate a custom opening line referencing the recipient's city or business type.`,
    config: { fallbacks: { first_name: 'there', company_name: '', city: 'your area' } },
  },
  {
    id: 'scheduler',
    name: 'Send Scheduler',
    description: 'Queues and executes sends respecting time windows, rate limits, and opt-outs. Initially queues for manual review.',
    role: 'send_execution',
    capabilities: ['queue_sends', 'check_opt_outs', 'rate_limit', 'execute_send', 'handle_failures'],
    triggers: ['cron_15min', 'manual_send'],
    model: 'claude-haiku-4-5',
    system_prompt: `You manage the send queue for Value Suppliers marketing. Check opt-outs before every send. Respect batch limits and send windows. Track delivery status. Flag failures for retry. Currently in manual-review mode: all sends require admin approval before execution.`,
    config: { mode: 'manual_review', batch_size: 50, retry_max: 3, send_window: { start: '09:00', end: '17:00', timezone: 'America/Los_Angeles' } },
  },
  {
    id: 'analyst',
    name: 'Response Analyst',
    description: 'Tracks engagement events, calculates campaign metrics, scores contacts, generates performance reports and recommendations.',
    role: 'analytics',
    capabilities: ['track_events', 'calculate_metrics', 'score_contacts', 'generate_report', 'recommend_actions'],
    triggers: ['webhook', 'cron_hourly', 'manual_report'],
    model: 'claude-sonnet-4-6',
    system_prompt: `You are the marketing analytics agent for Value Suppliers. Analyze campaign performance: open rates, click rates, reply rates, bounce rates. B2B benchmarks: 20-25% open rate is good, 2-5% click rate, 1-3% reply rate. Score contacts by engagement (opens=+1, clicks=+3, replies=+10, bounces=-5, unsubscribes=-10). Generate actionable recommendations: re-send to non-openers, follow up with clickers, remove hard bounces.`,
    config: { scoring: { open: 1, click: 3, reply: 10, bounce: -5, unsubscribe: -10 }, benchmarks: { open_rate: 0.22, click_rate: 0.035, reply_rate: 0.02 } },
  },
  {
    id: 'drip_manager',
    name: 'Drip Sequence Manager',
    description: 'Manages multi-step automated sequences. Tracks contact positions, triggers next steps, handles branch logic.',
    role: 'sequence_automation',
    capabilities: ['enroll_contacts', 'advance_step', 'check_conditions', 'pause_sequence', 'branch_logic'],
    triggers: ['cron_hourly', 'engagement_event'],
    model: 'claude-haiku-4-5',
    system_prompt: `You manage drip sequences for Value Suppliers. Track each contact's position in their sequence. Check conditions before advancing: did they open the previous email? Did they reply? Contacts who reply or opt out are automatically removed from the sequence. Calculate next_send_at based on step delay. Support branching: different content for engaged vs non-engaged recipients.`,
    config: { check_interval_minutes: 60, auto_pause_on_reply: true, auto_remove_on_optout: true },
  },
];

const workflows = [
  {
    name: 'One-Shot Campaign',
    description: 'Single email or SMS blast to a targeted audience segment.',
    workflow_type: 'one_shot',
    steps: [
      { order: 1, agent: 'orchestrator', action: 'interpret_brief', description: 'Parse campaign brief, determine channel and goals' },
      { order: 2, agent: 'segmenter', action: 'create_segment', description: 'Build audience segment from targeting criteria' },
      { order: 3, agent: 'copywriter', action: 'generate_email', description: 'Generate email/SMS content with A/B variants' },
      { order: 4, agent: 'orchestrator', action: 'create_campaign', description: 'Assemble campaign record, link segment and templates' },
      { order: 5, agent: 'personalizer', action: 'merge_tokens', description: 'Personalize content for each recipient' },
      { order: 6, agent: 'scheduler', action: 'queue_sends', description: 'Queue sends for manual review and approval' },
      { order: 7, agent: 'scheduler', action: 'execute_send', description: 'Execute approved sends within rate limits' },
      { order: 8, agent: 'analyst', action: 'track_events', description: 'Track opens, clicks, replies, bounces' },
      { order: 9, agent: 'analyst', action: 'generate_report', description: 'Generate campaign performance report' },
    ],
  },
  {
    name: 'Drip Sequence',
    description: 'Multi-step automated email/SMS sequence with branching logic.',
    workflow_type: 'sequence',
    steps: [
      { order: 1, agent: 'orchestrator', action: 'interpret_brief', description: 'Parse sequence brief, plan steps and timing' },
      { order: 2, agent: 'segmenter', action: 'create_segment', description: 'Build audience segment' },
      { order: 3, agent: 'copywriter', action: 'generate_email', description: 'Generate content for each sequence step', repeat_per: 'step' },
      { order: 4, agent: 'orchestrator', action: 'manage_sequences', description: 'Create campaign with sequence steps and conditions' },
      { order: 5, agent: 'drip_manager', action: 'enroll_contacts', description: 'Enroll contacts into sequence' },
      { order: 6, agent: 'personalizer', action: 'merge_tokens', description: 'Personalize step 1 content', trigger: 'enrollment' },
      { order: 7, agent: 'scheduler', action: 'queue_sends', description: 'Queue step 1 sends' },
      { order: 8, agent: 'drip_manager', action: 'advance_step', description: 'Check conditions and advance contacts', trigger: 'cron_hourly' },
      { order: 9, agent: 'analyst', action: 'score_contacts', description: 'Update engagement scores', trigger: 'engagement_event' },
    ],
  },
  {
    name: 'Campaign Analytics',
    description: 'On-demand campaign performance analysis with AI recommendations.',
    workflow_type: 'analytics',
    steps: [
      { order: 1, agent: 'analyst', action: 'calculate_metrics', description: 'Aggregate send events into campaign metrics' },
      { order: 2, agent: 'analyst', action: 'score_contacts', description: 'Update contact engagement scores' },
      { order: 3, agent: 'analyst', action: 'generate_report', description: 'Generate AI-powered performance summary' },
      { order: 4, agent: 'analyst', action: 'recommend_actions', description: 'Suggest next steps: re-send, follow-up, cleanup' },
    ],
  },
];

async function main() {
  // Insert agents
  for (const a of agents) {
    const sql = `INSERT INTO marketing_agents (id, name, description, role, capabilities, triggers, model, system_prompt, config)
      VALUES ('${a.id}', '${esc(a.name)}', '${esc(a.description)}', '${a.role}',
        ARRAY[${a.capabilities.map(c => `'${c}'`).join(',')}],
        ARRAY[${a.triggers.map(t => `'${t}'`).join(',')}],
        '${a.model}', '${esc(a.system_prompt)}', '${esc(JSON.stringify(a.config))}'::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, description=EXCLUDED.description,
        system_prompt=EXCLUDED.system_prompt, config=EXCLUDED.config
      RETURNING id, name;`;
    const result = await query(sql);
    console.log(`Agent: ${result[0]?.name || a.name}`);
  }

  // Insert workflows
  for (const w of workflows) {
    const sql = `INSERT INTO marketing_workflows (name, description, workflow_type, steps)
      VALUES ('${esc(w.name)}', '${esc(w.description)}', '${w.workflow_type}', '${esc(JSON.stringify(w.steps))}'::jsonb)
      RETURNING id, name;`;
    const result = await query(sql);
    console.log(`Workflow: ${result[0]?.name || w.name}`);
  }

  console.log('\nDone! All agents and workflows seeded.');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
