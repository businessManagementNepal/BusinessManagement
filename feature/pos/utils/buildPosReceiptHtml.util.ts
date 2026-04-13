import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { PosReceipt } from "../types/pos.entity.types";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const buildPosReceiptHtml = (
  receipt: PosReceipt,
  currencyCode: string,
  countryCode: string | null,
): string => {
  const issuedAtLabel = new Date(receipt.issuedAt).toLocaleString();

  const customerSection = receipt.customerName
    ? `
      <div class="section">
        <div class="section-title">Customer</div>
        <div class="value strong">${escapeHtml(receipt.customerName)}</div>
        ${
          receipt.customerPhone
            ? `<div class="muted">${escapeHtml(receipt.customerPhone)}</div>`
            : ""
        }
      </div>
    `
    : "";

  const lineRows = receipt.lines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.productName)}</td>
          <td>${line.quantity}</td>
          <td>${formatCurrencyAmount({
            amount: line.unitPrice,
            currencyCode,
            countryCode,
          })}</td>
          <td>${formatCurrencyAmount({
            amount: line.lineSubtotal,
            currencyCode,
            countryCode,
          })}</td>
        </tr>
      `,
    )
    .join("");

  const dueMessage =
    receipt.ledgerEffect.type === "due_balance_created"
      ? `
        <div class="notice success">
          Ledger due created for
          ${formatCurrencyAmount({
            amount: receipt.ledgerEffect.dueAmount,
            currencyCode,
            countryCode,
          })}.
        </div>
      `
      : receipt.ledgerEffect.type === "due_balance_create_failed"
        ? `
        <div class="notice warning">
          Sale completed, but due posting failed. Add ledger entry manually for
          ${formatCurrencyAmount({
            amount: receipt.ledgerEffect.dueAmount,
            currencyCode,
            countryCode,
          })}.
        </div>
      `
        : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>POS Receipt ${escapeHtml(receipt.receiptNumber)}</title>
<style>
  body {
    font-family: Arial, sans-serif;
    padding: 24px;
    color: #1f2937;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  .brand {
    color: #166534;
    font-size: 24px;
    font-weight: 700;
  }
  .sub {
    color: #6b7280;
    font-size: 12px;
  }
  .section {
    margin-bottom: 16px;
    padding: 10px 12px;
    background: #f5f7f6;
    border-radius: 8px;
  }
  .section-title {
    color: #6b7280;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .value {
    font-size: 14px;
  }
  .strong {
    font-weight: 700;
  }
  .muted {
    color: #6b7280;
    font-size: 12px;
    margin-top: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }
  th, td {
    border-bottom: 1px solid #d1d5db;
    padding: 8px;
    text-align: left;
    font-size: 12px;
  }
  .totals {
    width: 280px;
    margin-left: auto;
    margin-top: 18px;
  }
  .totals div {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 12px;
  }
  .grand {
    border-top: 2px solid #166534;
    margin-top: 8px;
    padding-top: 8px;
    font-weight: 700;
    color: #166534;
    font-size: 14px;
  }
  .notice {
    margin-top: 16px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.5;
  }
  .notice.success {
    background: #ecfdf5;
    color: #166534;
  }
  .notice.warning {
    background: #fff7ed;
    color: #9a3412;
  }
  .footer {
    margin-top: 24px;
    text-align: center;
    color: #6b7280;
    font-size: 11px;
  }
</style>
</head>
<body>
  <div class="top">
    <div>
      <div class="brand">eLekha</div>
      <div class="sub">POS Receipt</div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700; font-size:18px;">${escapeHtml(receipt.receiptNumber)}</div>
      <div class="sub">${escapeHtml(issuedAtLabel)}</div>
    </div>
  </div>

  ${customerSection}

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Gross</span><span>${formatCurrencyAmount({ amount: receipt.totals.gross, currencyCode, countryCode })}</span></div>
    <div><span>Discount</span><span>${formatCurrencyAmount({ amount: receipt.totals.discountAmount, currencyCode, countryCode })}</span></div>
    <div><span>Surcharge</span><span>${formatCurrencyAmount({ amount: receipt.totals.surchargeAmount, currencyCode, countryCode })}</span></div>
    <div><span>Tax</span><span>${formatCurrencyAmount({ amount: receipt.totals.taxAmount, currencyCode, countryCode })}</span></div>
    <div><span>Paid</span><span>${formatCurrencyAmount({ amount: receipt.paidAmount, currencyCode, countryCode })}</span></div>
    <div><span>Due</span><span>${formatCurrencyAmount({ amount: receipt.dueAmount, currencyCode, countryCode })}</span></div>
    <div class="grand"><span>Grand Total</span><span>${formatCurrencyAmount({ amount: receipt.totals.grandTotal, currencyCode, countryCode })}</span></div>
  </div>

  ${dueMessage}

  <div class="footer">Thank you for your business.</div>
</body>
</html>`;
};
