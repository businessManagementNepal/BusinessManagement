import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES,
  PickedImportFile,
  PreviewImportDataPayload,
  SettingsDataTransferModule,
  SettingsDataTransferModuleValue,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { PickImportFileUseCase } from "../useCase/pickImportFile.useCase";
import { PreviewImportDataUseCase } from "../useCase/previewImportData.useCase";
import { ConfirmImportDataUseCase } from "../useCase/confirmImportData.useCase";
import { DownloadImportTemplateUseCase } from "../useCase/downloadImportTemplate.useCase";
import {
  ImportDataFlowStep,
  ImportDataFlowViewModel,
} from "./importDataFlow.viewModel";

type Params = {
  visible: boolean;
  activeUserRemoteId: string;
  activeAccountRemoteId: string;
  activeAccountType: import("@/feature/auth/accountSelection/types/accountSelection.types").AccountTypeValue;
  pickImportFileUseCase: PickImportFileUseCase;
  previewImportDataUseCase: PreviewImportDataUseCase;
  confirmImportDataUseCase: ConfirmImportDataUseCase;
  downloadImportTemplateUseCase: DownloadImportTemplateUseCase;
  onClose: () => void;
};

const MODULE_DESCRIPTIONS: Record<SettingsDataTransferModuleValue, string> = {
  [SettingsDataTransferModule.Transactions]:
    "Not available for import yet.",
  [SettingsDataTransferModule.Products]:
    "Import product catalog rows from CSV or Excel with validation preview.",
  [SettingsDataTransferModule.Contacts]:
    "Import customers, suppliers, or personal contacts with duplicate checks.",
  [SettingsDataTransferModule.Orders]: "Not available for import yet.",
  [SettingsDataTransferModule.Budgets]: "Not available for import yet.",
  [SettingsDataTransferModule.Ledger]: "Not available for import yet.",
  [SettingsDataTransferModule.EmiLoans]: "Not available for import yet.",
  [SettingsDataTransferModule.Accounts]:
    "Import money accounts with safe opening balance workflows.",
};

type ImportDataFlowState = {
  step: ImportDataFlowStep;
  selectedModuleId: SettingsDataTransferModuleValue | null;
  pickedFile: PickedImportFile | null;
  previewResult: import("@/feature/appSettings/dataTransfer/types/dataTransfer.types").ImportPreviewResult | null;
  confirmResult: import("@/feature/appSettings/dataTransfer/types/dataTransfer.types").ConfirmImportResult | null;
  errorMessage: string | null;
  infoMessage: string | null;
  isPickingFile: boolean;
  isPreviewing: boolean;
  isConfirming: boolean;
};

const buildInitialState = (): ImportDataFlowState => ({
  step: "select_module",
  selectedModuleId: null,
  pickedFile: null,
  previewResult: null,
  confirmResult: null,
  errorMessage: null,
  infoMessage: null,
  isPickingFile: false,
  isPreviewing: false,
  isConfirming: false,
});

