import * as DocumentPicker from "expo-document-picker";
import {
  DataTransferResult,
  DataTransferValidationError,
  ImportFileFormat,
  PickedImportFile,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const resolveFormatFromAsset = (
  asset: Pick<DocumentPicker.DocumentPickerAsset, "mimeType" | "name">,
): PickedImportFile["format"] | null => {
  const normalizedName = asset.name.trim().toLowerCase();
  if (normalizedName.endsWith(".csv")) {
    return ImportFileFormat.Csv;
  }

  if (normalizedName.endsWith(".xlsx") || normalizedName.endsWith(".xls")) {
    return ImportFileFormat.Excel;
  }

  if (normalizedName.endsWith(".pdf")) {
    return ImportFileFormat.Pdf;
  }

  const normalizedMimeType = asset.mimeType?.trim().toLowerCase() ?? "";
  if (normalizedMimeType.includes("csv")) {
    return ImportFileFormat.Csv;
  }

  if (
    normalizedMimeType.includes("spreadsheet") ||
    normalizedMimeType.includes("excel")
  ) {
    return ImportFileFormat.Excel;
  }

  if (normalizedMimeType === "application/pdf") {
    return ImportFileFormat.Pdf;
  }

  return null;
};

export interface PickImportFileUseCase {
  execute(): Promise<DataTransferResult<PickedImportFile | null>>;
}

export const createPickImportFileUseCase = (): PickImportFileUseCase => ({
  async execute() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/pdf",
        ],
      });

      if (result.canceled || result.assets.length === 0) {
        return {
          success: true,
          value: null,
        };
      }

      const [asset] = result.assets;
      const format = resolveFormatFromAsset(asset);
      if (!format) {
        return {
          success: false,
          error: DataTransferValidationError(
            "Only CSV, Excel, and PDF files can be imported.",
          ),
        };
      }

      if (asset.size !== null && asset.size !== undefined && asset.size <= 0) {
        return {
          success: false,
          error: DataTransferValidationError(
            "The selected import file is empty.",
          ),
        };
      }

      if (
        asset.size !== null &&
        asset.size !== undefined &&
        asset.size > MAX_IMPORT_FILE_SIZE_BYTES
      ) {
        return {
          success: false,
          error: DataTransferValidationError(
            "The selected import file is too large. The current limit is 10 MB.",
          ),
        };
      }

      return {
        success: true,
        value: {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? null,
          size: asset.size ?? null,
          format,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: DataTransferValidationError(
          error instanceof Error
            ? error.message
            : "Unable to select an import file.",
        ),
      };
    }
  },
});
