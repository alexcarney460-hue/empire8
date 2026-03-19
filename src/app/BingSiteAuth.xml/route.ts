/**
 * Bing Webmaster Tools XML file verification.
 *
 * After adding your site in Bing Webmaster Tools, if you chose the
 * "XML file" verification method, replace the placeholder below with
 * the actual code Bing provides (a hex string).
 *
 * The XML will be served at: https://empire8salesdirect.com/BingSiteAuth.xml
 */

const BING_VERIFICATION_CODE = 'REPLACE_WITH_BING_XML_VERIFICATION_CODE';

export function GET() {
  const xml = `<?xml version="1.0"?>
<users>
  <user>${BING_VERIFICATION_CODE}</user>
</users>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
