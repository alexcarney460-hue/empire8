import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderData {
  id: number;
  email: string;
  total: number;
  currency?: string;
  items: OrderItem[];
  shipping_name?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip?: string | null;
  shipping_country?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

export interface TrackingData {
  tracking_number: string;
  shipping_carrier: string;
  tracking_url: string;
  shipping_service?: string | null;
}

// ---------------------------------------------------------------------------
// Resend client (lazy init)
// ---------------------------------------------------------------------------

const FROM_ADDRESS = 'Empire 8 Sales Direct <info@empire8salesdirect.com>';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------

const BRAND = {
  primary: '#1a56db',       // deep blue
  primaryLight: '#e8effc',
  accent: '#f59e0b',        // amber
  dark: '#111827',
  muted: '#6b7280',
  light: '#f9fafb',
  white: '#ffffff',
  border: '#e5e7eb',
  success: '#10b981',
} as const;

// ---------------------------------------------------------------------------
// Shared email layout
// ---------------------------------------------------------------------------

function emailLayout(title: string, preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.light};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.light};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.primary};padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:${BRAND.white};font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                Empire 8 Sales Direct
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                Wholesale Gloves &amp; Supplies
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.light};padding:24px 40px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;color:${BRAND.muted};font-size:12px;text-align:center;line-height:1.6;">
                Empire 8 Sales Direct &bull; New York, NY 10001<br>
                <a href="https://empire8salesdirect.com" style="color:${BRAND.primary};text-decoration:none;">empire8salesdirect.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Security: HTML escaping for user-provided data
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

