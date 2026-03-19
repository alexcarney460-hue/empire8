export type Product = {
  id: number;
  slug: string;
  category: 'Gloves' | 'Trimmers' | 'Accessories';
  name: string;
  shortName: string;
  tagline: string;
  price: number;         // retail price per case/unit (display default)
  unit: string;          // e.g. "/ case" or "/ box"
  badge: string | null;
  img: string;
  images: string[];      // all images for gallery
  specs: { label: string; value: string }[];
  description: string;
  features: string[];
  useCases: string[];
  inStock: boolean;
  relatedSlugs: string[];

  // Case/box pricing (gloves only)
  boxPrice?: number;          // price per individual box (100 gloves)
  casePrice?: number;         // price per case at retail tier (1-29 cases)
  caseBoxCount?: number;      // boxes per case (default 10)
  caseGloveCount?: number;    // gloves per case (default 1000)
  wholesalePrice?: number;    // price per case at wholesale tier (30-119 cases)
  distributorPrice?: number;  // price per case at distributor tier (120+ cases)
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: 'nitrile-5mil-box',
    category: 'Gloves',
    name: '5 mil Nitrile Disposable Gloves — Box',
    shortName: 'Nitrile Gloves (Box)',
    tagline: 'Premium 5 mil nitrile. 100 gloves per box. Perfect for daily use.',
    price: 10.00,
    unit: '/ box',
    badge: null,
    img: '/products/product-5.avif',
    images: ['/products/product-5.avif'],
    specs: [
      { label: 'Material', value: 'Nitrile' },
      { label: 'Thickness', value: '5 mil' },
      { label: 'Color', value: 'Blue' },
      { label: 'Powder', value: 'Powder-Free' },
      { label: 'Sizes', value: 'S, M, L, XL, XXL' },
      { label: 'Count', value: '100 gloves / box' },
      { label: 'Certification', value: 'ASTM D6319 (Industrial)' },
      { label: 'AQL', value: '1.5' },
    ],
    description:
      'Our 5 mil nitrile disposable glove — sold by the box. 100 gloves per box. Powder-free and latex-free for allergy-safe applications. Strong enough for daily industrial use, comfortable enough to wear all day. Ideal for individual purchase or small operations.',
    features: [
      'Powder-free — no residue contamination risk',
      'Latex-free — safe for latex-sensitive workers',
      'Textured fingertips for improved grip',
      'Beaded cuff for easy donning',
      'Ambidextrous fit — works on both hands',
      'Chemical and puncture resistant',
    ],
    useCases: [
      'Cannabis cultivation & trimming',
      'Food handling & food service',
      'Janitorial & sanitation',
      'General manufacturing',
      'Auto mechanics & detailing',
    ],
    inStock: true,
    relatedSlugs: ['nitrile-5mil-case', 'spring-loaded-trimming-scissors'],
    boxPrice: 10.00,
  },
  {
    id: 2,
    slug: 'nitrile-5mil-case',
    category: 'Gloves',
    name: '5 mil Nitrile Disposable Gloves — Case',
    shortName: 'Nitrile Gloves (Case)',
    tagline: 'Save 20% buying by the case. 10 boxes, 1,000 gloves total.',
    price: 80.00,
    unit: '/ case',
    badge: 'Best Value',
    img: '/products/product-3.avif',
    images: ['/products/product-3.avif'],
    specs: [
      { label: 'Material', value: 'Nitrile' },
      { label: 'Thickness', value: '5 mil' },
      { label: 'Color', value: 'Blue' },
      { label: 'Powder', value: 'Powder-Free' },
      { label: 'Sizes', value: 'S, M, L, XL, XXL' },
      { label: 'Count', value: '10 boxes / case (1,000 gloves)' },
      { label: 'Price Per Box', value: '$8.00 (save $2/box vs individual)' },
      { label: 'Certification', value: 'ASTM D6319 (Industrial)' },
      { label: 'AQL', value: '1.5' },
    ],
    description:
      'The same premium 5 mil nitrile glove — sold by the case. 10 boxes per case, 1,000 gloves total. At $8.00 per box you save $2.00 per box compared to buying individually. Volume discounts available for wholesale (30+ cases) and distributor (120+ cases) orders.',
    features: [
      '10 boxes per case — 1,000 gloves total',
      '$8.00/box — save $2.00 vs individual box price',
      'Same 5 mil nitrile spec as individual boxes',
      'Powder-free and latex-free',
      'Volume discounts: 30+ cases wholesale, 120+ distributor',
      'Textured fingertips, beaded cuff, ambidextrous',
    ],
    useCases: [
      'Cannabis cultivation & trimming',
      'Food handling & food service',
      'Janitorial & sanitation',
      'General manufacturing',
      'Auto mechanics & detailing',
    ],
    inStock: true,
    relatedSlugs: ['nitrile-5mil-box', 'spring-loaded-trimming-scissors'],
    boxPrice: 8.00,
    casePrice: 80.00,
    caseBoxCount: 10,
    caseGloveCount: 1000,
    wholesalePrice: 70.00,
    distributorPrice: 60.00,
  },
  {
    id: 3,
    slug: 'spring-loaded-trimming-scissors',
    category: 'Trimmers',
    name: 'Spring-Loaded Trimming Scissors',
    shortName: 'Trimming Scissors',
    tagline: 'Ergonomic spring-loaded scissors built for long trim sessions.',
    price: 14.00,
    unit: '/ pair',
    badge: null,
    img: '/products/product-1.avif',
    images: ['/products/product-1.avif'],
    specs: [
      { label: 'Type', value: 'Spring-Loaded Scissors' },
      { label: 'Blade', value: 'Stainless Steel — Curved Tip' },
      { label: 'Length', value: '6.5 inches' },
      { label: 'Spring', value: 'Integrated spring-loaded handle' },
      { label: 'Grip', value: 'Soft-touch ergonomic' },
      { label: 'Use', value: 'Cannabis trimming, detail work' },
    ],
    description:
      'Our spring-loaded trimming scissors are designed for cannabis harvest operations. Curved stainless steel blades with a soft-touch ergonomic grip reduce hand fatigue during long trim sessions. Spring-loaded mechanism means less effort per cut — your crew stays productive all day.',
    features: [
      'Spring-loaded mechanism reduces hand fatigue',
      'Curved stainless steel blades for precision trimming',
      'Soft-touch ergonomic grip',
      'Easy to clean — resin-resistant coating',
      'Lightweight and balanced',
      'Ideal for both wet and dry trimming',
    ],
    useCases: [
      'Cannabis trimming — wet and dry',
      'Detail trimming and manicuring',
      'Small to mid-size harvest operations',
      'Craft cultivator finishing work',
    ],
    inStock: true,
    relatedSlugs: ['straight-tip-trimming-scissors', 'nitrile-5mil-case'],
  },
  {
    id: 4,
    slug: 'straight-tip-trimming-scissors',
    category: 'Trimmers',
    name: 'Straight Tip Trimming Scissors',
    shortName: 'Straight Scissors',
    tagline: 'Classic straight-tip trimmers for fast, clean cuts.',
    price: 12.00,
    unit: '/ pair',
    badge: null,
    img: '/products/product-2.avif',
    images: ['/products/product-2.avif'],
    specs: [
      { label: 'Type', value: 'Straight Tip Scissors' },
      { label: 'Blade', value: 'Stainless Steel — Straight Tip' },
      { label: 'Length', value: '6 inches' },
      { label: 'Grip', value: 'Comfort-fit handles' },
      { label: 'Use', value: 'Cannabis trimming, general harvest' },
    ],
    description:
      'Our straight tip trimming scissors are the workhorse of any trim room. Stainless steel blades hold their edge through heavy daily use. Comfort-fit handles keep your crew moving through large harvests without slowing down.',
    features: [
      'Straight stainless steel blades for clean cuts',
      'Durable edge retention for heavy daily use',
      'Comfort-fit handles',
      'Easy to sharpen and maintain',
      'Lightweight design',
      'Suitable for both wet and dry trimming',
    ],
    useCases: [
      'Cannabis trimming — wet and dry',
      'High-volume harvest operations',
      'Processing facility trim lines',
      'General-purpose garden trimming',
    ],
    inStock: true,
    relatedSlugs: ['spring-loaded-trimming-scissors', 'nitrile-5mil-case'],
  },
  {
    id: 5,
    slug: 'trim-tray-150-micron',
    category: 'Accessories',
    name: 'Trim Tray with 150 Micron Screen',
    shortName: 'Trim Tray',
    tagline: 'Collect kief while you trim. 150 micron stainless screen.',
    price: 28.00,
    unit: '/ each',
    badge: null,
    img: '/products/product-4.avif',
    images: ['/products/product-4.avif'],
    specs: [
      { label: 'Type', value: 'Trim Tray with Kief Screen' },
      { label: 'Screen', value: '150 Micron Stainless Steel' },
      { label: 'Dimensions', value: '16 x 12 x 3 inches' },
      { label: 'Material', value: 'BPA-Free Plastic + Stainless Mesh' },
      { label: 'Use', value: 'Trimming, kief collection' },
    ],
    description:
      'Our trim tray lets your crew collect kief while trimming — no product wasted. The 150 micron stainless steel screen separates trichomes as you work. Sturdy BPA-free construction holds up to daily use in commercial trim rooms.',
    features: [
      '150 micron stainless steel kief screen',
      'BPA-free food-safe plastic tray',
      'Collect trichomes passively while trimming',
      'Easy to clean — screen pops out',
      'Stackable design for storage',
      'Sized for comfortable lap or table use',
    ],
    useCases: [
      'Cannabis trimming stations',
      'Kief collection during harvest',
      'Trim room workstations',
      'Craft cultivator processing',
    ],
    inStock: true,
    relatedSlugs: ['spring-loaded-trimming-scissors', 'nitrile-5mil-case'],
  },
  {
    id: 6,
    slug: 'iso-spray-bottle-16oz',
    category: 'Accessories',
    name: 'Cleaning Spray Bottle — 16 oz',
    shortName: 'Spray Bottle',
    tagline: 'Chemical-resistant spray bottle for cleaning scissors and trays.',
    price: 6.00,
    unit: '/ each',
    badge: null,
    img: '/products/product-6.avif',
    images: ['/products/product-6.avif'],
    specs: [
      { label: 'Type', value: 'Chemical-Resistant Spray Bottle' },
      { label: 'Capacity', value: '16 oz (473 ml)' },
      { label: 'Material', value: 'HDPE Plastic — Solvent Safe' },
      { label: 'Nozzle', value: 'Adjustable mist-to-stream' },
      { label: 'Use', value: 'Cleaning scissors, trays, surfaces' },
    ],
    description:
      'Keep your trim tools clean with our chemical-resistant 16 oz spray bottle. HDPE plastic is safe for isopropyl alcohol and other common cleaning solvents. Adjustable nozzle goes from fine mist to direct stream. Essential for keeping scissors resin-free and trim stations sanitary.',
    features: [
      'HDPE plastic — safe for isopropyl alcohol',
      'Adjustable mist-to-stream nozzle',
      '16 oz capacity',
      'Leak-proof seal',
      'Easy to fill and label',
      'Durable trigger mechanism',
    ],
    useCases: [
      'Cleaning trimming scissors',
      'Sanitizing trim trays and surfaces',
      'General facility cleaning',
      'Tool maintenance during harvest',
    ],
    inStock: true,
    relatedSlugs: ['spring-loaded-trimming-scissors', 'trim-tray-150-micron'],
  },
];

