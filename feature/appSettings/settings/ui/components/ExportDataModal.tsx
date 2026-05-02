import { SettingsViewModel } from "@/feature/appSettings/settings/viewModel/settings.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { Check, Download } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  SettingsDataTransferFormat,
  SettingsDataTransferFormatValue,
  SettingsDataTransferModuleValue,
} from "../../types/settings.types";

type ExportDataModalProps = {
  visible: boolean;
  subtitle: string;
  format: SettingsDataTransferFormatValue;
  moduleSelections: SettingsViewModel["exportDataModuleSelections"];
  isExporting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onChangeFormat: (value: SettingsDataTransferFormatValue) => void;
  onToggleModule: (id: SettingsDataTransferModuleValue) => void;
  onSubmit: () => Promise<void>;
};

type FormatToggleButtonProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

const FormatToggleButton = ({
  active,
  label,
  onPress,
}: FormatToggleButtonProps) => {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        formatButton: {
          flex: 1,
          minHeight: theme.scaleSpace(48),
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
        },
        formatButtonActive: {
          backgroundColor: theme.colors.primary,
        },
        formatLabel: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(16),
          fontFamily: "InterBold",
        },
        formatLabelActive: {
          color: theme.colors.primaryForeground,
        },
      }),
    [theme],
  );

  return (
    <Pressable
      style={[styles.formatButton, active ? styles.formatButtonActive : null]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.formatLabel, active ? styles.formatLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
};

export function ExportDataModal({
  visible,
  subtitle,
  format,
  moduleSelections,
  isExporting,
  errorMessage,
  onClose,
  onChangeFormat,
  onToggleModule,
  onSubmit,
}: ExportDataModalProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.scaleSpace(spacing.md),
        },
        sectionBlock: {
          gap: theme.scaleSpace(spacing.sm),
        },
        sectionLabel: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          fontFamily: "InterBold",
          letterSpacing: 0.3,
        },
        formatRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.scaleSpace(spacing.xs),
          backgroundColor: theme.colors.secondary,
          padding: 3,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        moduleList: {
          gap: theme.scaleSpace(spacing.sm),
        },
        moduleRow: {
          minHeight: theme.scaleSpace(58),
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.secondary,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.scaleSpace(spacing.sm),
          paddingHorizontal: theme.scaleSpace(spacing.md),
        },
        checkbox: {
          width: theme.scaleSpace(22),
          height: theme.scaleSpace(22),
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          alignItems: "center",
          justifyContent: "center",
        },
        checkboxActive: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primary,
        },
        moduleLabel: {
          flex: 1,
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(17),
          fontFamily: "InterMedium",
        },
        exportButton: {
          width: "100%",
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          fontFamily: "InterSemiBold",
        },
      }),
    [theme],
  );

  return (
    <FormSheetModal
      visible={visible}
      title="Export Data"
      subtitle={subtitle}
      onClose={onClose}
      closeAccessibilityLabel="Close export data"
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
      footer={
        <AppButton
          label={isExporting ? "Exporting..." : "Export Data"}
          size="lg"
          leadingIcon={
            <Download size={16} color={theme.colors.primaryForeground} />
          }
          onPress={() => {
            void onSubmit();
          }}
          disabled={isExporting}
          style={styles.exportButton}
        />
      }
    >
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>FORMAT</Text>
        <View style={styles.formatRow}>
          <FormatToggleButton
            active={format === SettingsDataTransferFormat.Csv}
            label="CSV"
            onPress={() => onChangeFormat(SettingsDataTransferFormat.Csv)}
          />
          <FormatToggleButton
            active={format === SettingsDataTransferFormat.Excel}
            label="Excel"
            onPress={() => onChangeFormat(SettingsDataTransferFormat.Excel)}
          />
          <FormatToggleButton
            active={format === SettingsDataTransferFormat.Pdf}
            label="PDF"
            onPress={() => onChangeFormat(SettingsDataTransferFormat.Pdf)}
          />
          <FormatToggleButton
            active={format === SettingsDataTransferFormat.Json}
            label="JSON Backup"
            onPress={() => onChangeFormat(SettingsDataTransferFormat.Json)}
          />
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>DATA TO EXPORT</Text>
        <View style={styles.moduleList}>
          {moduleSelections.map((selection) => (
            <Pressable
              key={selection.id}
              style={styles.moduleRow}
              onPress={() => onToggleModule(selection.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selection.selected }}
            >
              <View
                style={[
                  styles.checkbox,
                  selection.selected ? styles.checkboxActive : null,
                ]}
              >
                {selection.selected ? (
                  <Check size={14} color={theme.colors.card} />
                ) : null}
              </View>
              <Text style={styles.moduleLabel}>{selection.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </FormSheetModal>
  );
}
