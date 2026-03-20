import { Resend } from 'resend';
import { getSupabaseServer } from './supabase-server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesOrderRow {
  readonly id: string;
  readonly order_number: string;
  readonly dispensary_id: string | null;
  readonly user_id: string | null;
  readonly status: string;
  readonly total_cents: number;
  readonly notes: string | null;
  readonly created_at: string;
}

interface SalesOrderItemRow {
  readonly id: string;
  readonly order_id: string;
  readonly brand_id: string;
  readonly product_id: string;
  readonly product_name: string;
  readonly quantity: number;
  readonly unit_price_cents: number;
  readonly line_total_cents: number;
}

interface DispensaryRow {
  readonly id: string;
  readonly company_name: string;
  readonly license_number: string;
  readonly license_type: string;
  readonly contact_name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly address_street: string | null;
  readonly address_city: string | null;
  readonly address_state: string | null;
  readonly address_zip: string | null;
}

interface BrandRow {
  readonly id: string;
  readonly name: string;
  readonly contact_email: string;
  readonly contact_name: string | null;
  readonly logo_url: string | null;
}

interface BrandGroup {
  readonly brand: BrandRow;
  readonly items: ReadonlyArray<SalesOrderItemRow>;
  readonly subtotalCents: number;
}

export interface BrandEmailResult {
  readonly brandId: string;
  readonly brandName: string;
  readonly success: boolean;
  readonly error?: string;
}

export interface OrderEmailsResult {
  readonly brandResults: ReadonlyArray<BrandEmailResult>;
  readonly dispensaryResult: { readonly success: boolean; readonly error?: string };
  readonly adminResult: { readonly success: boolean; readonly error?: string };
}

// ---------------------------------------------------------------------------
// Resend client (lazy init — mirrors email.ts pattern)
// ---------------------------------------------------------------------------

const FROM_ADDRESS = 'Empire 8 Sales Direct <info@empire8ny.com>';
const ADMIN_EMAIL_FALLBACK = 'info@empire8ny.com';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL?.trim() || ADMIN_EMAIL_FALLBACK;
}

// ---------------------------------------------------------------------------
// Security: HTML escaping
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

// ---------------------------------------------------------------------------
// Brand colors & formatting
// ---------------------------------------------------------------------------

const C = {
  purple: '#4A0E78',
  purpleLight: '#F3EAF9',
  gold: '#C8A23C',
  goldLight: '#FDF8EC',
  dark: '#1A1A2E',
  muted: '#6B7280',
  light: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB',
} as const;

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDispensaryAddress(d: DispensaryRow): string {
  const parts = [
    esc(d.address_street),
    [d.address_city, d.address_state, d.address_zip]
      .filter(Boolean)
      .map(esc)
      .join(', '),
  ].filter(Boolean);
  return parts.join('<br>');
}

// ---------------------------------------------------------------------------
// Shared email layout (purple/gold themed)
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
<body style="margin:0;padding:0;background-color:${C.light};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.light};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${C.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${C.purple} 0%, #2D0A4E 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:${C.gold};font-size:26px;font-weight:700;letter-spacing:0.5px;">
                EMPIRE 8
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;">
                SALES DIRECT
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
            <td style="background-color:${C.light};padding:24px 40px;border-top:1px solid ${C.border};">
              <p style="margin:0;color:${C.muted};font-size:12px;text-align:center;line-height:1.6;">
                Empire 8 Sales Direct &bull; New York, NY 10001<br>
                <a href="mailto:info@empire8ny.com" style="color:${C.purple};text-decoration:none;">info@empire8ny.com</a>
                &bull;
                <a href="https://empire8ny.com" style="color:${C.purple};text-decoration:none;">empire8ny.com</a>
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
// Build item rows (reusable)
// ---------------------------------------------------------------------------

