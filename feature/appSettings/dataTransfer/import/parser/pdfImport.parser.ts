import {
  DataTransferResult,
  DataTransferValidationError,
  ParsedImportFile,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

export const parsePdfImportFile = async (): Promise<
  DataTransferResult<ParsedImportFile>
> => {
  return {
    success: false,
    error: DataTransferValidationError(
      "PDF import is only supported for strict eLekha import templates. Arbitrary PDFs cannot be imported into business records.",
    ),
  };
};
