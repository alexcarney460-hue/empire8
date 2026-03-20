# Empire 8 -- Google Play Store Submission (TWA)

This directory contains everything needed to wrap the Empire 8 PWA as a
Trusted Web Activity and publish it on Google Play.

---

## Prerequisites

- Node.js 18+
- Java JDK 11+ (17 recommended)
- A Google Play Developer account ($25 one-time fee)

---

## Step 1: Install Bubblewrap CLI

```bash
npm i -g @nickvdh/nickvdh
```

If the package name above is outdated, search npm for `bubblewrap` by
GoogleChromeLabs:

```bash
npm search bubblewrap
```

The canonical package is published under `@nickvdh/nickvdh` or
`@nickvdh/nickvdh`. If neither resolves, install directly from the repo:

```bash
npm i -g nickvdh/nickvdh
```

---

## Step 2: Generate a Signing Key

```bash
keytool -genkeypair \
  -alias empire8 \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore empire8-keystore.jks \
  -storepass YOUR_STORE_PASSWORD \
  -dname "CN=Empire 8, O=Empire 8 Sales Direct, L=New York, ST=NY, C=US"
```

Then extract the SHA-256 fingerprint:

```bash
keytool -list -v -keystore empire8-keystore.jks -alias empire8
```

Copy the `SHA256:` line (colon-separated hex string like
`AB:CD:EF:...`) and paste it into two places:

1. `src/app/.well-known/assetlinks.json/route.ts` -- replace
   `PLACEHOLDER_SHA256_FINGERPRINT`
2. Keep a copy for the Google Play App Signing configuration

IMPORTANT: Back up `empire8-keystore.jks` and the password securely.
If lost, you cannot push updates to the same Play listing.

---

## Step 3: Deploy the Asset Links Endpoint

After updating the fingerprint in the route file, deploy the site so
that `https://empire8ny.com/.well-known/assetlinks.json` returns the
correct JSON.

Verify with:

```bash
curl -s https://empire8ny.com/.well-known/assetlinks.json | jq .
```

You can also use Google's official validator:
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://empire8ny.com&relation=delegate_permission/common.handle_all_urls

---

## Step 4: Initialize and Build the TWA

```bash
cd twa/

# Initialize from the config (Bubblewrap will download Android SDK if needed)
bubblewrap init --manifest="https://empire8ny.com/manifest.json"

# Or init from local config:
bubblewrap init --config=bubblewrap.config.json

# Build the signed AAB (Android App Bundle) for Play Store upload
bubblewrap build
```

This produces `app-release-bundle.aab` and `app-release-signed.apk`.

---

## Step 5: Create the Google Play Listing

### Developer Console

1. Go to https://play.google.com/console
2. Create a new app
3. Fill in the store listing details below

### Store Listing Metadata

**App name:** Empire 8 Sales Direct

**Short description (80 chars max):**
NY cannabis wholesale marketplace. Order products, bid on lots, track deliveries.

**Full description (4000 chars max):**

Empire 8 Sales Direct is the wholesale ordering platform for licensed cannabis
retailers and delivery services in New York State.

Browse curated brands and place wholesale orders directly from verified
manufacturers and distributors. Every product listing includes full COA
documentation, lab results, and compliance data.

KEY FEATURES

- Wholesale Catalog: Browse flower, pre-rolls, edibles, vapes, and
  concentrates from licensed NY cannabis brands
- Weedbay Marketplace: Bid on overstock lots and closeout inventory at
  below-wholesale prices
- Real-Time Order Tracking: Follow your order from confirmation through
  delivery with push notifications at every stage
- Brand Storefronts: Each brand has a dedicated page with their full product
  line, about info, and direct ordering
- Push Notifications: Get alerted when new brands launch, lots go live, or
  your order status changes
- Secure Payments: Integrated payment processing through Square
- License Verification: All buyers and sellers are verified NY cannabis
  license holders
- Route Optimization: Delivery scheduling aligned with Empire 8 distribution
  routes across New York

WHO THIS IS FOR

Licensed cannabis dispensaries, delivery services, and retail operators in
New York State who want a fast, reliable wholesale ordering experience
without the friction of traditional distribution.

Empire 8 Sales Direct is operated by Empire 8 LLC, a licensed cannabis
distributor serving the New York market.

**Category:** Business

**Content rating:** Mature 17+
(Cannabis/marijuana references require this rating)

**Contact email:** support@empire8ny.com

**Privacy policy URL:** https://empire8ny.com/privacy

### Required Graphics

| Asset | Size | Notes |
|-------|------|-------|
| App icon | 512x512 PNG | Use `/public/icon-512.png` |
| Feature graphic | 1024x500 PNG | Create a branded banner |
| Phone screenshots | min 2, 16:9 or 9:16 | Capture key screens from the PWA |
| Tablet screenshots | optional but recommended | 16:9 landscape |

### App Signing

Google Play manages app signing. During first upload:
1. Choose "Let Google manage and protect your app signing key"
2. Upload the AAB built by Bubblewrap
3. Google will provide a deployment certificate fingerprint --
   you may need to add this fingerprint to assetlinks.json as well

---

## Step 6: Submit for Review

1. Upload `app-release-bundle.aab` to the Production track (or Internal
   Testing first for a dry run)
2. Complete the content rating questionnaire (select "marijuana" references)
3. Set pricing to Free
4. Target countries: United States only
5. Submit for review

Review typically takes 1-3 business days. Cannabis-related apps may
receive additional scrutiny -- ensure the privacy policy and terms of
service are complete and accessible.

---

## Updating the App

To push updates:

1. Increment `appVersionCode` and `appVersionName` in
   `bubblewrap.config.json`
2. Run `bubblewrap build` again
3. Upload the new AAB to Google Play Console

Since the TWA wraps your website, most updates happen server-side and
do not require a new APK. Only update the Play Store listing when you
change the manifest, icons, or need to bump the version for policy
compliance.

---

## Troubleshooting

**Chrome address bar appears inside the app:**
The Digital Asset Links verification failed. Check that
`https://empire8ny.com/.well-known/assetlinks.json` is accessible,
returns valid JSON, and contains the correct SHA-256 fingerprint.

**App rejected for cannabis content:**
Google Play allows cannabis ordering/delivery apps in jurisdictions
where it is legal, but the listing must clearly state that the service
is limited to licensed operators and complies with state law. Include
this in the full description and privacy policy.

**Push notifications not working in TWA:**
Ensure `enableNotifications: true` is set in bubblewrap.config.json
and the service worker is registered correctly. The TWA must request
the POST_NOTIFICATIONS permission on Android 13+.
