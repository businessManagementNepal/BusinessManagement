import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import {
  DataTransferResult,
  DataTransferValidationError,
  ImportFileFormat,
  ParsedImportFile,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { buildParsedRowsFromMatrix } from "./importParser.shared";

const toRowMatrix = (
  sheet: XLSX.WorkSheet,
): readonly (readonly unknown[])[] => {
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: false,
  }) as readonly (readonly unknown[])[];
};

export const parseExcelImportFile = async (payload: {
  fileUri: string;
  fileName: string;
}): Promise<DataTransferResult<ParsedImportFile>> => {
  try {
    const base64Content = await FileSystem.readAsStringAsync(payload.fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const workbook = XLSX.read(base64Content, { type: "base64" });
    const sheets = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const matrix = worksheet ? toRowMatrix(worksheet) : [];
      return {
        sheetName,
        rows: buildParsedRowsFromMatrix(matrix),
      };
    }).filter((sheet) => sheet.rows.length > 0);

    if (sheets.length === 0) {
      return {
        success: false,
        error: DataTransferValidationError(
          "The selected Excel file does not contain importable rows.",
        ),
      };
    }

    return {
      success: true,
      value: {
        format: ImportFileFormat.Excel,
        fileName: payload.fileName,
        sheets,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: DataTransferValidationError(
        error instanceof Error
          ? error.message
          : "Unable to parse the selected Excel file.",
      ),
    };
  }
};
