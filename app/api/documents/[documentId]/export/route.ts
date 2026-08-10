import { toErrorResponse } from "@/lib/api/errors";
import { requireUserFromRequest } from "@/lib/auth-route";
import { calculateLineItem } from "@/lib/calculations";
import { getDocument } from "@/lib/documents/service";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireUserFromRequest(request);
    const { documentId } = await context.params;
    const document = await getDocument(user.id, documentId);

    const url = new URL(request.url);
    const shouldAutoPrint = url.searchParams.get("print") === "true";

    const lineItemsHtml = document.lineItems
      .map((item, index) => {
        let calc = null;
        try {
          const discountInput =
            item.discount?.type === "fixed"
              ? { type: "fixed" as const, value: item.discount.amountCents / 100 }
              : item.discount?.type === "percent"
                ? { type: "percent" as const, value: item.discount.percentage }
                : null;

          calc = calculateLineItem({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            discount: discountInput,
            taxPercent: item.taxPercent ?? null,
          });
        } catch {
          // ignore calculation errors in template
        }

        const subtotal = calc ? formatMoney(calc.subtotalCents) : "—";
        const discount =
          calc && calc.discountAmountCents > 0
            ? `-${formatMoney(calc.discountAmountCents)}`
            : "—";
        const tax =
          calc && calc.taxAmountCents > 0 ? `+${formatMoney(calc.taxAmountCents)}` : "—";
        const lineTotal = calc ? formatMoney(calc.lineTotalCents) : "—";

        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${index + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${item.description}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(item.unitPriceCents)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${subtotal}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #d97706;">${discount}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #2563eb;">${tax}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">${lineTotal}</td>
          </tr>
        `;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title} - Printable Document</title>
  <style>
    @media print {
      @page { margin: 1.5cm; size: auto; }
      body { background: #fff !important; color: #000 !important; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 6px 0;
      color: #0f172a;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: ${document.status === "finalized" ? "#dcfce7" : "#fef3c7"};
      color: ${document.status === "finalized" ? "#166534" : "#92400e"};
      border: 1px solid ${document.status === "finalized" ? "#86efac" : "#fde68a"};
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
    }
    .meta-item label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .meta-item value {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 30px;
    }
    th {
      background: #f1f5f9;
      padding: 10px;
      text-align: left;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    .totals-box {
      width: 280px;
      font-size: 13px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      color: #475569;
    }
    .totals-row.grand-total {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      margin-top: 6px;
    }
    .actions {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      display: inline-block;
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-primary { background: #f97316; color: #ffffff; }
    .btn-secondary { background: #e2e8f0; color: #0f172a; }
  </style>
</head>
<body>
  <div class="actions no-print">
    <a href="/documents/${document.id}" class="btn btn-secondary">← Back to Workspace</a>
    <button onclick="window.print()" class="btn btn-primary">🖨️ Print / Save PDF</button>
  </div>

  <div class="container">
    <div class="header">
      <div>
        <div class="subtitle">PRICING DOCUMENT & PROPOSAL</div>
        <h1 class="title">${document.title}</h1>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ID: ${document.id}</div>
      </div>
      <div>
        <span class="badge">${document.status === "finalized" ? "FINALIZED 🔒" : "DRAFT"}</span>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <label>Customer</label>
        <value>${document.customer}</value>
      </div>
      <div class="meta-item">
        <label>Issue Date</label>
        <value>${document.issueDate}</value>
      </div>
      <div class="meta-item">
        <label>Line Items</label>
        <value>${document.lineItems.length} item(s)</value>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th style="text-align: right;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Subtotal</th>
          <th style="text-align: right;">Discount</th>
          <th style="text-align: right;">Tax</th>
          <th style="text-align: right;">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatMoney(document.totals.subtotalCents)}</span>
        </div>
        <div class="totals-row" style="color: #d97706;">
          <span>Total Discount:</span>
          <span>-${formatMoney(document.totals.totalDiscountCents)}</span>
        </div>
        <div class="totals-row" style="color: #2563eb;">
          <span>Total Tax:</span>
          <span>+${formatMoney(document.totals.totalTaxCents)}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Grand Total:</span>
          <span>${formatMoney(document.totals.grandTotalCents)}</span>
        </div>
      </div>
    </div>
  </div>

  ${shouldAutoPrint ? "<script>window.addEventListener('load', () => window.print());</script>" : ""}
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
