import {
  BusinessExportBundle,
  DataTransferResult,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { buildCsvExport } from "../builder/csvExport.builder";
import { saveExportFile } from "./exportFile.shared";

export interface ExportCsvUseCase {
  execute(payload: {
    bundle: BusinessExportBundle;
    fileName: string;
  }): Promise<DataTransferResult<{ fileName: string }>>;
}

export const createExportCsvUseCase = (): ExportCsvUseCase => ({
  async execute(payload) {
    const csvContent = buildCsvExport(payload.bundle);
    return saveExportFile({
      fileName: payload.fileName,
      mimeType: "text/csv",
      content: {
        kind: "text",
        value: csvContent,
      },
      dialogTitle: "Export Data",
      uti: "public.comma-separated-values-text",
    });
  },
});
