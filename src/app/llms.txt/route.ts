export const dynamic = 'force-static';

export function GET() {
  const body = `# Empire 8 Sales Direct
> Licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties.

## What We Do
Empire 8 Sales Direct is a B2B cannabis wholesale platform connecting NY-licensed brands with dispensaries. We offer wholesale ordering, anonymous marketplace auctions (Weedbay), white label manufacturing, and brand distribution services.

## Key Pages
- /brands — Browse our curated portfolio of NY-licensed cannabis brands
- /marketplace — Weedbay: anonymous large-lot cannabis auctions
- /dispensary-signup — Licensed dispensaries can apply for wholesale access
- /whitelabel — White label cannabis product manufacturing
- /about — Company mission and NY coverage map
- /compliance — NYS OCM compliance information
- /locations — Delivery zones covering all 62 NY counties
- /catalog — Full product catalog with wholesale pricing
- /contact — Get in touch with our sales team

## Products & Categories
Flower, Concentrates, Vapes/Cartridges, Pre-Rolls, Edibles, Beverages, Tinctures, Capsules

## Services
- **Wholesale Ordering**: Competitive B2B pricing for licensed dispensaries
- **Weedbay Marketplace**: Anonymous large-lot auctions for surplus inventory
- **White Label Manufacturing**: Custom cannabis products under your brand
- **Brand Distribution**: Get your licensed brand into NY dispensaries
- **Compliance Support**: Full NYS OCM regulatory compliance on every shipment
- **Dedicated Account Management**: Personal rep for every dispensary partner

## Coverage
All 62 New York counties organized into 7 delivery zones:
- Zone 1: Long Island (Nassau, Suffolk)
- Zone 2: Metro NYC (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- Zone 3: Hudson Valley (Westchester, Rockland, Orange, Dutchess, Ulster, Sullivan)
- Zone 4: Capital Region (Albany, Schenectady, Rensselaer, Saratoga)
- Zone 5: North Country (Clinton, Essex, Franklin, Jefferson, St. Lawrence)
- Zone 6: Central NY (Syracuse, Utica, Binghamton, Oneida)
- Zone 7: Western Tier (Buffalo, Rochester, Niagara, Erie)

## Pricing Tiers
| Tier          | Description                                        |
|---------------|----------------------------------------------------|
| Starter       | New dispensary accounts, competitive wholesale      |
| Wholesale     | Volume ordering, deeper discounts, priority fill    |
| Distribution  | High-volume partners, best pricing, NET 30 terms   |

## Licensing
NYS OCM Licensed Distributor.
All products are lab-tested and NYS compliant.
For use only by adults 21 years of age and older.

## How to Order
1. Apply at https://empire8ny.com/dispensary-signup
2. Get approved and assigned a dedicated account manager
3. Browse the catalog or join Weedbay marketplace auctions
4. Receive temperature-controlled delivery within the week

## Contact
- Email: info@empire8ny.com
- Sales: sales@empire8ny.com
- Website: https://empire8ny.com
- Live chat available on our website
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
