import { Shippo } from 'shippo';

const apiKey = process.env.SHIPPO_API_KEY?.trim();

export const shippoClient = apiKey
  ? new Shippo({ apiKeyHeader: apiKey })
  : null;

/** Empire 8 Sales Direct warehouse address */
export const WAREHOUSE_ADDRESS = {
  name: 'Empire 8 Sales Direct',
  company: 'Empire 8 Sales Direct',
  street1: '1401 N Clovis Ave',
  street2: 'STE #103',
  city: 'Clovis',
  state: 'CA',
  zip: '93727',
  country: 'US',
  email: 'info@empire8salesdirect.com',
  phone: '5592974700',
} as const;

export type ShippoAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email?: string;
  phone?: string;
};

export type ShippoRate = {
  objectId: string;
  provider: string;
  servicelevel: string;
  amount: string;
  currency: string;
  estimatedDays: number | null;
  durationTerms: string;
};

type ParcelSpec = {
  weight: string;
  massUnit: 'lb';
} & (
  | { length: string; width: string; height: string; distanceUnit: 'in'; template?: undefined }
  | { template: string; length?: undefined; width?: undefined; height?: undefined; distanceUnit?: undefined }
);

/**
 * Build parcel strategies to try for a given weight.
 * Returns multiple options — single package with dimensions,
 * USPS flat rate templates, and multi-parcel splits — so we can
 * compare rates across all of them and pick the cheapest.
 */
function buildParcelStrategies(weightLbs: number): ParcelSpec[][] {
  const strategies: ParcelSpec[][] = [];

  // Strategy 1: Single parcel with minimal realistic dimensions
  // Use small dims to avoid dimensional weight surcharges
  const singleWithDims: ParcelSpec = {
    weight: String(weightLbs),
    massUnit: 'lb',
    length: '16',
    width: '12',
    height: String(Math.max(4, Math.ceil(weightLbs / 3))),
    distanceUnit: 'in',
  };
  strategies.push([singleWithDims]);

  // Strategy 2: USPS flat rate templates (if weight qualifies)
  if (weightLbs <= 70) {
    if (weightLbs <= 20) {
      strategies.push([{ weight: String(weightLbs), massUnit: 'lb', template: 'USPS_MediumFlatRateBox1' }]);
    }
    if (weightLbs <= 30) {
      strategies.push([{ weight: String(weightLbs), massUnit: 'lb', template: 'USPS_LargeFlatRateBox' }]);
    }
  }

  // Strategy 3: Split into 2 parcels (for orders > 20 lbs)
  if (weightLbs > 20) {
    const half = Math.ceil(weightLbs / 2);
    const remainder = weightLbs - half;
    strategies.push([
      { weight: String(half), massUnit: 'lb', length: '14', width: '12', height: '8', distanceUnit: 'in' },
      { weight: String(remainder), massUnit: 'lb', length: '14', width: '12', height: '8', distanceUnit: 'in' },
    ]);
  }

  // Strategy 4: Split into 3 parcels (for orders > 40 lbs)
  if (weightLbs > 40) {
    const third = Math.ceil(weightLbs / 3);
    const rem = weightLbs - third * 2;
    strategies.push([
      { weight: String(third), massUnit: 'lb', length: '14', width: '12', height: '8', distanceUnit: 'in' },
      { weight: String(third), massUnit: 'lb', length: '14', width: '12', height: '8', distanceUnit: 'in' },
      { weight: String(Math.max(1, rem)), massUnit: 'lb', length: '14', width: '12', height: '8', distanceUnit: 'in' },
    ]);
  }

  return strategies;
}

/**
 * Create a Shippo shipment with given parcels and return rates.
 */
