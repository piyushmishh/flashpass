/**
 * PDF service — generates a self-contained HTML ticket page.
 *
 * Since we can't rely on native PDF libraries in all environments, we
 * produce a richly styled HTML page that:
 *   - Looks like a physical ticket (dark theme matching the FlashPass app)
 *   - Contains all order + event details
 *   - Renders a QR code inline via the qrcode.js CDN library
 *   - Includes the HMAC signature for manual verification
 *   - Is fully self-contained (inline CSS, no external stylesheets)
 *   - Can be printed to PDF via the browser's native Print → Save as PDF
 */

import { Order, Event } from '../types';

export const pdfService = {
  /**
   * Generate a complete, self-contained HTML page styled as a ticket.
   *
   * @param order   - The confirmed order
   * @param event   - The event details
   * @param qrPayload - The JSON string to encode into the QR code
   */
  generateTicketHTML(order: Order, event: Event, qrPayload: string): string {
    const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const eventTime = new Date(event.event_date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const totalPrice = (order.total_price_cents / 100).toFixed(2);

    // Extract the signature from the QR payload for display
    let signature = '';
    try {
      const parsed = JSON.parse(qrPayload);
      signature = parsed.sig || '';
    } catch {
      signature = 'N/A';
    }

    // Escape the QR payload for safe embedding in a JS string literal
    const escapedPayload = qrPayload
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlashPass Ticket — ${event.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .ticket {
      background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border: 2px solid #e94560;
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(233, 69, 96, 0.15),
                  0 0 0 1px rgba(233, 69, 96, 0.1);
    }
    .ticket-header {
      background: linear-gradient(135deg, #e94560 0%, #c62a47 100%);
      padding: 24px;
      text-align: center;
    }
    .ticket-header .brand {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.8);
      margin-bottom: 8px;
    }
    .ticket-header .event-title {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      line-height: 1.3;
    }
    .ticket-body {
      padding: 24px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #888;
      font-weight: 600;
    }
    .detail-value {
      font-size: 15px;
      color: #fff;
      font-weight: 500;
      text-align: right;
    }
    .divider {
      border: none;
      border-top: 2px dashed rgba(255,255,255,0.1);
      margin: 0 24px;
    }
    .qr-section {
      padding: 24px;
      text-align: center;
    }
    .qr-section .qr-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #888;
      margin-bottom: 16px;
    }
    #qr-canvas {
      background: #fff;
      padding: 12px;
      border-radius: 8px;
      display: inline-block;
    }
    .ticket-footer {
      padding: 16px 24px;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .signature {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      color: #555;
      word-break: break-all;
      line-height: 1.6;
    }
    .signature-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #666;
      margin-bottom: 4px;
    }
    @media print {
      body { background: #fff; }
      .ticket {
        box-shadow: none;
        border-color: #333;
      }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <div class="brand">⚡ FlashPass</div>
      <div class="event-title">${escapeHtml(event.title)}</div>
    </div>

    <div class="ticket-body">
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">${escapeHtml(event.venue || 'TBA')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${eventDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${eventTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Order ID</span>
        <span class="detail-value" style="font-family: monospace; font-size: 12px;">${order.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Quantity</span>
        <span class="detail-value">${order.quantity} ticket${order.quantity > 1 ? 's' : ''}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Total</span>
        <span class="detail-value" style="color: #e94560; font-weight: 700;">$${totalPrice}</span>
      </div>
    </div>

    <hr class="divider" />

    <div class="qr-section">
      <div class="qr-label">Scan for Entry</div>
      <div id="qr-canvas"></div>
    </div>

    <div class="ticket-footer">
      <div class="signature-label">HMAC Signature</div>
      <div class="signature">${signature}</div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var payload = '${escapedPayload}';
      var container = document.getElementById('qr-canvas');
      if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
        var canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, payload, {
          width: 200,
          margin: 0,
          color: { dark: '#1a1a2e', light: '#ffffff' }
        }, function(err) {
          if (!err) container.appendChild(canvas);
          else container.textContent = 'QR generation failed';
        });
      } else {
        container.textContent = 'QR library unavailable';
      }
    });
  </script>
</body>
</html>`;
  },
};

/** Escape HTML special characters to prevent XSS in generated tickets. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