export default PRODUCTS;

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(slugs: string[]): Product[] {
  return slugs
    .map((s) => PRODUCTS.find((p) => p.slug === s))
    .filter(Boolean) as Product[];
}

export function getProductsByCategory(category: Product['category']): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

/** Returns true if a product supports case/box purchasing (gloves only). */
export function hasCasePricing(product: Product): boolean {
  return product.casePrice != null && product.boxPrice != null;
}

/** Get the per-case price based on total case quantity in the order. */
export function getCasePriceForQuantity(product: Product, caseQty: number): number {
  if (caseQty >= 120) return product.distributorPrice ?? product.casePrice ?? product.price;
  if (caseQty >= 30) return product.wholesalePrice ?? product.casePrice ?? product.price;
  return product.casePrice ?? product.price;
}

/** Get the tier name based on total case quantity. */
export function getTierName(caseQty: number): 'Retail' | 'Wholesale' | 'Distributor' {
  if (caseQty >= 120) return 'Distributor';
  if (caseQty >= 30) return 'Wholesale';
  return 'Retail';
}

/** Get how many more cases needed to reach the next tier, or null if at highest. */
export function casesToNextTier(caseQty: number): { needed: number; tierName: string; tierPrice?: number } | null {
  if (caseQty >= 120) return null; // already at highest tier
  if (caseQty >= 30) return { needed: 120 - caseQty, tierName: 'Distributor' };
  return { needed: 30 - caseQty, tierName: 'Wholesale' };
}
