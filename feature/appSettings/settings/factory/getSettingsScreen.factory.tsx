import { createLocalSettingsDatasource } from "@/feature/appSettings/settings/data/dataSource/local.settings.datasource.impl";
import { createSettingsRepository } from "@/feature/appSettings/settings/data/repository/settings.repository.impl";
import { SettingsScreen } from "@/feature/appSettings/settings/ui/SettingsScreen";
import { createChangePasswordUseCase } from "@/feature/appSettings/settings/useCase/changePassword.useCase.impl";
import { createGetSettingsBootstrapUseCase } from "@/feature/appSettings/settings/useCase/getSettingsBootstrap.useCase.impl";
import { createSubmitAppRatingUseCase } from "@/feature/appSettings/settings/useCase/submitAppRating.useCase.impl";
import { createSubmitBugReportUseCase } from "@/feature/appSettings/settings/useCase/submitBugReport.useCase.impl";
import { createUpdateBiometricLoginPreferenceUseCase } from "@/feature/appSettings/settings/useCase/updateBiometricLoginPreference.useCase.impl";
import { createUpdateTwoFactorAuthPreferenceUseCase } from "@/feature/appSettings/settings/useCase/updateTwoFactorAuthPreference.useCase.impl";
import { useSettingsViewModel } from "@/feature/appSettings/settings/viewModel/settings.viewModel.impl";
import { createLocalAuthCredentialDatasource } from "@/feature/session/data/dataSource/local.authCredential.datasource.impl";
import { createAuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository.impl";
import { createPasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import appDatabase from "@/shared/database/appDatabase";
import React from "react";

type GetSettingsScreenFactoryProps = {
  activeUserRemoteId: string | null;
  onBack: () => void;
};

export function GetSettingsScreenFactory({
  activeUserRemoteId,
  onBack,
}: GetSettingsScreenFactoryProps) {
  const settingsDatasource = React.useMemo(
    () => createLocalSettingsDatasource(appDatabase),
    [],
  );
  const settingsRepository = React.useMemo(
    () => createSettingsRepository(settingsDatasource),
    [settingsDatasource],
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
  const updateBiometricLoginPreferenceUseCase = React.useMemo(
    () => createUpdateBiometricLoginPreferenceUseCase(settingsRepository),
    [settingsRepository],
  );
  const updateTwoFactorAuthPreferenceUseCase = React.useMemo(
    () => createUpdateTwoFactorAuthPreferenceUseCase(settingsRepository),
    [settingsRepository],
  );
  const submitBugReportUseCase = React.useMemo(
    () => createSubmitBugReportUseCase(settingsRepository),
    [settingsRepository],
  );
  const submitAppRatingUseCase = React.useMemo(
    () => createSubmitAppRatingUseCase(settingsRepository),
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

  const viewModel = useSettingsViewModel({
    activeUserRemoteId,
    getSettingsBootstrapUseCase,
    updateBiometricLoginPreferenceUseCase,
    updateTwoFactorAuthPreferenceUseCase,
    submitBugReportUseCase,
    submitAppRatingUseCase,
    changePasswordUseCase,
  });

  return <SettingsScreen viewModel={viewModel} onBack={onBack} />;
}