function buildItemRows(items: ReadonlyArray<SalesOrderItemRow>): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid ${C.border};color:${C.dark};font-size:14px;">
          ${esc(item.product_name)}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid ${C.border};color:${C.muted};font-size:14px;text-align:center;">
          ${Number(item.quantity) || 0}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid ${C.border};color:${C.dark};font-size:14px;text-align:right;">
          ${formatCents(item.unit_price_cents)}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid ${C.border};color:${C.dark};font-size:14px;text-align:right;font-weight:600;">
          ${formatCents(item.line_total_cents)}
        </td>
      </tr>`,
    )
    .join('');
}

// ---------------------------------------------------------------------------
// Dispensary info block (reusable)
// ---------------------------------------------------------------------------

function dispensaryInfoBlock(d: DispensaryRow): string {
  const addressHtml = formatDispensaryAddress(d);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.purpleLight};padding:20px;border-radius:8px;border:1px solid ${C.border};">
          <p style="margin:0 0 4px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Dispensary</p>
          <p style="margin:0 0 12px;color:${C.dark};font-size:16px;font-weight:700;">${esc(d.company_name)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;vertical-align:top;padding-right:12px;">
                <p style="margin:0 0 4px;color:${C.muted};font-size:12px;font-weight:600;">Contact</p>
                <p style="margin:0 0 8px;color:${C.dark};font-size:14px;">${esc(d.contact_name)}</p>
                <p style="margin:0 0 4px;color:${C.muted};font-size:12px;font-weight:600;">Email</p>
                <p style="margin:0 0 8px;color:${C.dark};font-size:14px;">${esc(d.email)}</p>
                ${d.phone ? `<p style="margin:0 0 4px;color:${C.muted};font-size:12px;font-weight:600;">Phone</p><p style="margin:0;color:${C.dark};font-size:14px;">${esc(d.phone)}</p>` : ''}
              </td>
              <td style="width:50%;vertical-align:top;">
                <p style="margin:0 0 4px;color:${C.muted};font-size:12px;font-weight:600;">License #</p>
                <p style="margin:0 0 8px;color:${C.dark};font-size:14px;font-family:monospace;">${esc(d.license_number)}</p>
                ${addressHtml ? `<p style="margin:0 0 4px;color:${C.muted};font-size:12px;font-weight:600;">Ship To</p><p style="margin:0;color:${C.dark};font-size:14px;line-height:1.5;">${addressHtml}</p>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

// ---------------------------------------------------------------------------
// Email #1: Brand sales order (one per brand)
// ---------------------------------------------------------------------------

function buildBrandOrderHtml(
  order: SalesOrderRow,
  dispensary: DispensaryRow,
  group: BrandGroup,
): string {
  const itemRows = buildItemRows(group.items);

  const body = `
    <h2 style="margin:0 0 8px;color:${C.dark};font-size:22px;font-weight:700;">
      New Sales Order from ${esc(dispensary.company_name)}
    </h2>
    <p style="margin:0 0 24px;color:${C.muted};font-size:14px;">
      A new order has been placed through Empire 8 Sales Direct containing your products.
    </p>

    <!-- Order number badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.goldLight};padding:16px 20px;border-radius:8px;border:1px solid ${C.gold};">
          <span style="color:${C.purple};font-size:13px;font-weight:600;">ORDER ${esc(order.order_number)}</span>
          <span style="color:${C.muted};font-size:13px;float:right;">${formatDate(order.created_at)}</span>
        </td>
      </tr>
    </table>

    <!-- Dispensary info -->
    ${dispensaryInfoBlock(dispensary)}

    <!-- Items table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Product</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Unit Price</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Line Total</td>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="3" style="padding:16px 8px 0;color:${C.dark};font-size:16px;font-weight:700;">Subtotal</td>
        <td style="padding:16px 8px 0;color:${C.purple};font-size:16px;font-weight:700;text-align:right;">${formatCents(group.subtotalCents)}</td>
      </tr>
    </table>

    <!-- Fulfillment note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="background-color:${C.light};padding:20px;border-radius:8px;border:1px solid ${C.border};">
          <p style="margin:0;color:${C.dark};font-size:14px;line-height:1.6;">
            This order was placed through Empire 8 Sales Direct. Please fulfill and ship to the dispensary address above.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;color:${C.muted};font-size:13px;line-height:1.6;">
      Questions about this order? Contact
      <a href="mailto:info@empire8ny.com" style="color:${C.purple};text-decoration:none;">info@empire8ny.com</a>.
    </p>
  `;

  return emailLayout(
    `New Sales Order ${order.order_number} - Empire 8 Sales Direct`,
    `New order from ${dispensary.company_name} — ${group.items.length} item(s), ${formatCents(group.subtotalCents)} total.`,
    body,
  );
}