async function createShipmentWithParcels(
  addressTo: ShippoAddress,
  parcels: ParcelSpec[],
): Promise<{ shipmentId: string; rates: ShippoRate[] } | null> {
  if (!shippoClient) return null;

  const shipment = await shippoClient.shipments.create({
    addressFrom: { ...WAREHOUSE_ADDRESS },
    addressTo: {
      name: addressTo.name,
      street1: addressTo.street1,
      street2: addressTo.street2 || '',
      city: addressTo.city,
      state: addressTo.state,
      zip: addressTo.zip,
      country: addressTo.country || 'US',
      email: addressTo.email || '',
      phone: addressTo.phone || '',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parcels: parcels.map((p): any => {
      if (p.template) {
        return { weight: p.weight, massUnit: 'lb', template: p.template };
      }
      return {
        weight: p.weight,
        massUnit: 'lb',
        length: p.length,
        width: p.width,
        height: p.height,
        distanceUnit: 'in',
      };
    }),
  });

  const rates: ShippoRate[] = (shipment.rates ?? []).map((r) => ({
    objectId: r.objectId ?? '',
    provider: r.provider ?? '',
    servicelevel: r.servicelevel?.name ?? '',
    amount: r.amount ?? '0',
    currency: r.currency ?? 'USD',
    estimatedDays: r.estimatedDays ?? null,
    durationTerms: r.durationTerms ?? '',
  }));

  rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

  return { shipmentId: shipment.objectId ?? '', rates };
}

/**
 * Create a shipment trying a single parcel strategy (backward compat).
 */
export async function createShipment(
  addressTo: ShippoAddress,
  weightLbs: number,
): Promise<{ shipmentId: string; rates: ShippoRate[] } | null> {
  const strategies = buildParcelStrategies(weightLbs);
  return createShipmentWithParcels(addressTo, strategies[0]);
}

/**
 * Purchase a shipping label for a given rate ID.
 */
export async function purchaseLabel(rateId: string): Promise<{
  transactionId: string;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  eta: string | null;
} | null> {
  if (!shippoClient) return null;

  const transaction = await shippoClient.transactions.create({
    rate: rateId,
    labelFileType: 'PDF_4x6',
    async: false,
  });

  if (transaction.status !== 'SUCCESS') {
    const msgs = transaction.messages?.map((m) => m.text).join('; ') ?? 'Unknown error';
    throw new Error(`Label purchase failed: ${msgs}`);
  }

  return {
    transactionId: transaction.objectId ?? '',
    trackingNumber: transaction.trackingNumber ?? '',
    trackingUrl: transaction.trackingUrlProvider ?? '',
    labelUrl: transaction.labelUrl ?? '',
    eta: transaction.eta ?? null,
  };
}

/**
 * Auto-ship: try multiple parcel strategies, pick the absolute cheapest
 * rate across all of them, buy the label.
 */
export async function autoShipOrder(
  addressTo: ShippoAddress,
  weightLbs: number,
): Promise<{
  shipmentId: string;
  transactionId: string;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  carrier: string;
  service: string;
  rate: string;
  eta: string | null;
} | null> {
  if (!shippoClient) return null;

  const strategies = buildParcelStrategies(weightLbs);

  // Fire all strategies in parallel
  const results = await Promise.allSettled(
    strategies.map((parcels) => createShipmentWithParcels(addressTo, parcels)),
  );

  // Collect all rates across all successful strategies
  type RateCandidate = { shipmentId: string; rate: ShippoRate };
  const candidates: RateCandidate[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value && result.value.rates.length > 0) {
      const { shipmentId, rates } = result.value;
      for (const rate of rates) {
        candidates.push({ shipmentId, rate });
      }
    }
  }

  if (candidates.length === 0) {
    // Log the failures for debugging
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[Shippo] Strategy failed:', result.reason instanceof Error ? result.reason.message : result.reason);
      }
    }
    console.error('[Shippo] No rates from any strategy for', weightLbs, 'lbs to', addressTo.zip);
    return null;
  }

  // Sort all candidates by price (cheapest first)
  candidates.sort((a, b) => parseFloat(a.rate.amount) - parseFloat(b.rate.amount));

  console.log(
    `[Shippo] ${candidates.length} rates found across ${strategies.length} strategies. ` +
    `Cheapest: $${candidates[0].rate.amount} via ${candidates[0].rate.provider} ${candidates[0].rate.servicelevel}`,
  );

  // Try each rate in order — if the cheapest fails (e.g., carrier not activated),
  // fall back to the next cheapest until one succeeds.
  for (const candidate of candidates) {
    try {
      console.log(`[Shippo] Trying: $${candidate.rate.amount} via ${candidate.rate.provider} ${candidate.rate.servicelevel}`);
      const label = await purchaseLabel(candidate.rate.objectId);
      if (!label) continue;

      console.log(`[Shippo] Label purchased: ${candidate.rate.provider} ${candidate.rate.servicelevel} $${candidate.rate.amount} — tracking: ${label.trackingNumber}`);

      return {
        shipmentId: candidate.shipmentId,
        transactionId: label.transactionId,
        trackingNumber: label.trackingNumber,
        trackingUrl: label.trackingUrl,
        labelUrl: label.labelUrl,
        carrier: candidate.rate.provider,
        service: candidate.rate.servicelevel,
        rate: candidate.rate.amount,
        eta: label.eta,
      };
    } catch (err) {
      console.warn(`[Shippo] Rate failed (${candidate.rate.provider} ${candidate.rate.servicelevel}): ${err instanceof Error ? err.message : 'unknown'}`);
      // Continue to next rate
    }
  }

  console.error('[Shippo] All rates failed for', weightLbs, 'lbs to', addressTo.zip);
  return null;
}

/**
 * Get live shipping rates for a destination zip code + weight.
 * Groups the cheapest rate per carrier+service across all parcel strategies.
 * Used to show shipping options to the customer before checkout.
 */
export async function getRatesForZip(
  zip: string,
  weightLbs: number,
): Promise<ShippoRate[]> {
  if (!shippoClient) return [];

  const addressTo: ShippoAddress = {
    name: 'Customer',
    street1: '123 Main St',
    city: 'Anytown',
    state: '',
    zip,
    country: 'US',
  };

  const strategies = buildParcelStrategies(weightLbs);

  const results = await Promise.allSettled(
    strategies.map((parcels) => createShipmentWithParcels(addressTo, parcels)),
  );

  // Collect all rates, dedup by provider+servicelevel keeping cheapest
  const rateMap = new Map<string, ShippoRate>();

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      for (const rate of result.value.rates) {
        const key = `${rate.provider}|${rate.servicelevel}`;
        const existing = rateMap.get(key);
        if (!existing || parseFloat(rate.amount) < parseFloat(existing.amount)) {
          rateMap.set(key, rate);
        }
      }
    }
  }

  const rates = Array.from(rateMap.values());
  rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
  return rates;
}

/**
 * Get tracking status for a carrier + tracking number.
 */
export async function getTracking(carrier: string, trackingNumber: string) {
  if (!shippoClient) return null;

  const track = await shippoClient.trackingStatus.get(trackingNumber, carrier);
  return {
    status: track.trackingStatus?.status ?? 'UNKNOWN',
    statusDetails: track.trackingStatus?.statusDetails ?? '',
    location: track.trackingStatus?.location ?? null,
    eta: track.eta?.toISOString() ?? null,
    trackingHistory: (track.trackingHistory ?? []).map((h) => ({
      status: h.status ?? '',
      statusDetails: h.statusDetails ?? '',
      date: h.statusDate?.toISOString() ?? '',
      location: h.location ?? null,
    })),
  };
}
