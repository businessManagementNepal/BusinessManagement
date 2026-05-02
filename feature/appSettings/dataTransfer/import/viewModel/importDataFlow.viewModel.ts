import {
  ConfirmImportResult,
  ImportPreviewResult,
  PickedImportFile,
  SettingsDataTransferModuleValue,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

export type ImportDataFlowStep =
  | "select_module"
  | "pick_file"
  | "preview"
  | "result";

export interface ImportDataFlowViewModel {
  step: ImportDataFlowStep;
  title: string;
  subtitle: string;
  moduleOptions: readonly {
    id: SettingsDataTransferModuleValue;
    label: string;
    description: string;
  }[];
  selectedModuleId: SettingsDataTransferModuleValue | null;
  selectedModuleLabel: string | null;
  pickedFile: PickedImportFile | null;
  previewResult: ImportPreviewResult | null;
  confirmResult: ConfirmImportResult | null;
  errorMessage: string | null;
  infoMessage: string | null;
  isPickingFile: boolean;
  isPreviewing: boolean;
  isConfirming: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: SettingsDataTransferModuleValue) => void;
  onBack: () => void;
  onPickFile: () => Promise<void>;
  onPreview: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onDownloadTemplate: () => Promise<void>;
  onStartOver: () => void;
}
