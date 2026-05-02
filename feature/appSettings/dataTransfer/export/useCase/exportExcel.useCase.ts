import {
  BusinessExportBundle,
  DataTransferResult,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { buildExcelExportBase64 } from "../builder/excelExport.builder";
import { saveExportFile } from "./exportFile.shared";

export interface ExportExcelUseCase {
  execute(payload: {
    bundle: BusinessExportBundle;
    fileName: string;
  }): Promise<DataTransferResult<{ fileName: string }>>;
}

export const createExportExcelUseCase = (): ExportExcelUseCase => ({
  async execute(payload) {
    const base64Content = buildExcelExportBase64(payload.bundle);
    return saveExportFile({
      fileName: payload.fileName,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      content: {
        kind: "base64",
        value: base64Content,
      },
      dialogTitle: "Export Data",
      uti: "org.openxmlformats.spreadsheetml.sheet",
    });
  },
});
