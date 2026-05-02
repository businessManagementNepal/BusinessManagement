import { Platform } from "react-native";
import { exportDocument } from "@/shared/utils/document/exportDocument";
import {
  BusinessExportBundle,
  DataTransferResult,
  DataTransferValidationError,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { buildPdfExportHtml } from "../builder/pdfExportHtml.builder";

export interface ExportPdfUseCase {
  execute(payload: {
    bundle: BusinessExportBundle;
    fileName: string;
  }): Promise<DataTransferResult<{ fileName: string }>>;
}

export const createExportPdfUseCase = (): ExportPdfUseCase => ({
  async execute(payload) {
    const exportResult = await exportDocument({
      html: buildPdfExportHtml(payload.bundle),
      fileName: payload.fileName.replace(/\.pdf$/i, ""),
      title: "Export Data",
      action: Platform.OS === "web" ? "print" : "share",
    });

    if (!exportResult.success) {
      return {
        success: false,
        error: DataTransferValidationError(exportResult.error),
      };
    }

    return {
      success: true,
      value: {
        fileName: payload.fileName,
      },
    };
  },
});
