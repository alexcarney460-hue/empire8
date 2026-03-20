/**
 * Pre-built expert profile templates for cannabis industry ThinkTank debates.
 * Each expert has a distinct perspective, argumentation style, and domain focus
 * to produce diverse, high-signal debate outputs.
 */

export interface ExpertProfile {
  readonly name: string;
  readonly title: string;
  readonly expertise_areas: readonly string[];
  readonly perspective_bias: string;
  readonly argumentation_style: string;
}

const EXPERT_TEMPLATES: readonly ExpertProfile[] = [
  {
    name: 'Rachel Vasquez',
    title: 'Cannabis Attorney',
    expertise_areas: [
      'regulatory compliance',
      'licensing law',
      'risk assessment',
      'contract negotiation',
      'cannabis litigation',
    ],
    perspective_bias: 'risk-averse',
    argumentation_style:
      'Methodical and precedent-driven. Cites regulatory frameworks and legal risks. ' +
      'Challenges assumptions with worst-case scenarios and compliance gaps.',
  },
  {
    name: 'Marcus Chen',
    title: 'Dispensary Operations Expert',
    expertise_areas: [
      'retail operations',
      'inventory management',
      'customer experience',
      'point-of-sale systems',
      'staff training',
    ],
    perspective_bias: 'operations-focused',
    argumentation_style:
      'Practical and detail-oriented. Grounds arguments in day-to-day operational reality. ' +
      'Pushes back on ideas that look good on paper but fail at store level.',
  },
  {
    name: 'Aisha Okafor',
    title: 'Cannabis Brand Strategist',
    expertise_areas: [
      'brand positioning',
      'marketing strategy',
      'product differentiation',
      'consumer messaging',
      'competitive analysis',
    ],
    perspective_bias: 'growth-oriented',
    argumentation_style:
      'Creative and market-driven. Frames arguments around brand equity and consumer perception. ' +
      'Advocates bold positioning and challenges commoditization thinking.',
  },
  {
    name: 'David Kowalski',
    title: 'Supply Chain Analyst',
    expertise_areas: [
      'logistics optimization',
      'pricing strategy',
      'distribution networks',
      'vendor management',
      'cost reduction',
    ],
    perspective_bias: 'efficiency-focused',
    argumentation_style:
      'Data-driven and systematic. Argues from unit economics and throughput metrics. ' +
      'Skeptical of strategies that ignore supply chain constraints.',
  },
  {
    name: 'Jennifer Park',
    title: 'Cannabis Finance Expert',
    expertise_areas: [
      'margin analysis',
      'fundraising',
      'market valuation',
      'unit economics',
      'financial modeling',
    ],
    perspective_bias: 'ROI-driven',
    argumentation_style:
      'Numbers-first and outcome-oriented. Frames every argument in terms of financial impact. ' +
      'Challenges strategies that lack clear path to profitability.',
  },
  {
    name: 'Thomas Rivera',
    title: 'Regulatory Policy Analyst',
    expertise_areas: [
      'OCM regulations',
      'licensing trends',
      'policy advocacy',
      'interstate commerce',
      'social equity programs',
    ],
    perspective_bias: 'policy-aware',
    argumentation_style:
      'Analytical and forward-looking. Argues from regulatory trajectory and policy signals. ' +
      'Warns about upcoming changes and identifies regulatory arbitrage opportunities.',
  },
  {
    name: 'Samantha Wright',
    title: 'Consumer Behavior Researcher',
    expertise_areas: [
      'purchase patterns',
      'demographic analysis',
      'consumer preferences',
      'market segmentation',
      'trend forecasting',
    ],
    perspective_bias: 'consumer-centric',
    argumentation_style:
      'Evidence-based and empathetic. Grounds arguments in consumer research and behavioral data. ' +
      'Challenges insider assumptions with actual consumer sentiment.',
  },
] as const;

/**
 * Select a panel of experts from the template pool.
 *
 * When count <= templates length, selects a diverse subset.
 * When count > templates length, cycles through templates with variant numbering.
 *
 * Returns a new array (no mutation of the template list).
 */
export function generateExperts(
  count: number,
  templates: readonly ExpertProfile[] = EXPERT_TEMPLATES,
): readonly ExpertProfile[] {
  const clampedCount = Math.max(1, Math.min(count, 10));

  if (clampedCount <= templates.length) {
    // Deterministic spread: pick evenly spaced experts to maximize perspective diversity
    const step = templates.length / clampedCount;
    return Array.from({ length: clampedCount }, (_, i) => {
      const idx = Math.floor(i * step);
      return templates[idx];
    });
  }

  // More experts requested than templates: cycle with variant numbering
  return Array.from({ length: clampedCount }, (_, i) => {
    const base = templates[i % templates.length];
    if (i < templates.length) return base;
    const variant = Math.floor(i / templates.length) + 1;
    return {
      ...base,
      name: `${base.name} (Variant ${variant})`,
    };
  });
}

export { EXPERT_TEMPLATES };
