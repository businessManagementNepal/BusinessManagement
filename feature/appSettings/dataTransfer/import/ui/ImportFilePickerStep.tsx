import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { Download, FileUp, Upload } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PickedImportFile } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

type ImportFilePickerStepProps = {
  selectedModuleLabel: string;
  pickedFile: PickedImportFile | null;
  isPickingFile: boolean;
  isPreviewing: boolean;
  errorMessage: string | null;
  infoMessage: string | null;
  onPickFile: () => Promise<void>;
  onPreview: () => Promise<void>;
  onDownloadTemplate: () => Promise<void>;
  onBack: () => void;
};

export function ImportFilePickerStep({
  selectedModuleLabel,
  pickedFile,
  isPickingFile,
  isPreviewing,
  errorMessage,
  infoMessage,
  onPickFile,
  onPreview,
  onDownloadTemplate,
  onBack,
}: ImportFilePickerStepProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.scaleSpace(spacing.md),
        },
        summaryCard: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.secondary,
          padding: theme.scaleSpace(spacing.md),
          gap: theme.scaleSpace(6),
        },
        label: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          fontFamily: "InterBold",
          letterSpacing: 0.4,
          textTransform: "uppercase",
        },
        value: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(18),
          fontFamily: "InterBold",
        },
        subvalue: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        fileCard: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          padding: theme.scaleSpace(spacing.md),
          gap: theme.scaleSpace(6),
        },
        fileTitle: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(15),
          fontFamily: "InterBold",
        },
        meta: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          fontFamily: "InterMedium",
        },
        actions: {
          gap: theme.scaleSpace(spacing.sm),
        },
        inlineActions: {
          flexDirection: "row",
          gap: theme.scaleSpace(spacing.sm),
        },
        actionButton: {
          flex: 1,
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          fontFamily: "InterSemiBold",
        },
        infoText: {
          color: theme.colors.primary,
          fontSize: theme.scaleText(12),
          fontFamily: "InterSemiBold",
        },
      }),
    [theme],
  );

  return (
    <View style={styles.content}>
      <View style={styles.summaryCard}>
        <Text style={styles.label}>Module</Text>
        <Text style={styles.value}>{selectedModuleLabel}</Text>
        <Text style={styles.subvalue}>
          Download the template first if you want the exact headers and sample row.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          label={pickedFile ? "Choose Another File" : "Pick Import File"}
          leadingIcon={<FileUp size={16} color={theme.colors.primaryForeground} />}
          isLoading={isPickingFile}
          onPress={() => {
            void onPickFile();
          }}
        />
        <View style={styles.inlineActions}>
          <AppButton
            label="Template"
            variant="secondary"
            leadingIcon={<Download size={16} color={theme.colors.foreground} />}
            onPress={() => {
              void onDownloadTemplate();
            }}
            style={styles.actionButton}
          />
          <AppButton
            label="Preview"
            leadingIcon={<Upload size={16} color={theme.colors.primaryForeground} />}
            isLoading={isPreviewing}
            disabled={!pickedFile}
            onPress={() => {
              void onPreview();
            }}
            style={styles.actionButton}
          />
        </View>
        <AppButton
          label="Back"
          variant="secondary"
          onPress={onBack}
        />
      </View>

      {pickedFile ? (
        <View style={styles.fileCard}>
          <Text style={styles.label}>Selected File</Text>
          <Text style={styles.fileTitle}>{pickedFile.name}</Text>
          <Text style={styles.meta}>Format: {pickedFile.format.toUpperCase()}</Text>
          <Text style={styles.meta}>
            Size: {pickedFile.size !== null ? `${pickedFile.size} bytes` : "Unavailable"}
          </Text>
        </View>
      ) : null}

      {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}
