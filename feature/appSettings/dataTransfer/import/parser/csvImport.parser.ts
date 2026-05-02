import * as FileSystem from "expo-file-system/legacy";
import {
  DataTransferResult,
  DataTransferValidationError,
  ImportFileFormat,
  ParsedImportFile,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import {
  buildParsedRowsFromMatrix,
  parseDelimitedText,
} from "./importParser.shared";

export const parseCsvImportFile = async (payload: {
  fileUri: string;
  fileName: string;
}): Promise<DataTransferResult<ParsedImportFile>> => {
  try {
    const fileText = await FileSystem.readAsStringAsync(payload.fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const matrix = parseDelimitedText(fileText);
    if (matrix.length === 0) {
      return {
        success: false,
        error: DataTransferValidationError("The selected CSV file is empty."),
      };
    }

    const rows = buildParsedRowsFromMatrix(matrix);
    if (rows.length === 0) {
      return {
        success: false,
        error: DataTransferValidationError(
          "The selected CSV file does not contain importable rows.",
        ),
      };
    }

    return {
      success: true,
      value: {
        format: ImportFileFormat.Csv,
        fileName: payload.fileName,
        sheets: [
          {
            sheetName: "Sheet1",
            rows,
          },
        ],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: DataTransferValidationError(
        error instanceof Error
          ? error.message
          : "Unable to parse the selected CSV file.",
      ),
    };
  }
};
