import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createSaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase.impl";
import { createRunMoneyAccountOpeningBalanceWorkflowUseCase } from "@/feature/accounts/workflow/moneyAccountOpeningBalance/useCase/runMoneyAccountOpeningBalance.useCase.impl";
import { createLocalImportAuditDatasource } from "@/feature/appSettings/dataTransfer/import/audit/data/dataSource/local.importAudit.datasource.impl";
import { createImportAuditRepository } from "@/feature/appSettings/dataTransfer/import/audit/data/repository/importAudit.repository.impl";
import { createDownloadImportTemplateUseCase } from "@/feature/appSettings/dataTransfer/import/useCase/downloadImportTemplate.useCase";
import { createConfirmImportDataUseCase } from "@/feature/appSettings/dataTransfer/import/useCase/confirmImportData.useCase";
import { createParseImportFileUseCase } from "@/feature/appSettings/dataTransfer/import/useCase/parseImportFile.useCase";
import { createPickImportFileUseCase } from "@/feature/appSettings/dataTransfer/import/useCase/pickImportFile.useCase";
import { createPreviewImportDataUseCase } from "@/feature/appSettings/dataTransfer/import/useCase/previewImportData.useCase";
import { ImportDataFlowScreen } from "@/feature/appSettings/dataTransfer/import/ui/ImportDataFlowScreen";
import { useImportDataFlowViewModel } from "@/feature/appSettings/dataTransfer/import/viewModel/importDataFlow.viewModel.impl";
import { SETTINGS_OWNER_ADMIN_REQUIRED_MESSAGE, SETTINGS_PERMISSION_LOADING_MESSAGE } from "@/feature/appSettings/settings/constants/settings.constants";
import { createLocalAuditDatasource } from "@/feature/audit/data/dataSource/local.audit.datasource.impl";
import { createAuditRepository } from "@/feature/audit/data/repository/audit.repository.impl";
import { createRecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase.impl";
import { AccountType, AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { createLocalContactDatasource } from "@/feature/contacts/data/dataSource/local.contact.datasource.impl";
import { createContactRepository } from "@/feature/contacts/data/repository/contact.repository.impl";
import { createGetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase.impl";
import { createSaveContactUseCase } from "@/feature/contacts/useCase/saveContact.useCase.impl";
import { createLocalInventoryDatasource } from "@/feature/inventory/data/dataSource/local.inventory.datasource.impl";
import { createInventoryRepository } from "@/feature/inventory/data/repository/inventory.repository.impl";
import { createCreateOpeningStockForProductUseCase } from "@/feature/inventory/useCase/createOpeningStockForProduct.useCase.impl";
import { createSaveInventoryMovementUseCase } from "@/feature/inventory/useCase/saveInventoryMovement.useCase.impl";
import { createLocalProductDatasource } from "@/feature/products/data/dataSource/local.product.datasource.impl";
import { createProductRepository } from "@/feature/products/data/repository/product.repository.impl";
import { createCreateProductWithOpeningStockUseCase } from "@/feature/products/useCase/createProductWithOpeningStock.useCase.impl";
import { createDeleteProductUseCase } from "@/feature/products/useCase/deleteProduct.useCase.impl";
import { createGetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase.impl";
import { createSaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase.impl";
import { createMoneyPostingRuntime } from "@/feature/transactions/factory/createMoneyPostingRuntime.factory";
import appDatabase from "@/shared/database/appDatabase";
import React from "react";

type GetImportDataFlowFactoryProps = {
  visible: boolean;
  activeUserRemoteId: string;
  activeAccountRemoteId: string;
  activeAccountType: AccountTypeValue;
  activeAccountDisplayName: string;
  canManageSensitiveSettings: boolean;
  isSensitiveSettingsAccessLoading: boolean;
  onClose: () => void;
};

export function GetImportDataFlowFactory({
  visible,
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountType,
  activeAccountDisplayName,
  canManageSensitiveSettings,
  isSensitiveSettingsAccessLoading,
  onClose,
}: GetImportDataFlowFactoryProps) {
  const ensureSensitiveAccess = React.useCallback((): string | null => {
    const isBusinessAccount = activeAccountType === AccountType.Business;
    if (!isBusinessAccount) {
      return null;
    }

    if (isSensitiveSettingsAccessLoading) {
      return SETTINGS_PERMISSION_LOADING_MESSAGE;
    }

    if (!canManageSensitiveSettings) {
      return SETTINGS_OWNER_ADMIN_REQUIRED_MESSAGE;
    }

    return null;
  }, [
    activeAccountType,
    canManageSensitiveSettings,
    isSensitiveSettingsAccessLoading,
  ]);

  const productDatasource = React.useMemo(
    () => createLocalProductDatasource(appDatabase),
    [],
  );
  const productRepository = React.useMemo(
    () => createProductRepository(productDatasource),
    [productDatasource],
  );
  const inventoryDatasource = React.useMemo(
    () => createLocalInventoryDatasource(appDatabase),
    [],
  );
  const inventoryRepository = React.useMemo(
    () => createInventoryRepository(inventoryDatasource),
    [inventoryDatasource],
  );
  const saveInventoryMovementUseCase = React.useMemo(
    () =>
      createSaveInventoryMovementUseCase({
        inventoryRepository,
        productRepository,
      }),
    [inventoryRepository, productRepository],
  );
  const createOpeningStockForProductUseCase = React.useMemo(
    () =>
      createCreateOpeningStockForProductUseCase({
        productRepository,
        saveInventoryMovementUseCase,
      }),
    [productRepository, saveInventoryMovementUseCase],
  );
  const saveProductUseCase = React.useMemo(
    () => createSaveProductUseCase(productRepository),
    [productRepository],
  );
  const deleteProductUseCase = React.useMemo(
    () => createDeleteProductUseCase(productRepository),
    [productRepository],
  );
  const createProductWithOpeningStockUseCase = React.useMemo(
    () =>
      createCreateProductWithOpeningStockUseCase({
        saveProductUseCase,
        deleteProductUseCase,
        createOpeningStockForProductUseCase,
      }),
    [
      createOpeningStockForProductUseCase,
      deleteProductUseCase,
      saveProductUseCase,
    ],
  );
  const getProductsUseCase = React.useMemo(
    () => createGetProductsUseCase(productRepository),
    [productRepository],
  );

  const contactDatasource = React.useMemo(
    () => createLocalContactDatasource(appDatabase),
    [],
  );
  const contactRepository = React.useMemo(
    () => createContactRepository(contactDatasource),
    [contactDatasource],
  );
  const getContactsUseCase = React.useMemo(
    () => createGetContactsUseCase(contactRepository),
    [contactRepository],
  );
  const saveContactUseCase = React.useMemo(
    () => createSaveContactUseCase(contactRepository),
    [contactRepository],
  );

  const moneyAccountDatasource = React.useMemo(
    () => createLocalMoneyAccountDatasource(appDatabase),
    [],
  );
  const moneyAccountRepository = React.useMemo(
    () => createMoneyAccountRepository(moneyAccountDatasource),
    [moneyAccountDatasource],
  );
  const moneyPostingRuntime = React.useMemo(
    () => createMoneyPostingRuntime(appDatabase),
    [],
  );
  const runMoneyAccountOpeningBalanceWorkflowUseCase = React.useMemo(
    () =>
      createRunMoneyAccountOpeningBalanceWorkflowUseCase({
        moneyAccountRepository,
        postMoneyMovementUseCase: moneyPostingRuntime.postMoneyMovementUseCase,
      }),
    [moneyAccountRepository, moneyPostingRuntime.postMoneyMovementUseCase],
  );
  const getMoneyAccountsUseCase = React.useMemo(
    () => createGetMoneyAccountsUseCase(moneyAccountRepository),
    [moneyAccountRepository],
  );
  const saveMoneyAccountUseCase = React.useMemo(
    () =>
      createSaveMoneyAccountUseCase({
        repository: moneyAccountRepository,
        runMoneyAccountOpeningBalanceWorkflowUseCase,
      }),
    [moneyAccountRepository, runMoneyAccountOpeningBalanceWorkflowUseCase],
  );

  const importAuditDatasource = React.useMemo(
    () => createLocalImportAuditDatasource(appDatabase),
    [],
  );
  const importAuditRepository = React.useMemo(
    () => createImportAuditRepository(importAuditDatasource),
    [importAuditDatasource],
  );
  const auditDatasource = React.useMemo(
    () => createLocalAuditDatasource(appDatabase),
    [],
  );
  const auditRepository = React.useMemo(
    () => createAuditRepository(auditDatasource),
    [auditDatasource],
  );
  const recordAuditEventUseCase = React.useMemo(
    () => createRecordAuditEventUseCase(auditRepository),
    [auditRepository],
  );

  const pickImportFileUseCase = React.useMemo(() => createPickImportFileUseCase(), []);
  const parseImportFileUseCase = React.useMemo(() => createParseImportFileUseCase(), []);
  const downloadImportTemplateUseCase = React.useMemo(
    () => createDownloadImportTemplateUseCase(),
    [],
  );
  const previewImportDataUseCase = React.useMemo(
    () =>
      createPreviewImportDataUseCase({
        parseImportFileUseCase,
        importAuditRepository,
        getProductsUseCase,
        getContactsUseCase,
        getMoneyAccountsUseCase,
        ensureSensitiveAccess,
      }),
    [
      ensureSensitiveAccess,
      getContactsUseCase,
      getMoneyAccountsUseCase,
      getProductsUseCase,
      importAuditRepository,
      parseImportFileUseCase,
    ],
  );
  const confirmImportDataUseCase = React.useMemo(
    () =>
      createConfirmImportDataUseCase({
        importAuditRepository,
        createProductWithOpeningStockUseCase,
        saveContactUseCase,
        saveMoneyAccountUseCase,
        recordAuditEventUseCase,
        ensureSensitiveAccess,
        activeAccountDisplayName,
      }),
    [
      activeAccountDisplayName,
      createProductWithOpeningStockUseCase,
      ensureSensitiveAccess,
      importAuditRepository,
      recordAuditEventUseCase,
      saveContactUseCase,
      saveMoneyAccountUseCase,
    ],
  );

  const viewModel = useImportDataFlowViewModel({
    visible,
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountType,
    pickImportFileUseCase,
    previewImportDataUseCase,
    confirmImportDataUseCase,
    downloadImportTemplateUseCase,
    onClose,
  });

  return <ImportDataFlowScreen visible={visible} viewModel={viewModel} />;
}
