/* Global type declarations for analytics scripts (GA4 + Meta Pixel) */

interface Window {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  fbq?: (...args: unknown[]) => void;
  _fbq?: unknown;
}
