/**
 * CrowdTest persona templates for the cannabis industry.
 *
 * Each template defines a role archetype with realistic attributes.
 * The generatePersonas function creates diverse, individualized personas
 * from these templates with randomized demographic variation.
 */

export interface PersonaTemplate {
  readonly role: string;
  readonly age_range: readonly [number, number];
  readonly concerns: readonly string[];
  readonly values: readonly string[];
  readonly decision_style: string;
}

export interface GeneratedPersona {
  readonly id: number;
  readonly name: string;
  readonly role: string;
  readonly age: number;
  readonly concerns: readonly string[];
  readonly values: readonly string[];
  readonly decision_style: string;
  readonly background: string;
}

/* -- Pre-built persona templates ----------------------------------------- */

export const DISPENSARY_OWNER: PersonaTemplate = {
  role: 'Dispensary Owner',
  age_range: [30, 60],
  concerns: [
    'profit margins',
    'product turnover rate',
    'supplier reliability',
    'regulatory compliance',
    'brand reputation',
    'inventory management',
    'customer retention',
    'competitive pricing',
  ],
  values: [
    'business growth',
    'community trust',
    'quality products',
    'operational efficiency',
    'long-term partnerships',
  ],
  decision_style: 'Analytical and margin-conscious. Evaluates ROI before committing. Wants data on sell-through rates and customer demand.',
};

export const DISPENSARY_BUDTENDER: PersonaTemplate = {
  role: 'Dispensary Budtender',
  age_range: [21, 40],
  concerns: [
    'product knowledge',
    'customer experience',
    'ease of recommendation',
    'product variety',
    'terpene profiles',
    'potency accuracy',
    'packaging appeal',
    'new product training',
  ],
  values: [
    'customer education',
    'product quality',
    'honest recommendations',
    'approachable branding',
    'staff training resources',
  ],
  decision_style: 'Experience-driven. Recommends what they personally trust. Values products they can confidently explain to customers.',
};

export const CANNABIS_CONSUMER: PersonaTemplate = {
  role: 'Cannabis Consumer',
  age_range: [21, 65],
  concerns: [
    'product quality',
    'price value',
    'consistency',
    'lab testing transparency',
    'flavor and effects',
    'packaging discretion',
    'brand trustworthiness',
    'availability at local dispensary',
  ],
  values: [
    'quality over quantity',
    'safety and testing',
    'brand authenticity',
    'fair pricing',
    'reliable effects',
  ],
  decision_style: 'Emotional and experiential. Loyal to brands that deliver consistent quality. Influenced by budtender recommendations and peer reviews.',
};

export const CANNABIS_BRAND_OWNER: PersonaTemplate = {
  role: 'Cannabis Brand Owner',
  age_range: [28, 55],
  concerns: [
    'distribution reach',
    'brand positioning',
    'wholesale pricing pressure',
    'market differentiation',
    'shelf space competition',
    'retailer relationships',
    'marketing restrictions',
    'supply chain reliability',
  ],
  values: [
    'brand integrity',
    'market expansion',
    'product innovation',
    'strategic partnerships',
    'premium positioning',
  ],
  decision_style: 'Strategic and competitive. Evaluates opportunities through market positioning lens. Concerned with brand perception at retail level.',
};

export const COMPLIANCE_OFFICER: PersonaTemplate = {
  role: 'Compliance Officer',
  age_range: [30, 55],
  concerns: [
    'regulatory adherence',
    'labeling accuracy',
    'testing requirements',
    'packaging regulations',
    'marketing claim legality',
    'track and trace compliance',
    'advertising restrictions',
    'age verification',
  ],
  values: [
    'legal compliance',
    'consumer safety',
    'transparent operations',
    'documentation rigor',
    'risk mitigation',
  ],
  decision_style: 'Risk-averse and detail-oriented. Flags potential compliance issues immediately. Prioritizes legal safety over marketing appeal.',
};

export const INDUSTRY_INVESTOR: PersonaTemplate = {
  role: 'Cannabis Industry Investor',
  age_range: [35, 65],
  concerns: [
    'market size and growth',
    'regulatory environment stability',
    'competitive moat',
    'unit economics',
    'scalability',
    'management team quality',
    'path to profitability',
    'multi-state expansion potential',
  ],
  values: [
    'return on investment',
    'market opportunity',
    'operational excellence',
    'regulatory compliance',
    'sustainable growth',
  ],
  decision_style: 'Data-driven and forward-looking. Evaluates through financial viability and market opportunity lens. Skeptical of hype, wants fundamentals.',
};

export const ALL_TEMPLATES: readonly PersonaTemplate[] = [
  DISPENSARY_OWNER,
  DISPENSARY_BUDTENDER,
  CANNABIS_CONSUMER,
  CANNABIS_BRAND_OWNER,
  COMPLIANCE_OFFICER,
  INDUSTRY_INVESTOR,
];

