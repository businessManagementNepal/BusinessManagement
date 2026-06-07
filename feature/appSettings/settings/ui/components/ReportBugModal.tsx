import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BUG_SEVERITY_OPTIONS } from "../../types/settings.types";
import { SettingsReportBugForm } from "../../viewModel/settings.viewModel";

type ReportBugModalProps = {
  visible: boolean;
  form: SettingsReportBugForm;
  deviceInfoLabel: string;
  appVersionLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onChange: (field: keyof SettingsReportBugForm, value: string) => void;
  onSubmit: () => Promise<void>;
};

export function ReportBugModal({
  visible,
  form,
  deviceInfoLabel,
  appVersionLabel,
  isSubmitting,
  errorMessage,
  onClose,
  onChange,
  onSubmit,
}: ReportBugModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <FormSheetModal
      visible={visible}
      title="Report a Bug"
      onClose={onClose}
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
    >
      <LabeledTextInput
        label="Bug Title"
        value={form.title}
        onChangeText={(value) => onChange("title", value)}
        placeholder="Briefly describe the issue"
      />

      <LabeledTextInput
        label="Description"
        value={form.description}
        onChangeText={(value) => onChange("description", value)}
        placeholder="Steps to reproduce, what happened, what you expected..."
        multiline={true}
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Severity</Text>
        <FilterChipGroup
          options={BUG_SEVERITY_OPTIONS.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
          selectedValue={form.severity}
          onSelect={(value) => onChange("severity", value)}
        />
      </View>

      <Card style={styles.metaCard}>
        <Text style={styles.metaText}>Device info: {deviceInfoLabel}</Text>
        <Text style={styles.metaText}>App version: {appVersionLabel}</Text>
      </Card>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <AppButton
        label={isSubmitting ? "Submitting Report..." : "Submit Bug Report"}
        size="lg"
        onPress={() => {
          void onSubmit();
        }}
        disabled={isSubmitting}
      />
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.md),
    },
    fieldWrap: {
      gap: theme.scaleSpace(6),
    },
    fieldLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.45,
    },
    metaCard: {
      backgroundColor: theme.colors.accent,
      gap: theme.scaleSpace(6),
    },
    metaText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterSemiBold",
    },
  });
