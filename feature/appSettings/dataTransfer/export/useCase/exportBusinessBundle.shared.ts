import {
  BusinessExportBundle,
  BusinessExportColumn,
  SettingsDataTransferBundle,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

const EXCLUDED_COLUMNS = new Set([
  "id",
  "remote_id",
  "deleted_at",
  "sync_status",
  "last_synced_at",
  "owner_user_remote_id",
  "account_remote_id",
  "active_account_remote_id",
  "active_user_remote_id",
]);

const CURATED_COLUMNS_BY_TABLE: Record<string, readonly BusinessExportColumn[]> = {
  products: [
    { key: "name", label: "Product Name" },
    { key: "sku_or_barcode", label: "SKU / Barcode" },
    { key: "category_name", label: "Category" },
    { key: "sale_price", label: "Selling Price" },
    { key: "cost_price", label: "Cost Price" },
    { key: "stock_quantity", label: "Current Stock" },
    { key: "unit_label", label: "Unit" },
    { key: "tax_rate_label", label: "Tax Rate" },
    { key: "description", label: "Description" },
    { key: "status", label: "Status" },
  ],
  contacts: [
    { key: "full_name", label: "Name" },
    { key: "contact_type", label: "Type" },
    { key: "phone_number", label: "Phone" },
    { key: "email_address", label: "Email" },
    { key: "address", label: "Address" },
    { key: "tax_id", label: "Tax ID" },
    { key: "opening_balance_amount", label: "Opening Balance" },
    { key: "opening_balance_direction", label: "Balance Direction" },
    { key: "notes", label: "Notes" },
  ],
  money_accounts: [
    { key: "name", label: "Account Name" },
    { key: "account_type", label: "Type" },
    { key: "current_balance", label: "Current Balance" },
    { key: "currency_code", label: "Currency" },
    { key: "description", label: "Description" },
    { key: "is_primary", label: "Primary" },
    { key: "is_active", label: "Active" },
  ],
  transactions: [
    { key: "title", label: "Title" },
    { key: "transaction_type", label: "Type" },
    { key: "direction", label: "Direction" },
    { key: "amount", label: "Amount" },
    { key: "currency_code", label: "Currency" },
    { key: "category_label", label: "Category" },
    { key: "happened_at", label: "Date" },
    { key: "note", label: "Note" },
  ],
};

const humanizeColumnName = (value: string): string => {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatCellValue = (value: unknown): unknown => {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
};

const buildColumns = (tableName: string, rowKeys: readonly string[]): readonly BusinessExportColumn[] => {
  const curatedColumns = CURATED_COLUMNS_BY_TABLE[tableName];
  if (curatedColumns) {
    return curatedColumns.filter((column) => rowKeys.includes(column.key));
  }

  return rowKeys
    .filter((key) => !EXCLUDED_COLUMNS.has(key))
    .map((key) => ({
      key,
      label: humanizeColumnName(key),
    }));
};

export const buildBusinessExportBundle = (
  bundle: SettingsDataTransferBundle,
): BusinessExportBundle => ({
  title: "eLekha Business Export",
  exportedAt: bundle.exportedAt,
  sheets: bundle.modules.flatMap((moduleItem) =>
    moduleItem.tables.map((table) => {
      const firstRow = table.rows[0] ?? {};
      const rowKeys =
        Object.keys(firstRow).length > 0
          ? Object.keys(firstRow)
          : table.columns.map((column) => column.name);
      const columns = buildColumns(table.tableName, rowKeys);

      return {
        sheetName: humanizeColumnName(table.tableName),
        columns,
        rows: table.rows.map((row) =>
          columns.reduce<Record<string, unknown>>((record, column) => {
            record[column.key] = formatCellValue(row[column.key] ?? "");
            return record;
          }, {}),
        ),
      };
    }),
  ),
});