// ---------------------------------------------------------------------------
// Email #2: Dispensary confirmation
// ---------------------------------------------------------------------------

function buildDispensaryConfirmationHtml(
  order: SalesOrderRow,
  dispensary: DispensaryRow,
  groups: ReadonlyArray<BrandGroup>,
  allItems: ReadonlyArray<SalesOrderItemRow>,
): string {
  const brandList = groups.map((g) => esc(g.brand.name)).join(', ');
  const itemRows = buildItemRows(allItems);

  const body = `
    <h2 style="margin:0 0 8px;color:${C.dark};font-size:22px;font-weight:700;">
      Order Submitted
    </h2>
    <p style="margin:0 0 24px;color:${C.muted};font-size:14px;">
      Thank you, ${esc(dispensary.contact_name)}! Your order has been submitted to the following brands: <strong>${brandList}</strong>.
    </p>

    <!-- Order number badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.goldLight};padding:16px 20px;border-radius:8px;border:1px solid ${C.gold};">
          <span style="color:${C.purple};font-size:13px;font-weight:600;">ORDER ${esc(order.order_number)}</span>
          <span style="color:${C.muted};font-size:13px;float:right;">${formatDate(order.created_at)}</span>
        </td>
      </tr>
    </table>

    <!-- Items table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Product</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Unit Price</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Line Total</td>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="3" style="padding:16px 8px 0;color:${C.dark};font-size:16px;font-weight:700;">Order Total</td>
        <td style="padding:16px 8px 0;color:${C.purple};font-size:16px;font-weight:700;text-align:right;">${formatCents(order.total_cents)}</td>
      </tr>
    </table>

    <!-- Processing info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="background-color:${C.purpleLight};padding:20px;border-radius:8px;border:1px solid ${C.border};">
          <p style="margin:0 0 4px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Expected Processing</p>
          <p style="margin:0;color:${C.dark};font-size:14px;line-height:1.6;">
            Each brand will process and ship their portion of your order individually. Most orders ship within 2-5 business days.
            You will receive tracking information directly from each brand as items ship.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;color:${C.muted};font-size:13px;line-height:1.6;">
      Questions about your order? Contact
      <a href="mailto:info@empire8ny.com" style="color:${C.purple};text-decoration:none;">info@empire8ny.com</a>.
    </p>
  `;

  return emailLayout(
    `Order Submitted ${order.order_number} - Empire 8 Sales Direct`,
    `Your order ${order.order_number} has been submitted to ${groups.length} brand(s). Total: ${formatCents(order.total_cents)}.`,
    body,
  );
}

// ---------------------------------------------------------------------------
// Email #3: Admin notification
// ---------------------------------------------------------------------------

