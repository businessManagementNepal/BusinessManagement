import {
  AccountType,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import { GetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase";
import { ImportAuditRepository } from "@/feature/appSettings/dataTransfer/import/audit/data/repository/importAudit.repository";
import {
  IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES,
  ImportMode,
  ImportPreviewResult,
  ImportWarning,
  PreviewImportDataPayload,
  SettingsDataTransferModule,
  DataTransferResult,
  DataTransferValidationError,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { ParseImportFileUseCase } from "./parseImportFile.useCase";
import { validateProductImportRow } from "../validator/productImport.validator";
import { validateContactImportRow } from "../validator/contactImport.validator";
import { validateMoneyAccountImportRow } from "../validator/moneyAccountImport.validator";
import { normalizePhoneForIdentity } from "@/feature/contacts/shared/contactPhoneIdentity.shared";

type SensitiveAccessGuard = () => string | null;

type CreatePreviewImportDataUseCaseParams = {
  parseImportFileUseCase: ParseImportFileUseCase;
  importAuditRepository: ImportAuditRepository;
  getProductsUseCase: GetProductsUseCase;
  getContactsUseCase: GetContactsUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  ensureSensitiveAccess: SensitiveAccessGuard;
};

export interface PreviewImportDataUseCase {
  execute(
    payload: PreviewImportDataPayload,
  ): Promise<DataTransferResult<ImportPreviewResult>>;
}

const isSupportedAccountType = (value: string): value is AccountTypeValue => {
  return value === AccountType.Business || value === AccountType.Personal;
};

const isImportableModule = (value: string): boolean => {
  return IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES.includes(
    value as (typeof IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES)[number],
  );
};

export const createPreviewImportDataUseCase = ({
  parseImportFileUseCase,
  importAuditRepository,
  getProductsUseCase,
  getContactsUseCase,
  getMoneyAccountsUseCase,
  ensureSensitiveAccess,
}: CreatePreviewImportDataUseCaseParams): PreviewImportDataUseCase => ({
  async execute(payload) {
    const sensitiveAccessMessage = ensureSensitiveAccess();
    if (sensitiveAccessMessage) {
      return {
        success: false,
        error: DataTransferValidationError(sensitiveAccessMessage),
      };
    }

    const activeUserRemoteId = payload.activeUserRemoteId.trim();
    const activeAccountRemoteId = payload.activeAccountRemoteId.trim();

    if (!activeUserRemoteId) {
      return {
        success: false,
        error: DataTransferValidationError("An active user is required to import data."),
      };
    }

    if (!activeAccountRemoteId) {
      return {
        success: false,
        error: DataTransferValidationError(
          "An active account is required to import data.",
        ),
      };
    }

    if (!isSupportedAccountType(payload.activeAccountType)) {
      return {
        success: false,
        error: DataTransferValidationError("The active account type is invalid."),
      };
    }

    if (!isImportableModule(payload.moduleId)) {
      return {
        success: false,
        error: DataTransferValidationError(
          "This module is not available for safe import yet.",
        ),
      };
    }

    const parseResult = await parseImportFileUseCase.execute(payload);
    if (!parseResult.success) {
      return parseResult;
    }

    const warnings: ImportWarning[] = [];
    if (parseResult.value.sheets.length > 1) {
      warnings.push({
        code: "multiple_sheets",
        message:
          "Multiple sheets were detected. All non-empty sheets will be previewed in order.",
      });
    }

    if (payload.moduleId === SettingsDataTransferModule.Products) {
      const existingProductsResult = await getProductsUseCase.execute(
        activeAccountRemoteId,
      );
      if (!existingProductsResult.success) {
        return {
          success: false,
          error: DataTransferValidationError(existingProductsResult.error.message),
        };
      }

      const existingSkuValues = new Set(
        existingProductsResult.value
          .map((product) => product.skuOrBarcode?.trim().toLowerCase() ?? null)
          .filter((value): value is string => Boolean(value)),
      );
      const seenSkuValues = new Set<string>();
      let rowNumber = 1;
      const rowResults = parseResult.value.sheets.flatMap((sheet) =>
        sheet.rows.map((row) =>
          validateProductImportRow(rowNumber++, row, {
            existingSkuValues,
            seenSkuValues,
          }),
        ),
      );

      const validRows = rowResults.filter(
        (row) => row.status === "valid" || row.status === "warning",
      ).length;
      const duplicateRows = rowResults.filter((row) => row.status === "duplicate").length;
      const invalidRows = rowResults.filter((row) => row.status === "invalid").length;

      const auditResult = await importAuditRepository.createImportPreviewJob({
        input: payload,
        importMode: ImportMode.SkipInvalid,
        totalRows: rowResults.length,
        validRows,
        invalidRows,
        duplicateRows,
        rowResults,
      });
      if (!auditResult.success) {
        return auditResult;
      }

      return {
        success: true,
        value: {
          importJobRemoteId: auditResult.value.job.remoteId,
          moduleId: payload.moduleId,
          fileName: payload.fileName,
          totalRows: rowResults.length,
          validRows,
          invalidRows,
          duplicateRows,
          warnings,
          rowResults,
        },
      };
    }

    if (payload.moduleId === SettingsDataTransferModule.Contacts) {
      const existingContactsResult = await getContactsUseCase.execute({
        accountRemoteId: activeAccountRemoteId,
      });
      if (!existingContactsResult.success) {
        return {
          success: false,
          error: DataTransferValidationError(existingContactsResult.error.message),
        };
      }

      const existingPhoneValues = new Set(
        existingContactsResult.value
          .map((contact) => normalizePhoneForIdentity(contact.phoneNumber))
          .filter((value): value is string => value !== null),
      );
      const existingEmailValues = new Set(
        existingContactsResult.value
          .map((contact) => contact.emailAddress?.trim().toLowerCase() ?? null)
          .filter((value): value is string => value !== null),
      );
      const seenPhoneValues = new Set<string>();
      const seenEmailValues = new Set<string>();
      let rowNumber = 1;
      const rowResults = parseResult.value.sheets.flatMap((sheet) =>
        sheet.rows.map((row) =>
          validateContactImportRow(rowNumber++, row, {
            activeAccountType: payload.activeAccountType,
            existingPhoneValues,
            existingEmailValues,
            seenPhoneValues,
            seenEmailValues,
          }),
        ),
      );

      const validRows = rowResults.filter(
        (row) => row.status === "valid" || row.status === "warning",
      ).length;
      const duplicateRows = rowResults.filter((row) => row.status === "duplicate").length;
      const invalidRows = rowResults.filter((row) => row.status === "invalid").length;

      const auditResult = await importAuditRepository.createImportPreviewJob({
        input: payload,
        importMode: ImportMode.SkipInvalid,
        totalRows: rowResults.length,
        validRows,
        invalidRows,
        duplicateRows,
        rowResults,
      });
      if (!auditResult.success) {
        return auditResult;
      }

      return {
        success: true,
        value: {
          importJobRemoteId: auditResult.value.job.remoteId,
          moduleId: payload.moduleId,
          fileName: payload.fileName,
          totalRows: rowResults.length,
          validRows,
          invalidRows,
          duplicateRows,
          warnings,
          rowResults,
        },
      };
    }

    const existingMoneyAccountsResult =
      await getMoneyAccountsUseCase.execute(activeAccountRemoteId);
    if (!existingMoneyAccountsResult.success) {
      return {
        success: false,
        error: DataTransferValidationError(existingMoneyAccountsResult.error.message),
      };
    }

    const existingNames = new Set(
      existingMoneyAccountsResult.value.map((account) =>
        account.name.trim().toLowerCase(),
      ),
    );
    const seenNames = new Set<string>();
    let rowNumber = 1;
    const rowResults = parseResult.value.sheets.flatMap((sheet) =>
      sheet.rows.map((row) =>
        validateMoneyAccountImportRow(rowNumber++, row, {
          existingNames,
          seenNames,
        }),
      ),
    );

    const validRows = rowResults.filter(
      (row) => row.status === "valid" || row.status === "warning",
    ).length;
    const duplicateRows = rowResults.filter((row) => row.status === "duplicate").length;
    const invalidRows = rowResults.filter((row) => row.status === "invalid").length;

    const auditResult = await importAuditRepository.createImportPreviewJob({
      input: payload,
      importMode: ImportMode.SkipInvalid,
      totalRows: rowResults.length,
      validRows,
      invalidRows,
      duplicateRows,
      rowResults,
    });
    if (!auditResult.success) {
      return auditResult;
    }

    return {
      success: true,
      value: {
        importJobRemoteId: auditResult.value.job.remoteId,
        moduleId: payload.moduleId,
        fileName: payload.fileName,
        totalRows: rowResults.length,
        validRows,
        invalidRows,
        duplicateRows,
        warnings,
        rowResults,
      },
    };
  },
});
