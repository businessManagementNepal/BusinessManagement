import { createLocalAppearanceDatasource } from "@/feature/appSettings/appearance/data/dataSource/local.appearance.datasource.impl";
import { createAppearanceRepository } from "@/feature/appSettings/appearance/data/repository/appearance.repository.impl";
import { GetImportDataFlowFactory } from "@/feature/appSettings/dataTransfer/import/factory/getImportDataFlow.factory";
import { createGetAppearancePreferencesUseCase } from "@/feature/appSettings/appearance/useCase/getAppearancePreferences.useCase.impl";
import { createSaveAppearancePreferencesUseCase } from "@/feature/appSettings/appearance/useCase/saveAppearancePreferences.useCase.impl";
import { createLocalSettingsDatasource } from "@/feature/appSettings/settings/data/dataSource/local.settings.datasource.impl";
import { createSettingsRepository } from "@/feature/appSettings/settings/data/repository/settings.repository.impl";
import { SettingsScreen } from "@/feature/appSettings/settings/ui/SettingsScreen";
import { createChangePasswordUseCase } from "@/feature/appSettings/settings/useCase/changePassword.useCase.impl";
import { createGetSettingsBootstrapUseCase } from "@/feature/appSettings/settings/useCase/getSettingsBootstrap.useCase.impl";
import { createOpenBugReportEmailUseCase } from "@/feature/appSettings/settings/useCase/openBugReportEmail.useCase.impl";
import { createExportSettingsDataUseCase } from "@/feature/appSettings/settings/useCase/exportSettingsData.useCase.impl";
import { createImportSettingsDataUseCase } from "@/feature/appSettings/settings/useCase/importSettingsData.useCase.impl";
import { createDeleteLocalProfileDataUseCase } from "@/feature/appSettings/settings/useCase/deleteLocalProfileData.useCase.impl";
import { createLocalProfileDataFilesStore } from "@/feature/appSettings/settings/data/localProfileDataFiles.store";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { createGetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase.impl";
import { createSaveAccountUseCase } from "@/feature/auth/accountSelection/useCase/saveAccount.useCase.impl";
import { useSettingsViewModel } from "@/feature/appSettings/settings/viewModel/settings.viewModel.impl";
import { createLocalAuthCredentialDatasource } from "@/feature/session/data/dataSource/local.authCredential.datasource.impl";
import { createAuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository.impl";
import { createPasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import appDatabase from "@/shared/database/appDatabase";
import { createAuthTokenStore } from "@/shared/auth/authTokenStore";
import { clearLedgerReminderNotifications } from "@/feature/ledger/reminder/ledgerReminder.scheduler";
import { createDeviceIdStore } from "@/shared/device/deviceIdStore";
import { clearDatabaseFieldEncryptionKey } from "@/shared/utils/security/databaseFieldEncryption.service";
import React from "react";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  SETTINGS_OWNER_ADMIN_REQUIRED_MESSAGE,
  SETTINGS_PERMISSION_LOADING_MESSAGE,
} from "../constants/settings.constants";

type GetSettingsScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue;
  activeAccountDisplayName: string;
  canManageSensitiveSettings: boolean;
  isSensitiveSettingsAccessLoading: boolean;
  onLocalDataDeleted: () => Promise<void>;
  onBack: () => void;
};

export function GetSettingsScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountType,
  activeAccountDisplayName,
  canManageSensitiveSettings,
  isSensitiveSettingsAccessLoading,
  onLocalDataDeleted,
  onBack,
}: GetSettingsScreenFactoryProps) {
  const sensitiveAccessGuard = React.useCallback((): string | null => {
    if (activeAccountType !== AccountType.Business) {
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

  const appearanceDatasource = React.useMemo(
    () => createLocalAppearanceDatasource(appDatabase),
    [],
  );
  const appearanceRepository = React.useMemo(
    () => createAppearanceRepository(appearanceDatasource),
    [appearanceDatasource],
  );
  const getAppearancePreferencesUseCase = React.useMemo(
    () => createGetAppearancePreferencesUseCase(appearanceRepository),
    [appearanceRepository],
  );
  const saveAppearancePreferencesUseCase = React.useMemo(
    () => createSaveAppearancePreferencesUseCase(appearanceRepository),
    [appearanceRepository],
  );

  const settingsDatasource = React.useMemo(
    () => createLocalSettingsDatasource(appDatabase),
    [],
  );
  const settingsRepository = React.useMemo(
    () => createSettingsRepository(settingsDatasource),
    [settingsDatasource],
  );
  const accountDatasource = React.useMemo(
    () => createLocalAccountDatasource(appDatabase),
    [],
  );
  const accountRepository = React.useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );
  const getAccountByRemoteIdUseCase = React.useMemo(
    () => createGetAccountByRemoteIdUseCase(accountRepository),
    [accountRepository],
  );
  const saveAccountUseCase = React.useMemo(
    () => createSaveAccountUseCase(accountRepository),
    [accountRepository],
  );

  const authCredentialDatasource = React.useMemo(
    () => createLocalAuthCredentialDatasource(appDatabase),
    [],
  );
  const authCredentialRepository = React.useMemo(
    () => createAuthCredentialRepository(authCredentialDatasource),
    [authCredentialDatasource],
  );
  const passwordHashService = React.useMemo(() => createPasswordHashService(), []);

  const getSettingsBootstrapUseCase = React.useMemo(
    () =>
      createGetSettingsBootstrapUseCase(
        settingsRepository,
        authCredentialRepository,
      ),
    [authCredentialRepository, settingsRepository],
  );
  const openBugReportEmailUseCase = React.useMemo(
    () => createOpenBugReportEmailUseCase(),
    [],
  );
  const exportSettingsDataUseCase = React.useMemo(
    () =>
      createExportSettingsDataUseCase({
        settingsRepository,
        ensureSensitiveAccess: sensitiveAccessGuard,
      }),
    [sensitiveAccessGuard, settingsRepository],
  );
  const importSettingsDataUseCase = React.useMemo(
    () => createImportSettingsDataUseCase(settingsRepository),
    [settingsRepository],
  );
  const changePasswordUseCase = React.useMemo(
    () =>
      createChangePasswordUseCase(
        authCredentialRepository,
        passwordHashService,
      ),
    [authCredentialRepository, passwordHashService],
  );
  const deleteLocalProfileDataUseCase = React.useMemo(
    () =>
      createDeleteLocalProfileDataUseCase({
        database: appDatabase,
        authTokenStore: createAuthTokenStore(),
        deviceIdStore: createDeviceIdStore(),
        localProfileDataFilesStore: createLocalProfileDataFilesStore(),
        clearLedgerReminders: clearLedgerReminderNotifications,
        clearDatabaseEncryptionKey: clearDatabaseFieldEncryptionKey,
      }),
    [],
  );
  const viewModel = useSettingsViewModel({
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountType,
    activeAccountDisplayName,
    canManageSensitiveSettings,
    isSensitiveSettingsAccessLoading,
    getAppearancePreferencesUseCase,
    saveAppearancePreferencesUseCase,
    getSettingsBootstrapUseCase,
    openBugReportEmailUseCase,
    exportSettingsDataUseCase,
    importSettingsDataUseCase,
    changePasswordUseCase,
    deleteLocalProfileDataUseCase,
    onLocalDataDeleted,
    getAccountByRemoteIdUseCase,
    saveAccountUseCase,
  });

  return (
    <SettingsScreen
      viewModel={viewModel}
      onBack={onBack}
      importDataFlow={
        <GetImportDataFlowFactory
          visible={viewModel.activeModal === "import_data"}
          activeUserRemoteId={activeUserRemoteId ?? ""}
          activeAccountRemoteId={activeAccountRemoteId ?? ""}
          activeAccountType={activeAccountType}
          activeAccountDisplayName={activeAccountDisplayName}
          canManageSensitiveSettings={canManageSensitiveSettings}
          isSensitiveSettingsAccessLoading={isSensitiveSettingsAccessLoading}
          onClose={viewModel.onCloseModal}
        />
      }
    />
  );
}
