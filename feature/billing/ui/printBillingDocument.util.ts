import { BillingDocumentFormState } from "@/feature/billing/viewModel/billing.viewModel";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";

const parseNumber = (value: string): number => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildBillingDraftHtml = (
  form: BillingDocumentFormState,
  subtotalAmount: number,
  taxAmount: number,
  totalAmount: number,
  currencyCode: string,
  countryCode: string | null,
): string => {
  const issuedDate = form.issuedAt || new Date().toISOString().slice(0, 10);
  const title = form.documentType === "receipt" ? "RECEIPT" : "INVOICE";
  const itemRows = form.items
    .map((item) => {
      const quantity = parseNumber(item.quantity);
      const unitRate = parseNumber(item.unitRate);
      const lineTotal = quantity * unitRate;
      return `
        <tr>
          <td>${escapeHtml(item.itemName || "-")}</td>
          <td>${quantity}</td>
          <td>${formatCurrencyAmount({ amount: unitRate, currencyCode, countryCode })}</td>
          <td>${formatCurrencyAmount({ amount: lineTotal, currencyCode, countryCode })}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
  .brand { color: #2563eb; font-weight: 700; font-size: 24px; }
  .sub { color: #6b7280; font-size: 12px; }
  .top { display:flex; justify-content:space-between; margin-bottom:20px; }
  table { width:100%; border-collapse: collapse; margin-top:20px; }
  th, td { border-bottom: 1px solid #d1d5db; padding: 8px; text-align:left; font-size:12px; }
  .totals { width: 260px; margin-left:auto; margin-top:16px; font-size:12px; }
  .totals div { display:flex; justify-content:space-between; padding: 3px 0; }
  .total { font-weight:700; color:#2563eb; border-top: 2px solid #2563eb; padding-top:8px; }
  .footer { margin-top: 28px; color: #6b7280; font-size: 11px; text-align: center; }
</style>
</head>
<body>
  <div class="top">
    <div>
      <div class="brand">eLekha</div>
      <div class="sub">Business Management</div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700; font-size:20px;">${title}</div>
      <div class="sub">${escapeHtml(issuedDate)}</div>
    </div>
  </div>
  <div><strong>Bill To:</strong> ${escapeHtml(form.customerName || "Customer")}</div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatCurrencyAmount({ amount: subtotalAmount, currencyCode, countryCode })}</span></div>
    <div><span>Tax (${parseNumber(form.taxRatePercent)}%)</span><span>${formatCurrencyAmount({ amount: taxAmount, currencyCode, countryCode })}</span></div>
    <div class="total"><span>Total</span><span>${formatCurrencyAmount({ amount: totalAmount, currencyCode, countryCode })}</span></div>
  </div>
  <div class="footer">${escapeHtml(form.notes || "Thank you for your business!")}</div>
</body>
</html>`;
};

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};