/* -- First name pools for persona generation ----------------------------- */

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Reese', 'Dakota', 'Skyler', 'Emery', 'Phoenix', 'Sage', 'River', 'Drew',
  'Blake', 'Hayden', 'Rowan', 'Cameron', 'Jamie', 'Finley', 'Harley', 'Parker',
  'Devon', 'Kendall', 'Logan', 'Payton', 'Charlie', 'Spencer', 'Ellis', 'Tatum',
  'Micah', 'Remy', 'Cruz', 'Lennox', 'Milan', 'Kai', 'Nico', 'Shea',
  'Adrian', 'Zion', 'Ariel', 'Oakley', 'Marley', 'Sutton', 'Dallas', 'Monroe',
  'Linden', 'Wren',
] as const;

const LAST_INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/* -- Pseudo-random seeded generator (deterministic for same count) ------- */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/* -- Background generators per role -------------------------------------- */

const BACKGROUNDS: Record<string, readonly string[]> = {
  'Dispensary Owner': [
    'Owns a single dispensary in a competitive urban market.',
    'Runs a multi-location dispensary chain in suburban areas.',
    'Recently opened their first dispensary after years in another industry.',
    'Veteran dispensary operator with 3+ years in the NY market.',
    'Transitioning from legacy market to licensed operations.',
  ],
  'Dispensary Budtender': [
    'Two years of budtending experience, cannabis enthusiast.',
    'Former retail associate who transitioned to cannabis.',
    'Certified cannabis educator with deep product knowledge.',
    'Part-time budtender and full-time student.',
    'Senior budtender who trains new staff on product lines.',
  ],
  'Cannabis Consumer': [
    'Medical patient who relies on cannabis for chronic pain management.',
    'Recreational user who prefers edibles and concentrates.',
    'New to cannabis, still exploring different products and formats.',
    'Long-time flower consumer interested in premium brands.',
    'Wellness-focused consumer who values organic and clean products.',
  ],
  'Cannabis Brand Owner': [
    'Founded a craft cannabis brand focused on small-batch quality.',
    'Runs an established brand looking to expand into New York.',
    'Former tech entrepreneur who pivoted into cannabis branding.',
    'Multi-state operator evaluating New York distribution partners.',
    'Boutique edibles brand with a loyal following in adjacent states.',
  ],
  'Compliance Officer': [
    'Former state regulator now consulting for cannabis companies.',
    'In-house compliance lead for a multi-location dispensary group.',
    'Legal background with specialization in cannabis regulatory law.',
    'Compliance manager ensuring packaging and labeling standards.',
    'Risk management professional new to the cannabis sector.',
  ],
  'Cannabis Industry Investor': [
    'Angel investor with a portfolio of cannabis startups.',
    'Private equity professional evaluating cannabis fund opportunities.',
    'Former Wall Street analyst covering cannabis as an emerging sector.',
    'Family office representative exploring cannabis distribution plays.',
    'Venture capitalist focused on cannabis technology and infrastructure.',
  ],
};

/**
 * Generate a diverse set of individualized personas from the provided
 * templates. Distributes personas evenly across templates, then fills
 * remaining slots round-robin.
 */
export function generatePersonas(
  count: number,
  templates: readonly PersonaTemplate[] = ALL_TEMPLATES,
): readonly GeneratedPersona[] {
  if (count <= 0 || templates.length === 0) return [];

  const rand = seededRandom(count * 7919 + templates.length);
  const personas: GeneratedPersona[] = [];
  const basePerTemplate = Math.floor(count / templates.length);
  const remainder = count % templates.length;

  // Build allocation: how many personas per template
  const allocation: number[] = templates.map((_, i) =>
    basePerTemplate + (i < remainder ? 1 : 0),
  );

  let globalId = 1;

  for (let tIdx = 0; tIdx < templates.length; tIdx++) {
    const template = templates[tIdx];
    const allocated = allocation[tIdx];
    const backgrounds = BACKGROUNDS[template.role] ?? ['Industry professional.'];

    for (let j = 0; j < allocated; j++) {
      const age = template.age_range[0] +
        Math.floor(rand() * (template.age_range[1] - template.age_range[0] + 1));

      const nameIdx = Math.floor(rand() * FIRST_NAMES.length);
      const lastIdx = Math.floor(rand() * LAST_INITIALS.length);
      const name = `${FIRST_NAMES[nameIdx]} ${LAST_INITIALS[lastIdx]}.`;

      // Select a subset of concerns (3-5) and values (2-4) for variety
      const concernCount = 3 + Math.floor(rand() * 3);
      const valueCount = 2 + Math.floor(rand() * 3);
      const concerns = shuffleAndTake(template.concerns, concernCount, rand);
      const values = shuffleAndTake(template.values, valueCount, rand);

      const bgIdx = Math.floor(rand() * backgrounds.length);

      personas.push({
        id: globalId++,
        name,
        role: template.role,
        age,
        concerns,
        values,
        decision_style: template.decision_style,
        background: backgrounds[bgIdx],
      });
    }
  }

  return personas;
}

/* -- Utility: shuffle-and-take without mutation -------------------------- */

function shuffleAndTake<T>(
  items: readonly T[],
  count: number,
  rand: () => number,
): readonly T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr.slice(0, Math.min(count, arr.length));
}
