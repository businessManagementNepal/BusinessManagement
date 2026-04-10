import { LedgerPartyDetailState } from "@/feature/ledger/types/ledger.state.types";

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export const buildLedgerStatementHtml = ({
  state,
  generatedAtLabel,
}: {
  state: LedgerPartyDetailState;
  generatedAtLabel: string;
}): string => {
  const entryRows = state.entryItems
    .map((item) => {
      const toneColor = item.tone === "receive" ? "#166534" : "#b91c1c";
      return `
        <tr>
          <td>${escapeHtml(item.entryTypeLabel)}</td>
          <td>${escapeHtml(item.subtitle)}</td>
          <td style="color:${toneColor}; font-weight:700; text-align:right">${escapeHtml(
            item.amountLabel,
          )}</td>
        </tr>
      `;
    })
    .join("");

  const balanceToneLabel = state.balanceTone === "receive" ? "To Receive" : "To Pay";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ledger Statement - ${escapeHtml(state.partyName)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
    .brand { color:#166534; font-size:22px; font-weight:700; }
    .sub { color:#64748b; font-size:12px; margin-top:4px; }
    .card { border:1px solid #d8dee8; border-radius:10px; padding:12px; margin-bottom:12px; background:#f8fafc; }
    .label { color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
    .value { color:#0f172a; font-size:15px; font-weight:700; margin-top:2px; }
    .grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:16px; }
    table { width:100%; border-collapse:collapse; }
    th, td { border-bottom:1px solid #e2e8f0; padding:10px 8px; font-size:12px; vertical-align:top; }
    th { text-align:left; color:#334155; background:#f8fafc; }
    .footer { margin-top:16px; color:#64748b; font-size:11px; text-align:right; }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <div class="brand">eLekha Ledger Statement</div>
      <div class="sub">Generated ${escapeHtml(generatedAtLabel)}</div>
    </div>
    <div style="text-align:right">
      <div class="label">Party</div>
      <div class="value">${escapeHtml(state.partyName)}</div>
      <div class="sub">${escapeHtml(state.partyPhone ?? "No phone")}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">${balanceToneLabel}</div>
      <div class="value">${escapeHtml(state.balanceLabel)}</div>
    </div>
    <div class="card">
      <div class="label">Due Today</div>
      <div class="value">${escapeHtml(state.dueTodayLabel)}</div>
    </div>
    <div class="card">
      <div class="label">Overdue</div>
      <div class="value">${escapeHtml(state.overdueLabel)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:160px">Action</th>
        <th>Details</th>
        <th style="width:150px; text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${entryRows}
    </tbody>
  </table>
  <div class="footer">eLekha | Ledger party statement</div>
</body>
</html>`;
};

