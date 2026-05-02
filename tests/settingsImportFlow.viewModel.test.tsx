// @vitest-environment jsdom

import React, { act, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { SettingsDataTransferModule } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { useImportDataFlowViewModel } from "@/feature/appSettings/dataTransfer/import/viewModel/importDataFlow.viewModel.impl";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type HarnessProps = {
  onUpdate: (value: ReturnType<typeof useImportDataFlowViewModel>) => void;
  pickImportFileUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  previewImportDataUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  confirmImportDataUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  downloadImportTemplateUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
};

function Harness(props: HarnessProps) {
  const viewModel = useImportDataFlowViewModel({
    visible: true,
    activeUserRemoteId: "user-1",
    activeAccountRemoteId: "acc-1",
    activeAccountType: AccountType.Business,
    pickImportFileUseCase: props.pickImportFileUseCase as never,
    previewImportDataUseCase: props.previewImportDataUseCase as never,
    confirmImportDataUseCase: props.confirmImportDataUseCase as never,
    downloadImportTemplateUseCase:
      props.downloadImportTemplateUseCase as never,
    onClose: vi.fn(),
  });

  useEffect(() => {
    props.onUpdate(viewModel);
  }, [props, viewModel]);

  return null;
}

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("settingsImportFlow.viewModel", () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestViewModel: ReturnType<typeof useImportDataFlowViewModel> | null =
    null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    latestViewModel = null;
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("walks from module selection to preview and confirm", async () => {
    const pickImportFileUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          uri: "file:///products.csv",
          name: "products.csv",
          mimeType: "text/csv",
          size: 123,
          format: "csv" as const,
        },
      })),
    };
    const previewImportDataUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          importJobRemoteId: "job-1",
          moduleId: SettingsDataTransferModule.Products,
          fileName: "products.csv",
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
          duplicateRows: 0,
          warnings: [],
          rowResults: [
            {
              rowNumber: 1,
              status: "valid" as const,
              errors: [],
              warnings: [],
              normalizedData: {},
            },
          ],
        },
      })),
    };
    const confirmImportDataUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          importJobRemoteId: "job-1",
          importedRows: 1,
          skippedRows: 0,
          failedRows: 0,
          errors: [],
        },
      })),
    };

    await act(async () => {
      root.render(
        <Harness
          onUpdate={(value) => {
            latestViewModel = value;
          }}
          pickImportFileUseCase={pickImportFileUseCase}
          previewImportDataUseCase={previewImportDataUseCase}
          confirmImportDataUseCase={confirmImportDataUseCase}
          downloadImportTemplateUseCase={{
            execute: vi.fn(async () => ({
              success: true as const,
              value: { fileName: "template.csv" },
            })),
          }}
        />,
      );
      await flushEffects();
    });

    expect(latestViewModel?.step).toBe("select_module");

    await act(async () => {
      latestViewModel?.onSelectModule(SettingsDataTransferModule.Products);
      await flushEffects();
    });
    expect(latestViewModel?.step).toBe("pick_file");

    await act(async () => {
      await latestViewModel?.onPickFile();
      await flushEffects();
    });
    expect(latestViewModel?.pickedFile?.name).toBe("products.csv");

    await act(async () => {
      await latestViewModel?.onPreview();
      await flushEffects();
    });
    expect(latestViewModel?.step).toBe("preview");

    await act(async () => {
      await latestViewModel?.onConfirm();
      await flushEffects();
    });
    expect(latestViewModel?.step).toBe("result");
    expect(latestViewModel?.confirmResult?.importedRows).toBe(1);
  });
});
