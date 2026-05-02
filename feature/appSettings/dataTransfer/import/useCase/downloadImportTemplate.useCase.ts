import {
  DataTransferResult,
  DataTransferValidationError,
  ImportFileFormat,
  ImportFileFormatValue,
  SettingsDataTransferModule,
  SettingsDataTransferModuleValue,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { buildCsvExport } from "../../export/builder/csvExport.builder";
import { buildExcelExportBase64 } from "../../export/builder/excelExport.builder";
import { saveExportFile } from "../../export/useCase/exportFile.shared";

const buildTemplateBundle = (
  moduleId: SettingsDataTransferModuleValue,
): import("@/feature/appSettings/dataTransfer/types/dataTransfer.types").BusinessExportBundle => {
  if (moduleId === SettingsDataTransferModule.Products) {
    return {
      title: "Products Import Template",
      exportedAt: Date.now(),
      sheets: [
        {
          sheetName: "Products",
          columns: [
            { key: "name", label: "name" },
            { key: "sku", label: "sku" },
            { key: "category", label: "category" },
            { key: "selling_price", label: "selling_price" },
            { key: "cost_price", label: "cost_price" },
            { key: "opening_stock", label: "opening_stock" },
            { key: "unit", label: "unit" },
          ],
          rows: [
            {
              name: "Notebook",
              sku: "NB001",
              category: "Stationery",
              selling_price: 120,
              cost_price: 80,
              opening_stock: 20,
              unit: "piece",
            },
          ],
        },
      ],
    };
  }

  if (moduleId === SettingsDataTransferModule.Contacts) {
    return {
      title: "Contacts Import Template",
      exportedAt: Date.now(),
      sheets: [
        {
          sheetName: "Contacts",
          columns: [
            { key: "name", label: "name" },
            { key: "contact_type", label: "contact_type" },
            { key: "phone", label: "phone" },
            { key: "email", label: "email" },
            { key: "address", label: "address" },
            { key: "opening_balance", label: "opening_balance" },
            {
              key: "opening_balance_direction",
              label: "opening_balance_direction",
            },
          ],
          rows: [
            {
              name: "Aarav Suppliers",
              contact_type: "supplier",
              phone: "+9779800000000",
              email: "aarav@example.com",
              address: "Kathmandu",
              opening_balance: 0,
              opening_balance_direction: "",
            },
          ],
        },
      ],
    };
  }

  return {
    title: "Money Accounts Import Template",
    exportedAt: Date.now(),
    sheets: [
      {
        sheetName: "Money Accounts",
        columns: [
          { key: "name", label: "name" },
          { key: "account_type", label: "account_type" },
          { key: "opening_balance", label: "opening_balance" },
          { key: "currency_code", label: "currency_code" },
          { key: "is_primary", label: "is_primary" },
        ],
        rows: [
          {
            name: "Main Cash",
            account_type: "cash",
            opening_balance: 5000,
            currency_code: "NPR",
            is_primary: "true",
          },
        ],
      },
    ],
  };
};

export interface DownloadImportTemplateUseCase {
  execute(payload: {
    moduleId: SettingsDataTransferModuleValue;
    format?: ImportFileFormatValue;
  }): Promise<DataTransferResult<{ fileName: string }>>;
}

export const createDownloadImportTemplateUseCase =
  (): DownloadImportTemplateUseCase => ({
    async execute(payload) {
      const templateBundle = buildTemplateBundle(payload.moduleId);
      const normalizedFormat =
        payload.format === ImportFileFormat.Excel
          ? ImportFileFormat.Excel
          : ImportFileFormat.Csv;
      const fileName = `elekha-import-template-${payload.moduleId}.${normalizedFormat}`;

      if (normalizedFormat === ImportFileFormat.Excel) {
        return saveExportFile({
          fileName,
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          content: {
            kind: "base64",
            value: buildExcelExportBase64(templateBundle),
          },
          dialogTitle: "Download Import Template",
          uti: "org.openxmlformats.spreadsheetml.sheet",
        });
      }

      if (normalizedFormat !== ImportFileFormat.Csv) {
        return {
          success: false,
          error: DataTransferValidationError(
            "Templates can only be downloaded as CSV or Excel files.",
          ),
        };
      }

      return saveExportFile({
        fileName,
        mimeType: "text/csv",
        content: {
          kind: "text",
          value: buildCsvExport(templateBundle),
        },
        dialogTitle: "Download Import Template",
        uti: "public.comma-separated-values-text",
      });
    },
  });
