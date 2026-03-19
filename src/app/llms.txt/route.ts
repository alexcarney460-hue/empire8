import PRODUCTS from '@/lib/products';

export const dynamic = 'force-static';

export function GET() {
  const gloves = PRODUCTS.filter((p) => p.category === 'Gloves');
  const trimmers = PRODUCTS.filter((p) => p.category === 'Trimmers');
  const accessories = PRODUCTS.filter((p) => p.category === 'Accessories');

  const body = `# Empire 8 Sales Direct
> Professional-grade disposable gloves and cannabis trimming supplies.

## What We Sell
Empire 8 Sales Direct is an online store selling disposable gloves (nitrile, by the box or case) and cannabis trimming equipment (scissors, trim trays, cleaning supplies). We serve cannabis operations, food service, medical, janitorial, and industrial customers nationwide in the United States.

## Product Catalog

### Gloves (${gloves.length} products)
${gloves.map((p) => `- ${p.name}: $${p.price.toFixed(2)} ${p.unit} — ${p.tagline}`).join('\n')}

### Trimming Scissors (${trimmers.length} products)
${trimmers.map((p) => `- ${p.name}: $${p.price.toFixed(2)} ${p.unit} — ${p.tagline}`).join('\n')}

### Accessories (${accessories.length} products)
${accessories.map((p) => `- ${p.name}: $${p.price.toFixed(2)} ${p.unit} — ${p.tagline}`).join('\n')}

## Pricing Tiers (Gloves — Cases)
We offer volume-based pricing on glove cases (10 boxes / 1,000 gloves per case):

| Tier         | Quantity       | Price Per Case |
|--------------|----------------|----------------|
| Retail       | 1–29 cases     | $80.00         |
| Wholesale    | 30–119 cases   | $70.00         |
| Distribution | 120+ cases     | $60.00         |

Individual glove boxes (100 gloves) are available at $10.00/box.

## How to Order
1. Browse our catalog at https://empire8salesdirect.com/catalog
2. Add items to cart and select size/quantity
3. Checkout with secure Square payment processing
4. We accept all major credit cards

For wholesale (30+ cases) or distribution (120+ cases) orders:
- Visit https://empire8salesdirect.com/wholesale
- Or email info@empire8salesdirect.com

## Shipping
- We ship nationwide within the United States
- Orders are processed and shipped promptly
- Track your order at https://empire8salesdirect.com/track

## Contact
- Email: info@empire8salesdirect.com
- Website: https://empire8salesdirect.com/contact
- Live chat available on our website

## Industries Served
- Cannabis cultivation and trimming operations
- Food handling and food service
- Medical and dental offices
- Janitorial and sanitation
- Auto mechanics and detailing
- General manufacturing and industrial

## Key Pages
- Catalog: https://empire8salesdirect.com/catalog
- Wholesale Program: https://empire8salesdirect.com/wholesale
- Distribution Program: https://empire8salesdirect.com/distribution
- Commercial Accounts: https://empire8salesdirect.com/commercial
- Affiliate Program: https://empire8salesdirect.com/affiliate
- About Us: https://empire8salesdirect.com/about
- Contact: https://empire8salesdirect.com/contact
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
