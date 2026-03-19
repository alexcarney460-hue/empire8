import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';
import { requireAdmin } from '@/lib/admin/requireAdmin';

/**
 * GET /api/shipping/label-pdf?url=<shippo_label_url>&rotate=90
 *
 * Fetches a Shippo label PDF and optionally rotates it so it prints
 * correctly on a 4x6 thermal printer without manual rotation.
 *
 * Shippo PDF_4x6 labels are 4" wide x 6" tall (portrait).
 * Most thermal printers expect landscape orientation (6" wide x 4" tall).
 * This endpoint rotates the PDF 90° clockwise and adjusts the page size
 * so it prints perfectly on first try.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const url = req.nextUrl.searchParams.get('url');
  const rotateDeg = parseInt(req.nextUrl.searchParams.get('rotate') || '90', 10);

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow Shippo URLs for security
  if (!url.includes('shippo') && !url.includes('goshippo')) {
    return NextResponse.json({ error: 'Only Shippo label URLs are allowed' }, { status: 400 });
  }

  try {
    // Fetch the original PDF from Shippo
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch label: ${response.status}` },
        { status: 502 },
      );
    }

    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      return NextResponse.json({ error: 'PDF has no pages' }, { status: 422 });
    }

    // Rotate each page and swap dimensions
    for (const page of pages) {
      const { width, height } = page.getSize();

      if (rotateDeg === 90) {
        // Rotate 90° CW: swap width/height, set rotation
        page.setRotation(degrees(page.getRotation().angle + 90));
        page.setSize(height, width);
      } else if (rotateDeg === -90 || rotateDeg === 270) {
        page.setRotation(degrees(page.getRotation().angle - 90));
        page.setSize(height, width);
      } else if (rotateDeg === 180) {
        page.setRotation(degrees(page.getRotation().angle + 180));
        // No dimension swap for 180°
      }
      // 0 = no rotation
    }

    const rotatedBytes = await pdfDoc.save();
    const buffer = Buffer.from(rotatedBytes);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="shipping-label.pdf"',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF processing failed';
    console.error('[Label PDF] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
