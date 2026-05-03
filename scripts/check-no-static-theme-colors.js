const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGETS = [
  "feature/dashboard/business/ui/BusinessDashboardScreen.tsx",
  "feature/dashboard/personal/ui/PersonalDashboardScreen.tsx",
  "feature/dashboard/more/ui/MoreDashboardScreen.tsx",
  "feature/pos/ui/PosScreen.tsx",
  "feature/products/ui/ProductsScreen.tsx",
  "feature/contacts/ui/ContactsScreen.tsx",
  "feature/orders/ui/OrdersScreen.tsx",
  "feature/billing/ui/BillingScreen.tsx",
  "feature/ledger/ui/LedgerScreen.tsx",
  "feature/reports/ui/ReportsScreen.tsx",
  "feature/accounts/ui/MoneyAccountsScreen.tsx",
  "feature/inventory/ui/InventoryScreen.tsx",
  "feature/profile/screen/ui/ProfileScreen.tsx",
  "feature/transactions/ui/TransactionsScreen.tsx",
  "feature/budget/ui/BudgetScreen.tsx",
  "feature/budget/ui/components/BudgetEditorModal.tsx",
  "feature/budget/ui/components/BudgetDetailModal.tsx",
  "feature/budget/ui/components/BudgetMonthPickerField.tsx",
  "feature/dashboard/shared/ui/DashboardTabScaffold.tsx",
  "feature/dashboard/shell/ui/DashboardShellLayout.tsx",
  "feature/reports/ui/components/ReportCards.tsx",
  "feature/reports/ui/components/ReportExportActionRow.tsx",
  "feature/profile/screen/ui/sections/AccountSwitchSection.tsx",
  "feature/profile/screen/ui/sections/BusinessProfileSection.tsx",
  "feature/profile/screen/ui/sections/CreateBusinessProfileSection.tsx",
  "feature/profile/screen/ui/sections/PersonalProfileSection.tsx",
  "feature/profile/screen/ui/sections/ProfileField.tsx",
  "shared/components/reusable/Cards/StatCard.tsx",
  "shared/components/reusable/Cards/SummaryCard.tsx",
  "shared/components/reusable/Charts/FinancialCharts.tsx",
  "shared/components/reusable/DropDown/DropdownButton.tsx",
  "shared/components/reusable/List/ListRow.tsx",
  "shared/components/reusable/Modals/ConfirmDeleteModal.tsx",
  "shared/components/reusable/ScreenLayouts/InlineSectionHeader.tsx",
  "shared/components/reusable/Tables/TransactionTable.tsx",
];

const STATIC_COLOR_IMPORT_PATTERN =
  /from\s+["'][^"']*theme\/colors["'];?/;

const offenders = TARGETS.filter((relativePath) => {
  const absolutePath = path.join(ROOT, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  return STATIC_COLOR_IMPORT_PATTERN.test(source);
});

if (offenders.length > 0) {
  console.error("Static theme color imports are not allowed in migrated UI files:");
  offenders.forEach((offender) => {
    console.error(`- ${offender}`);
  });
  process.exit(1);
}

console.log("No static theme color imports found in migrated UI files.");
