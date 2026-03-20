import { NextResponse } from 'next/server';

export async function GET() {
  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.empire8ny.app',
        sha256_cert_fingerprints: [
          // Replace with actual SHA-256 fingerprint after generating the signing key.
          // Run: keytool -list -v -keystore empire8-keystore.jks -alias empire8
          // Copy the SHA-256 line (colon-separated hex).
          'PLACEHOLDER_SHA256_FINGERPRINT',
        ],
      },
    },
  ];

  return NextResponse.json(assetLinks, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