export const useImportDataFlowViewModel = ({
  visible,
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountType,
  pickImportFileUseCase,
  previewImportDataUseCase,
  confirmImportDataUseCase,
  downloadImportTemplateUseCase,
  onClose,
}: Params): ImportDataFlowViewModel => {
  const [state, setState] = useState<ImportDataFlowState>(buildInitialState);

  useEffect(() => {
    if (!visible) {
      setState(buildInitialState());
    }
  }, [visible]);

  const moduleOptions = useMemo(
    () =>
      IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES.map((moduleId) => ({
        id: moduleId,
        label:
          moduleId === SettingsDataTransferModule.Accounts
            ? "Money Accounts"
            : moduleId === SettingsDataTransferModule.Products
              ? "Products"
              : "Contacts",
        description: MODULE_DESCRIPTIONS[moduleId],
      })),
    [],
  );

  const selectedModuleLabel = useMemo(() => {
    return (
      moduleOptions.find((option) => option.id === state.selectedModuleId)?.label ??
      null
    );
  }, [moduleOptions, state.selectedModuleId]);

  const title = useMemo(() => {
    if (state.step === "preview") {
      return "Preview Import";
    }

    if (state.step === "result") {
      return "Import Result";
    }

    if (state.step === "pick_file") {
      return "Choose Import File";
    }

    return "Import Data";
  }, [state.step]);

  const subtitle = useMemo(() => {
    if (state.step === "select_module") {
      return "Select a safe module first. Import writes only through existing domain workflows.";
    }

    if (state.step === "pick_file") {
      return selectedModuleLabel
        ? `${selectedModuleLabel} import supports CSV and Excel with preview before any business records are created.`
        : "Pick a file to continue.";
    }

    if (state.step === "preview") {
      return "Review validation, duplicates, and row-level normalization before confirming.";
    }

    return "Import completed only after confirm succeeded.";
  }, [selectedModuleLabel, state.step]);

  const resetState = useCallback(() => {
    setState(buildInitialState());
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const onSelectModule = useCallback((moduleId: SettingsDataTransferModuleValue) => {
    setState((current) => ({
      ...current,
      step: "pick_file",
      selectedModuleId: moduleId,
      pickedFile: null,
      previewResult: null,
      confirmResult: null,
      errorMessage: null,
      infoMessage: null,
    }));
  }, []);

  const onBack = useCallback(() => {
    setState((current) => {
      if (current.step === "pick_file") {
        return {
          ...buildInitialState(),
        };
      }

      if (current.step === "preview") {
        return {
          ...current,
          step: "pick_file",
          confirmResult: null,
          errorMessage: null,
          infoMessage: null,
          isConfirming: false,
        };
      }

      if (current.step === "result") {
        return {
          ...buildInitialState(),
        };
      }

      return current;
    });
  }, []);

  const onPickFile = useCallback(async () => {
    setState((current) => ({
      ...current,
      isPickingFile: true,
      errorMessage: null,
      infoMessage: null,
    }));

    const result = await pickImportFileUseCase.execute();

    if (!result.success) {
      setState((current) => ({
        ...current,
        isPickingFile: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    if (!result.value) {
      setState((current) => ({
        ...current,
        isPickingFile: false,
      }));
      return;
    }

    setState((current) => ({
      ...current,
      isPickingFile: false,
      pickedFile: result.value,
      errorMessage: null,
      previewResult: null,
      confirmResult: null,
    }));
  }, [pickImportFileUseCase]);

  const onPreview = useCallback(async () => {
    if (!state.selectedModuleId || !state.pickedFile) {
      setState((current) => ({
        ...current,
        errorMessage: "Select a module and file before previewing the import.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      isPreviewing: true,
      errorMessage: null,
      infoMessage: null,
    }));

    const payload: PreviewImportDataPayload = {
      activeUserRemoteId,
      activeAccountRemoteId,
      activeAccountType,
      moduleId: state.selectedModuleId,
      fileUri: state.pickedFile.uri,
      fileName: state.pickedFile.name,
      mimeType: state.pickedFile.mimeType,
      format: state.pickedFile.format,
    };
    const result = await previewImportDataUseCase.execute(payload);

    if (!result.success) {
      setState((current) => ({
        ...current,
        isPreviewing: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    setState((current) => ({
      ...current,
      isPreviewing: false,
      step: "preview",
      previewResult: result.value,
      errorMessage: null,
    }));
  }, [
    activeAccountRemoteId,
    activeAccountType,
    activeUserRemoteId,
    previewImportDataUseCase,
    state.pickedFile,
    state.selectedModuleId,
  ]);

  const onConfirm = useCallback(async () => {
    if (!state.previewResult) {
      setState((current) => ({
        ...current,
        errorMessage: "Preview the import before confirming it.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      isConfirming: true,
      errorMessage: null,
      infoMessage: null,
    }));

    const result = await confirmImportDataUseCase.execute({
      importJobRemoteId: state.previewResult.importJobRemoteId,
      activeUserRemoteId,
      activeAccountRemoteId,
    });

    if (!result.success) {
      setState((current) => ({
        ...current,
        isConfirming: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    setState((current) => ({
      ...current,
      isConfirming: false,
      step: "result",
      confirmResult: result.value,
      errorMessage: null,
    }));
  }, [
    activeAccountRemoteId,
    activeUserRemoteId,
    confirmImportDataUseCase,
    state.previewResult,
  ]);

  const onDownloadTemplate = useCallback(async () => {
    if (!state.selectedModuleId) {
      setState((current) => ({
        ...current,
        errorMessage: "Select a module before downloading its import template.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      errorMessage: null,
      infoMessage: null,
    }));

    const result = await downloadImportTemplateUseCase.execute({
      moduleId: state.selectedModuleId,
      format:
        state.pickedFile?.format === "xlsx"
          ? state.pickedFile.format
          : "csv",
    });

    if (!result.success) {
      setState((current) => ({
        ...current,
        errorMessage: result.error.message,
      }));
      return;
    }

    setState((current) => ({
      ...current,
      infoMessage: `Template downloaded as ${result.value.fileName}.`,
    }));
  }, [downloadImportTemplateUseCase, state.pickedFile?.format, state.selectedModuleId]);

  const onStartOver = useCallback(() => {
    setState(buildInitialState());
  }, []);

  return {
    step: state.step,
    title,
    subtitle,
    moduleOptions,
    selectedModuleId: state.selectedModuleId,
    selectedModuleLabel,
    pickedFile: state.pickedFile,
    previewResult: state.previewResult,
    confirmResult: state.confirmResult,
    errorMessage: state.errorMessage,
    infoMessage: state.infoMessage,
    isPickingFile: state.isPickingFile,
    isPreviewing: state.isPreviewing,
    isConfirming: state.isConfirming,
    onClose: handleClose,
    onSelectModule,
    onBack,
    onPickFile,
    onPreview,
    onConfirm,
    onDownloadTemplate,
    onStartOver,
  };
};
