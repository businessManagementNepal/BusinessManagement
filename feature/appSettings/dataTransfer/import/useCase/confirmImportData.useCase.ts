import { AuditModule, AuditOutcome, AuditSeverity } from "@/feature/audit/types/audit.entity.types";
import { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import { SaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase";
import { SaveContactUseCase } from "@/feature/contacts/useCase/saveContact.useCase";
import { CreateProductWithOpeningStockUseCase } from "@/feature/products/useCase/createProductWithOpeningStock.useCase";
import { ImportAuditRepository } from "@/feature/appSettings/dataTransfer/import/audit/data/repository/importAudit.repository";
import { mapContactImportData } from "../mapper/contactImport.mapper";
import { mapMoneyAccountImportData } from "../mapper/moneyAccountImport.mapper";
import { mapProductImportData } from "../mapper/productImport.mapper";
import {
  ConfirmImportDataPayload,
  ConfirmImportResult,
  DataTransferResult,
  DataTransferValidationError,
  ImportJobRowStatus,
  ImportJobStatus,
  SettingsDataTransferModule,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

type SensitiveAccessGuard = () => string | null;

type CreateConfirmImportDataUseCaseParams = {
  importAuditRepository: ImportAuditRepository;
  createProductWithOpeningStockUseCase: CreateProductWithOpeningStockUseCase;
  saveContactUseCase: SaveContactUseCase;
  saveMoneyAccountUseCase: SaveMoneyAccountUseCase;
  recordAuditEventUseCase: RecordAuditEventUseCase;
  ensureSensitiveAccess: SensitiveAccessGuard;
  activeAccountDisplayName: string;
};

export interface ConfirmImportDataUseCase {
  execute(
    payload: ConfirmImportDataPayload,
  ): Promise<DataTransferResult<ConfirmImportResult>>;
}

export const createConfirmImportDataUseCase = ({
  importAuditRepository,
  createProductWithOpeningStockUseCase,
  saveContactUseCase,
  saveMoneyAccountUseCase,
  recordAuditEventUseCase,
  ensureSensitiveAccess,
  activeAccountDisplayName,
}: CreateConfirmImportDataUseCaseParams): ConfirmImportDataUseCase => ({
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

    const importJobResult = await importAuditRepository.getImportJobByRemoteId(
      payload.importJobRemoteId,
    );
    if (!importJobResult.success) {
      return importJobResult;
    }

    const importJob = importJobResult.value;
    if (!importJob) {
      return {
        success: false,
        error: DataTransferValidationError("Import preview job was not found."),
      };
    }

    if (importJob.activeAccountRemoteId !== activeAccountRemoteId) {
      return {
        success: false,
        error: DataTransferValidationError(
          "This import preview belongs to a different account.",
        ),
      };
    }

    if (importJob.activeUserRemoteId !== activeUserRemoteId) {
      return {
        success: false,
        error: DataTransferValidationError(
          "This import preview belongs to a different user session.",
        ),
      };
    }

    if (importJob.status !== ImportJobStatus.PreviewReady) {
      return {
        success: false,
        error: DataTransferValidationError(
          "This import preview is no longer ready to confirm.",
        ),
      };
    }

    const rowResult = await importAuditRepository.getImportJobRowsByJobRemoteId(
      importJob.remoteId,
    );
    if (!rowResult.success) {
      return rowResult;
    }

    const importStartUpdate = await importAuditRepository.updateImportJob({
      remoteId: importJob.remoteId,
      status: ImportJobStatus.Importing,
      importedRows: 0,
      skippedRows: 0,
      failedRows: 0,
    });
    if (!importStartUpdate.success) {
      return importStartUpdate;
    }

    let importedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;
    const errors: string[] = [];

    for (const row of rowResult.value) {
      const isImportableRow =
        row.status === ImportJobRowStatus.Valid ||
        row.status === ImportJobRowStatus.Warning;
      if (!isImportableRow) {
        const skipUpdate = await importAuditRepository.updateImportJobRow({
          remoteId: row.remoteId,
          status: ImportJobRowStatus.Skipped,
          errors: row.errors,
          warnings: row.warnings,
        });
        if (!skipUpdate.success) {
          return skipUpdate;
        }

        skippedRows += 1;
        continue;
      }

      if (importJob.moduleId === SettingsDataTransferModule.Products) {
        const productPayload = mapProductImportData({
          normalizedData: row.normalizedData ?? {},
          activeAccountRemoteId,
        });
        const saveResult =
          await createProductWithOpeningStockUseCase.execute(productPayload);

        if (!saveResult.success) {
          const failureUpdate = await importAuditRepository.updateImportJobRow({
            remoteId: row.remoteId,
            status: ImportJobRowStatus.Failed,
            errors: [saveResult.error.message],
            warnings: row.warnings,
          });
          if (!failureUpdate.success) {
            return failureUpdate;
          }

          failedRows += 1;
          errors.push(`Row ${row.rowNumber}: ${saveResult.error.message}`);
          continue;
        }

        const importedUpdate = await importAuditRepository.updateImportJobRow({
          remoteId: row.remoteId,
          status: ImportJobRowStatus.Imported,
          warnings: row.warnings,
          createdRecordRemoteId: saveResult.value.remoteId,
        });
        if (!importedUpdate.success) {
          return importedUpdate;
        }

        importedRows += 1;
        continue;
      }

      if (importJob.moduleId === SettingsDataTransferModule.Contacts) {
        const contactPayload = mapContactImportData({
          normalizedData: row.normalizedData ?? {},
          activeUserRemoteId,
          activeAccountRemoteId,
        });
        const saveResult = await saveContactUseCase.execute(contactPayload);

        if (!saveResult.success) {
          const failureUpdate = await importAuditRepository.updateImportJobRow({
            remoteId: row.remoteId,
            status: ImportJobRowStatus.Failed,
            errors: [saveResult.error.message],
            warnings: row.warnings,
          });
          if (!failureUpdate.success) {
            return failureUpdate;
          }

          failedRows += 1;
          errors.push(`Row ${row.rowNumber}: ${saveResult.error.message}`);
          continue;
        }

        const importedUpdate = await importAuditRepository.updateImportJobRow({
          remoteId: row.remoteId,
          status: ImportJobRowStatus.Imported,
          warnings: row.warnings,
          createdRecordRemoteId: saveResult.value.remoteId,
        });
        if (!importedUpdate.success) {
          return importedUpdate;
        }

        importedRows += 1;
        continue;
      }

      if (importJob.moduleId === SettingsDataTransferModule.Accounts) {
        const moneyAccountPayload = mapMoneyAccountImportData({
          normalizedData: row.normalizedData ?? {},
          activeUserRemoteId,
          activeAccountRemoteId,
          activeAccountDisplayName,
        });
        const saveResult = await saveMoneyAccountUseCase.execute(
          moneyAccountPayload,
        );
        if (!saveResult.success) {
          const failureUpdate = await importAuditRepository.updateImportJobRow({
            remoteId: row.remoteId,
            status: ImportJobRowStatus.Failed,
            errors: [saveResult.error.message],
            warnings: row.warnings,
          });
          if (!failureUpdate.success) {
            return failureUpdate;
          }

          failedRows += 1;
          errors.push(`Row ${row.rowNumber}: ${saveResult.error.message}`);
          continue;
        }

        const importedUpdate = await importAuditRepository.updateImportJobRow({
          remoteId: row.remoteId,
          status: ImportJobRowStatus.Imported,
          warnings: row.warnings,
          createdRecordRemoteId: saveResult.value.remoteId,
        });
        if (!importedUpdate.success) {
          return importedUpdate;
        }

        importedRows += 1;
        continue;
      }

      const unsupportedUpdate = await importAuditRepository.updateImportJobRow({
        remoteId: row.remoteId,
        status: ImportJobRowStatus.Failed,
        errors: ["This module is not available for safe import yet."],
        warnings: row.warnings,
      });
      if (!unsupportedUpdate.success) {
        return unsupportedUpdate;
      }

      failedRows += 1;
      errors.push(`Row ${row.rowNumber}: This module is not available for safe import yet.`);
    }

    const completedAt = Date.now();
    const jobStatus =
      failedRows > 0
        ? importedRows > 0
          ? ImportJobStatus.CompletedWithErrors
          : ImportJobStatus.Failed
        : ImportJobStatus.Completed;
    const jobUpdate = await importAuditRepository.updateImportJob({
      remoteId: importJob.remoteId,
      status: jobStatus,
      importedRows,
      skippedRows,
      failedRows,
      completedAt,
    });
    if (!jobUpdate.success) {
      return jobUpdate;
    }

    await recordAuditEventUseCase.execute({
      accountRemoteId: activeAccountRemoteId,
      ownerUserRemoteId: activeUserRemoteId,
      actorUserRemoteId: activeUserRemoteId,
      module: AuditModule.Settings,
      action: "import_confirm",
      sourceModule: "settings_import",
      sourceRemoteId: importJob.remoteId,
      sourceAction: `import_${importJob.moduleId}`,
      outcome:
        failedRows > 0
          ? importedRows > 0
            ? AuditOutcome.Partial
            : AuditOutcome.Failure
          : AuditOutcome.Success,
      severity: failedRows > 0 ? AuditSeverity.Warning : AuditSeverity.Info,
      summary:
        failedRows > 0
          ? `Imported ${importedRows} rows with ${failedRows} failures from ${importJob.fileName}.`
          : `Imported ${importedRows} rows from ${importJob.fileName}.`,
      metadataJson: JSON.stringify({
        moduleId: importJob.moduleId,
        importedRows,
        skippedRows,
        failedRows,
      }),
      createdAt: completedAt,
    });

    return {
      success: true,
      value: {
        importJobRemoteId: importJob.remoteId,
        importedRows,
        skippedRows,
        failedRows,
        errors,
      },
    };
  },
});