/**
 * Validate and sanitize a URL for use in href attributes.
 * Only allows http/https protocols to prevent javascript: injection.
 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return '#';
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatAddress(order: OrderData): string {
  const parts = [
    escapeHtml(order.shipping_name),
    escapeHtml(order.shipping_address_line1),
    escapeHtml(order.shipping_address_line2),
    [order.shipping_city, order.shipping_state, order.shipping_zip]
      .filter(Boolean)
      .map(escapeHtml)
      .join(', '),
    order.shipping_country && order.shipping_country !== 'US' ? escapeHtml(order.shipping_country) : null,
  ].filter(Boolean);
  return parts.join('<br>');
}

// ---------------------------------------------------------------------------
// Email: Order Confirmation
// ---------------------------------------------------------------------------

function buildOrderConfirmationHtml(order: OrderData): string {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.dark};font-size:14px;">
            ${escapeHtml(item.product_name)}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:14px;text-align:center;">
            ${Number(item.quantity) || 0}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.dark};font-size:14px;text-align:right;">
            ${formatCurrency(item.total_price, order.currency)}
          </td>
        </tr>`
    )
    .join('');

  const addressHtml = formatAddress(order);

  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.dark};font-size:22px;font-weight:700;">
      Order Confirmed
    </h2>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:14px;">
      Thank you for your order! We're preparing it for shipment.
    </p>

    <!-- Order number badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${BRAND.primaryLight};padding:16px 20px;border-radius:8px;">
          <span style="color:${BRAND.primary};font-size:13px;font-weight:600;">ORDER #${order.id}</span>
          <span style="color:${BRAND.muted};font-size:13px;float:right;">${formatDate(order.created_at)}</span>
        </td>
      </tr>
    </table>

    <!-- Items table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Item</td>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</td>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Price</td>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:16px 0 0;color:${BRAND.dark};font-size:16px;font-weight:700;">Total</td>
        <td style="padding:16px 0 0;color:${BRAND.primary};font-size:16px;font-weight:700;text-align:right;">${formatCurrency(order.total, order.currency)}</td>
      </tr>
    </table>

    ${
      addressHtml
        ? `
    <!-- Shipping address -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="background-color:${BRAND.light};padding:20px;border-radius:8px;border:1px solid ${BRAND.border};">
          <p style="margin:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ship To</p>
          <p style="margin:0;color:${BRAND.dark};font-size:14px;line-height:1.6;">${addressHtml}</p>
        </td>
      </tr>
    </table>`
        : ''
    }

    <!-- Footer note -->
    <p style="margin:28px 0 0;color:${BRAND.muted};font-size:13px;line-height:1.6;">
      You'll receive another email with tracking information once your order ships. If you have any questions, reply to this email or contact us at
      <a href="mailto:info@empire8salesdirect.com" style="color:${BRAND.primary};text-decoration:none;">info@empire8salesdirect.com</a>.
    </p>
  `;

  return emailLayout(
    'Order Confirmed - Empire 8 Sales Direct',
    `Your order #${order.id} has been confirmed. Total: ${formatCurrency(order.total, order.currency)}`,
    body,
  );
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderData: OrderData,
): Promise<{ success: boolean; error?: string }> {
  const html = buildOrderConfirmationHtml(orderData);
  const subject = `Order Confirmed - #${orderData.id}`;

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] (console-only) Order confirmation for ${to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Order #${orderData.id}, Total: ${formatCurrency(orderData.total)}, Items: ${orderData.items.length}`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[Email] Resend error (order confirmation):', error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Order confirmation sent to ${to} for order #${orderData.id}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email] Failed to send order confirmation:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Email: Shipping Notification
// ---------------------------------------------------------------------------

function buildShippingNotificationHtml(trackingData: TrackingData): string {
  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.dark};font-size:22px;font-weight:700;">
      Your Order Has Shipped!
    </h2>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:14px;">
      Great news — your order is on its way.
    </p>

    <!-- Tracking card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${BRAND.light};padding:24px;border-radius:8px;border:1px solid ${BRAND.border};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 4px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Carrier</p>
                <p style="margin:0 0 16px;color:${BRAND.dark};font-size:15px;font-weight:600;">${escapeHtml(trackingData.shipping_carrier)}${trackingData.shipping_service ? ` — ${escapeHtml(trackingData.shipping_service)}` : ''}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0 0 4px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Tracking Number</p>
                <p style="margin:0;color:${BRAND.dark};font-size:15px;font-weight:600;font-family:monospace;">${escapeHtml(trackingData.tracking_number)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Track button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${sanitizeUrl(trackingData.tracking_url)}" target="_blank" style="display:inline-block;background-color:${BRAND.primary};color:${BRAND.white};text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            Track Your Package
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:${BRAND.muted};font-size:13px;line-height:1.6;">
      Tracking information may take a few hours to update after shipment. If you have any questions, reply to this email or contact
      <a href="mailto:info@empire8salesdirect.com" style="color:${BRAND.primary};text-decoration:none;">info@empire8salesdirect.com</a>.
    </p>
  `;

  return emailLayout(
    'Your Order Has Shipped - Empire 8 Sales Direct',
    `Your order has shipped via ${trackingData.shipping_carrier}. Tracking: ${trackingData.tracking_number}`,
    body,
  );
}

export async function sendShippingNotificationEmail(
  to: string,
  trackingData: TrackingData,
): Promise<{ success: boolean; error?: string }> {
  const html = buildShippingNotificationHtml(trackingData);
  const subject = `Your Order Has Shipped — Tracking #${trackingData.tracking_number}`;

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] (console-only) Shipping notification for ${to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Carrier: ${trackingData.shipping_carrier}, Tracking: ${trackingData.tracking_number}`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[Email] Resend error (shipping notification):', error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Shipping notification sent to ${to}, tracking: ${trackingData.tracking_number}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email] Failed to send shipping notification:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Email: Order Shipped (combined order + tracking)
// ---------------------------------------------------------------------------

function buildOrderShippedHtml(order: OrderData, tracking: TrackingData): string {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.dark};font-size:14px;">
            ${escapeHtml(item.product_name)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:14px;text-align:center;">
            ${Number(item.quantity) || 0}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.dark};font-size:14px;text-align:right;">
            ${formatCurrency(item.total_price, order.currency)}
          </td>
        </tr>`
    )
    .join('');

  const addressHtml = formatAddress(order);

  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.dark};font-size:22px;font-weight:700;">
      Your Order Has Shipped!
    </h2>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:14px;">
      Great news — order #${order.id} is on its way to you.
    </p>

    <!-- Tracking card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:${BRAND.primaryLight};padding:20px;border-radius:8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;">
                <p style="margin:0 0 4px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Carrier</p>
                <p style="margin:0;color:${BRAND.dark};font-size:14px;font-weight:600;">${escapeHtml(tracking.shipping_carrier)}${tracking.shipping_service ? ` — ${escapeHtml(tracking.shipping_service)}` : ''}</p>
              </td>
              <td style="width:50%;">
                <p style="margin:0 0 4px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Tracking</p>
                <p style="margin:0;color:${BRAND.dark};font-size:14px;font-weight:600;font-family:monospace;">${escapeHtml(tracking.tracking_number)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Track button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${sanitizeUrl(tracking.tracking_url)}" target="_blank" style="display:inline-block;background-color:${BRAND.success};color:${BRAND.white};text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            Track Your Package
          </a>
        </td>
      </tr>
    </table>

    <!-- Order summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 12px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Order Summary</p>
        </td>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:14px 0 0;color:${BRAND.dark};font-size:15px;font-weight:700;">Total</td>
        <td style="padding:14px 0 0;color:${BRAND.primary};font-size:15px;font-weight:700;text-align:right;">${formatCurrency(order.total, order.currency)}</td>
      </tr>
    </table>

    ${
      addressHtml
        ? `
    <!-- Shipping address -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:${BRAND.light};padding:16px 20px;border-radius:8px;border:1px solid ${BRAND.border};">
          <p style="margin:0 0 6px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ship To</p>
          <p style="margin:0;color:${BRAND.dark};font-size:14px;line-height:1.6;">${addressHtml}</p>
        </td>
      </tr>
    </table>`
        : ''
    }

    <p style="margin:0;color:${BRAND.muted};font-size:13px;line-height:1.6;">
      Tracking may take a few hours to update. Questions? Contact
      <a href="mailto:info@empire8salesdirect.com" style="color:${BRAND.primary};text-decoration:none;">info@empire8salesdirect.com</a>.
    </p>
  `;

  return emailLayout(
    'Your Order Has Shipped - Empire 8 Sales Direct',
    `Order #${order.id} shipped via ${tracking.shipping_carrier}. Tracking: ${tracking.tracking_number}`,
    body,
  );
}

export async function sendOrderShippedEmail(
  to: string,
  orderData: OrderData,
  trackingInfo: TrackingData,
): Promise<{ success: boolean; error?: string }> {
  const html = buildOrderShippedHtml(orderData, trackingInfo);
  const subject = `Order #${orderData.id} Has Shipped — Tracking #${trackingInfo.tracking_number}`;

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] (console-only) Order shipped for ${to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Order #${orderData.id}, Carrier: ${trackingInfo.shipping_carrier}, Tracking: ${trackingInfo.tracking_number}`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[Email] Resend error (order shipped):', error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Order shipped email sent to ${to} for order #${orderData.id}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email] Failed to send order shipped email:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Email: Subscription Renewal Reminder
// ---------------------------------------------------------------------------

export interface RenewalEmailData {
  readonly subscriptionId: string;
  readonly items: ReadonlyArray<{ name: string; quantity: number; purchaseUnit: string }>;
  readonly frequency: string;
  readonly discountPct: number;
  readonly checkoutUrl: string;
}

export interface AutoshipReceiptData {
  readonly subscriptionId: string;
  readonly items: ReadonlyArray<{ name: string; quantity: number; purchaseUnit: string }>;
  readonly totalCents: number;
  readonly discountPct: number;
  readonly nextRenewalDate: string;
  readonly cardLast4?: string;
}

export interface PaymentFailedData {
  readonly subscriptionId: string;
  readonly items: ReadonlyArray<{ name: string; quantity: number; purchaseUnit: string }>;
  readonly accountUrl: string;
  readonly cardLast4?: string;
}

function buildRenewalReminderHtml(data: RenewalEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.dark};font-size:14px;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:14px;text-align:center;">
            ${item.quantity} ${escapeHtml(item.purchaseUnit)}${item.quantity !== 1 ? 's' : ''}
          </td>
        </tr>`,
    )
    .join('');

  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.dark};font-size:22px;font-weight:700;">
      Time to Reorder!
    </h2>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:14px;">
      Your Subscribe &amp; Save order is ready for renewal. Click below to confirm and pay &mdash; your ${Math.round(data.discountPct)}% discount is already applied.
    </p>

    <!-- Items -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Item</td>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</td>
      </tr>
      ${itemRows}
    </table>

    <!-- CTA button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${sanitizeUrl(data.checkoutUrl)}" target="_blank" style="display:inline-block;background-color:${BRAND.success};color:${BRAND.white};text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            Confirm &amp; Pay Now
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;line-height:1.6;">
      This link will take you to a secure Square checkout with your subscription discount already applied. No action is needed if you&rsquo;d like to skip this month &mdash; simply ignore this email.
    </p>

    <p style="margin:0;color:${BRAND.muted};font-size:13px;line-height:1.6;">
      To pause or cancel your subscription, visit your
      <a href="https://empire8salesdirect.com/account" style="color:${BRAND.primary};text-decoration:none;">account page</a>
      or reply to this email.
    </p>
  `;

  return emailLayout(
    'Your Subscribe & Save Order is Ready - Empire 8 Sales Direct',
    `Your recurring order is ready for renewal. Confirm and pay to keep your ${Math.round(data.discountPct)}% discount.`,
    body,
  );
}

export async function sendRenewalReminderEmail(
  to: string,
  data: RenewalEmailData,
): Promise<{ success: boolean; error?: string }> {
  const html = buildRenewalReminderHtml(data);
  const subject = 'Your Subscribe & Save Order is Ready';

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] (console-only) Renewal reminder for ${to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Subscription: ${data.subscriptionId}, Items: ${data.items.length}`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[Email] Resend error (renewal reminder):', error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Renewal reminder sent to ${to} for subscription ${data.subscriptionId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email] Failed to send renewal reminder:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Email: Autoship Receipt (sent after successful auto-charge)
// ---------------------------------------------------------------------------

function buildAutoshipReceiptHtml(data: AutoshipReceiptData): string {
  const totalDollars = data.totalCents / 100;
  const nextDate = new Date(data.nextRenewalDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.dark};font-size:14px;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:14px;text-align:center;">
            ${item.quantity} ${escapeHtml(item.purchaseUnit)}${item.quantity !== 1 ? 's' : ''}
          </td>
        </tr>`,
    )
    .join('');

  const cardNote = data.cardLast4
    ? `Card ending in <strong>${escapeHtml(data.cardLast4)}</strong>`
    : 'Your card on file';

  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.dark};font-size:22px;font-weight:700;">
      Autoship Payment Confirmed
    </h2>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:14px;">
      Your Subscribe &amp; Save order has been automatically charged. No action is needed &mdash; your order is being prepared.
    </p>

    <!-- Payment badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:${BRAND.primaryLight};padding:16px 20px;border-radius:8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="color:${BRAND.primary};font-size:13px;font-weight:600;">SUBSCRIPTION ${escapeHtml(data.subscriptionId.slice(0, 8).toUpperCase())}</span>
              </td>
              <td style="text-align:right;">
                <span style="color:${BRAND.success};font-size:14px;font-weight:700;">${formatCurrency(totalDollars)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Items -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Item</td>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</td>
      </tr>
      ${itemRows}
    </table>

    <!-- Payment & next renewal info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:${BRAND.light};padding:20px;border-radius:8px;border:1px solid ${BRAND.border};">
          <p style="margin:0 0 8px;color:${BRAND.muted};font-size:13px;">
            ${cardNote} was charged <strong style="color:${BRAND.dark};">${formatCurrency(totalDollars)}</strong> (${Math.round(data.discountPct)}% Subscribe &amp; Save discount applied).
          </p>
          <p style="margin:0;color:${BRAND.muted};font-size:13px;">
            Next renewal: <strong style="color:${BRAND.dark};">${nextDate}</strong>
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:${BRAND.muted};font-size:13px;line-height:1.6;">
      To manage your subscription, visit your
      <a href="https://empire8salesdirect.com/account" style="color:${BRAND.primary};text-decoration:none;">account page</a>
      or reply to this email.
    </p>
  `;

  return emailLayout(
    'Autoship Payment Confirmed - Empire 8 Sales Direct',
    `Your Subscribe & Save order was charged ${formatCurrency(totalDollars)}. Next renewal: ${nextDate}.`,
    body,
  );
}

export async function sendAutoshipReceiptEmail(
  to: string,
  data: AutoshipReceiptData,
): Promise<{ success: boolean; error?: string }> {
  const html = buildAutoshipReceiptHtml(data);
  const subject = `Autoship Payment Confirmed — ${formatCurrency(data.totalCents / 100)}`;

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] (console-only) Autoship receipt for ${to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Subscription: ${data.subscriptionId}, Total: ${formatCurrency(data.totalCents / 100)}`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[Email] Resend error (autoship receipt):', error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Autoship receipt sent to ${to} for subscription ${data.subscriptionId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email] Failed to send autoship receipt:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Email: Payment Failed (card declined — subscription paused)
// ---------------------------------------------------------------------------

function buildPaymentFailedHtml(data: PaymentFailedData): string {
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.dark};font-size:14px;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:14px;text-align:center;">
            ${item.quantity} ${escapeHtml(item.purchaseUnit)}${item.quantity !== 1 ? 's' : ''}
          </td>
        </tr>`,
    )
    .join('');

  const cardNote = data.cardLast4
    ? `Your card ending in <strong>${escapeHtml(data.cardLast4)}</strong> was declined.`
    : 'Your payment method was declined.';

  const body = `
    <h2 style="margin:0 0 8px;color:#dc2626;font-size:22px;font-weight:700;">
      Payment Failed
    </h2>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:14px;">
      We were unable to process your Subscribe &amp; Save renewal. Your subscription has been paused until payment is resolved.
    </p>

    <!-- Alert card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#FEF2F2;padding:16px 20px;border-radius:8px;border:1px solid #fecaca;">
          <p style="margin:0;color:#dc2626;font-size:14px;font-weight:600;">
            ${cardNote}
          </p>
          <p style="margin:8px 0 0;color:${BRAND.muted};font-size:13px;">
            Please update your payment method to resume your subscription and keep your discount.
          </p>
        </td>
      </tr>
    </table>

    <!-- Items that were not renewed -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Items Not Renewed</td>
        <td style="padding:0 0 8px;color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</td>
      </tr>
      ${itemRows}
    </table>

    <!-- CTA button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${sanitizeUrl(data.accountUrl)}" target="_blank" style="display:inline-block;background-color:${BRAND.primary};color:${BRAND.white};text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            Update Payment Method
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:${BRAND.muted};font-size:13px;line-height:1.6;">
      If you need help, reply to this email or contact
      <a href="mailto:info@empire8salesdirect.com" style="color:${BRAND.primary};text-decoration:none;">info@empire8salesdirect.com</a>.
    </p>
  `;

  return emailLayout(
    'Payment Failed - Empire 8 Sales Direct',
    'We could not process your Subscribe & Save renewal. Please update your payment method.',
    body,
  );
}

export async function sendPaymentFailedEmail(
  to: string,
  data: PaymentFailedData,
): Promise<{ success: boolean; error?: string }> {
  const html = buildPaymentFailedHtml(data);
  const subject = 'Action Required: Subscribe & Save Payment Failed';

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] (console-only) Payment failed for ${to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Subscription: ${data.subscriptionId}`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[Email] Resend error (payment failed):', error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Payment failed email sent to ${to} for subscription ${data.subscriptionId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email] Failed to send payment failed email:', message);
    return { success: false, error: message };
  }
}
