import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ImportDataFlowViewModel } from "../viewModel/importDataFlow.viewModel";
import { ImportFilePickerStep } from "./ImportFilePickerStep";
import { ImportPreviewStep } from "./ImportPreviewStep";
import { ImportResultStep } from "./ImportResultStep";

type ImportDataFlowScreenProps = {
  visible: boolean;
  viewModel: ImportDataFlowViewModel;
};

export function ImportDataFlowScreen({
  visible,
  viewModel,
}: ImportDataFlowScreenProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.scaleSpace(spacing.md),
        },
        moduleList: {
          gap: theme.scaleSpace(spacing.sm),
        },
        moduleRow: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.secondary,
          padding: theme.scaleSpace(spacing.md),
          gap: theme.scaleSpace(4),
        },
        moduleTitle: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(16),
          fontFamily: "InterBold",
        },
        moduleBody: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
      }),
    [theme],
  );

  return (
    <FormSheetModal
      visible={visible}
      title={viewModel.title}
      subtitle={viewModel.subtitle}
      onClose={viewModel.onClose}
      closeAccessibilityLabel="Close import data flow"
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
    >
      {viewModel.step === "select_module" ? (
        <View style={styles.moduleList}>
          {viewModel.moduleOptions.map((moduleOption) => (
            <Pressable
              key={moduleOption.id}
              style={styles.moduleRow}
              onPress={() => viewModel.onSelectModule(moduleOption.id)}
              accessibilityRole="button"
            >
              <Text style={styles.moduleTitle}>{moduleOption.label}</Text>
              <Text style={styles.moduleBody}>{moduleOption.description}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {viewModel.step === "pick_file" && viewModel.selectedModuleLabel ? (
        <ImportFilePickerStep
          selectedModuleLabel={viewModel.selectedModuleLabel}
          pickedFile={viewModel.pickedFile}
          isPickingFile={viewModel.isPickingFile}
          isPreviewing={viewModel.isPreviewing}
          errorMessage={viewModel.errorMessage}
          infoMessage={viewModel.infoMessage}
          onPickFile={viewModel.onPickFile}
          onPreview={viewModel.onPreview}
          onDownloadTemplate={viewModel.onDownloadTemplate}
          onBack={viewModel.onBack}
        />
      ) : null}

      {viewModel.step === "preview" && viewModel.previewResult ? (
        <ImportPreviewStep
          previewResult={viewModel.previewResult}
          isConfirming={viewModel.isConfirming}
          errorMessage={viewModel.errorMessage}
          onConfirm={viewModel.onConfirm}
          onBack={viewModel.onBack}
        />
      ) : null}

      {viewModel.step === "result" && viewModel.confirmResult ? (
        <ImportResultStep
          result={viewModel.confirmResult}
          onClose={viewModel.onClose}
          onStartOver={viewModel.onStartOver}
        />
      ) : null}
    </FormSheetModal>
  );
}