function buildAdminNotificationHtml(
  order: SalesOrderRow,
  dispensary: DispensaryRow,
  groups: ReadonlyArray<BrandGroup>,
  allItems: ReadonlyArray<SalesOrderItemRow>,
  brandResults: ReadonlyArray<BrandEmailResult>,
): string {
  const brandSummaryRows = groups
    .map((g) => {
      const result = brandResults.find((r) => r.brandId === g.brand.id);
      const statusColor = result?.success ? '#10b981' : '#dc2626';
      const statusText = result?.success ? 'Sent' : `Failed: ${esc(result?.error)}`;
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid ${C.border};color:${C.dark};font-size:14px;">${esc(g.brand.name)}</td>
          <td style="padding:8px;border-bottom:1px solid ${C.border};color:${C.dark};font-size:14px;text-align:center;">${g.items.length}</td>
          <td style="padding:8px;border-bottom:1px solid ${C.border};color:${C.dark};font-size:14px;text-align:right;">${formatCents(g.subtotalCents)}</td>
          <td style="padding:8px;border-bottom:1px solid ${C.border};color:${statusColor};font-size:13px;text-align:right;font-weight:600;">${statusText}</td>
        </tr>`;
    })
    .join('');

  const itemRows = buildItemRows(allItems);

  const body = `
    <h2 style="margin:0 0 8px;color:${C.dark};font-size:22px;font-weight:700;">
      New Order Submitted
    </h2>
    <p style="margin:0 0 24px;color:${C.muted};font-size:14px;">
      Emails sent to ${groups.length} brand(s).
    </p>

    <!-- Order badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:${C.goldLight};padding:16px 20px;border-radius:8px;border:1px solid ${C.gold};">
          <span style="color:${C.purple};font-size:13px;font-weight:600;">ORDER ${esc(order.order_number)}</span>
          <span style="color:${C.muted};font-size:13px;float:right;">${formatDate(order.created_at)}</span>
        </td>
      </tr>
    </table>

    <!-- Dispensary info -->
    ${dispensaryInfoBlock(dispensary)}

    <!-- Brand email status -->
    <p style="margin:0 0 12px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Brand Email Status</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Brand</td>
        <td style="padding:8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Items</td>
        <td style="padding:8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Subtotal</td>
        <td style="padding:8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Status</td>
      </tr>
      ${brandSummaryRows}
    </table>

    <!-- Full item list -->
    <p style="margin:0 0 12px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">All Items</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Product</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Unit Price</td>
        <td style="padding:0 8px 8px;color:${C.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Line Total</td>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="3" style="padding:16px 8px 0;color:${C.dark};font-size:16px;font-weight:700;">Order Total</td>
        <td style="padding:16px 8px 0;color:${C.purple};font-size:16px;font-weight:700;text-align:right;">${formatCents(order.total_cents)}</td>
      </tr>
    </table>
  `;

  return emailLayout(
    `[Admin] New Order ${order.order_number}`,
    `New order ${order.order_number} from ${dispensary.company_name} — ${formatCents(order.total_cents)}, ${groups.length} brand(s).`,
    body,
  );
}

// ---------------------------------------------------------------------------
// Send a single email via Resend (or log in dev)
// ---------------------------------------------------------------------------

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  label: string,
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();

  if (!resend) {
    console.log(`[OrderEmail] (console-only) ${label} -> ${to}`);
    console.log(`  Subject: ${subject}`);
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
      console.error(`[OrderEmail] Resend error (${label}):`, error);
      return { success: false, error: error.message };
    }

    console.log(`[OrderEmail] ${label} sent to ${to}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error(`[OrderEmail] Failed (${label}):`, message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchOrderData(orderId: string): Promise<{
  order: SalesOrderRow;
  dispensary: DispensaryRow;
  items: ReadonlyArray<SalesOrderItemRow>;
  groups: ReadonlyArray<BrandGroup>;
}> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error('Supabase client not available — missing env vars');
  }

  // Fetch the sales order
  const { data: order, error: orderErr } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    throw new Error(`Sales order not found: ${orderId}. ${orderErr?.message ?? ''}`);
  }

  // Fetch the dispensary — try dispensary_id first, fall back to user_id
  let dispensary: DispensaryRow | null = null;
  let dispErr: { message: string } | null = null;

  if (order.dispensary_id) {
    const result = await supabase
      .from('dispensary_accounts')
      .select('*')
      .eq('id', order.dispensary_id)
      .single();
    dispensary = result.data as DispensaryRow | null;
    dispErr = result.error;
  }

  if (!dispensary && order.user_id) {
    const result = await supabase
      .from('dispensary_accounts')
      .select('*')
      .eq('user_id', order.user_id)
      .single();
    dispensary = result.data as DispensaryRow | null;
    dispErr = result.error;
  }

  if (!dispensary) {
    throw new Error(`Dispensary not found for order ${orderId}. ${dispErr?.message ?? ''}`);
  }

  // Fetch all line items
  const { data: items, error: itemsErr } = await supabase
    .from('sales_order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (itemsErr) {
    throw new Error(`Failed to fetch order items: ${itemsErr.message}`);
  }

  if (!items || items.length === 0) {
    throw new Error(`No items found for order ${orderId}`);
  }

  // Collect unique brand IDs
  const brandIds = [...new Set(items.map((i: SalesOrderItemRow) => i.brand_id))];

  // Fetch all brands in one query
  const { data: brands, error: brandsErr } = await supabase
    .from('brands')
    .select('id, name, contact_email, contact_name, logo_url')
    .in('id', brandIds);

  if (brandsErr || !brands) {
    throw new Error(`Failed to fetch brands: ${brandsErr?.message ?? 'no data'}`);
  }

  // Build a lookup map
  const brandMap = new Map<string, BrandRow>();
  for (const b of brands) {
    brandMap.set(b.id, b as BrandRow);
  }

  // Group items by brand
  const groupMap = new Map<string, SalesOrderItemRow[]>();
  for (const item of items as SalesOrderItemRow[]) {
    const existing = groupMap.get(item.brand_id);
    if (existing) {
      existing.push(item);
    } else {
      groupMap.set(item.brand_id, [item]);
    }
  }

  const groups: BrandGroup[] = [];
  for (const [brandId, brandItems] of groupMap) {
    const brand = brandMap.get(brandId);
    if (!brand) {
      console.warn(`[OrderEmail] Brand ${brandId} not found in database — skipping`);
      continue;
    }
    const subtotalCents = brandItems.reduce((sum, i) => sum + i.line_total_cents, 0);
    groups.push({ brand, items: brandItems, subtotalCents });
  }

  return {
    order: order as SalesOrderRow,
    dispensary: dispensary as DispensaryRow,
    items: items as ReadonlyArray<SalesOrderItemRow>,
    groups,
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function sendBrandOrderEmails(orderId: string): Promise<OrderEmailsResult> {
  const { order, dispensary, items, groups } = await fetchOrderData(orderId);

  // 1. Send one email per brand (in parallel)
  const brandResults: BrandEmailResult[] = await Promise.all(
    groups.map(async (group): Promise<BrandEmailResult> => {
      const html = buildBrandOrderHtml(order, dispensary, group);
      const subject = `New Sales Order ${order.order_number} from ${dispensary.company_name}`;
      const result = await sendEmail(
        group.brand.contact_email,
        subject,
        html,
        `brand-order [${group.brand.name}]`,
      );
      return {
        brandId: group.brand.id,
        brandName: group.brand.name,
        success: result.success,
        error: result.error,
      };
    }),
  );

  // 2. Send dispensary confirmation
  const dispHtml = buildDispensaryConfirmationHtml(order, dispensary, groups, items);
  const dispSubject = `Order Submitted - ${order.order_number}`;
  const dispensaryResult = await sendEmail(
    dispensary.email,
    dispSubject,
    dispHtml,
    'dispensary-confirmation',
  );

  // 3. Send admin notification
  const adminHtml = buildAdminNotificationHtml(order, dispensary, groups, items, brandResults);
  const adminSubject = `[New Order] ${order.order_number} - ${dispensary.company_name} - ${formatCents(order.total_cents)}`;
  const adminResult = await sendEmail(
    getAdminEmail(),
    adminSubject,
    adminHtml,
    'admin-notification',
  );

  return { brandResults, dispensaryResult, adminResult };
}
