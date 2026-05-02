import {
  DataTransferResult,
  ImportFileFormat,
  ImportSettingsDataPayload,
  ParsedImportFile,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { parseCsvImportFile } from "../parser/csvImport.parser";
import { parseExcelImportFile } from "../parser/excelImport.parser";
import { parsePdfImportFile } from "../parser/pdfImport.parser";

export interface ParseImportFileUseCase {
  execute(payload: ImportSettingsDataPayload): Promise<DataTransferResult<ParsedImportFile>>;
}

export const createParseImportFileUseCase = (): ParseImportFileUseCase => ({
  async execute(payload) {
    if (payload.format === ImportFileFormat.Csv) {
      return parseCsvImportFile({
        fileUri: payload.fileUri,
        fileName: payload.fileName,
      });
    }

    if (payload.format === ImportFileFormat.Excel) {
      return parseExcelImportFile({
        fileUri: payload.fileUri,
        fileName: payload.fileName,
      });
    }

    return parsePdfImportFile();
  },
});
