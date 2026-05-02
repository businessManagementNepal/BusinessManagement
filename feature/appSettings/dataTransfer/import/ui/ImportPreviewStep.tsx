import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ImportPreviewResult } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

type ImportPreviewStepProps = {
  previewResult: ImportPreviewResult;
  isConfirming: boolean;
  errorMessage: string | null;
  onConfirm: () => Promise<void>;
  onBack: () => void;
};

const formatRowSummary = (
  row: ImportPreviewResult["rowResults"][number],
): string => {
  if (row.errors.length > 0) {
    return row.errors.join(" ");
  }

  if (row.warnings.length > 0) {
    return row.warnings.join(" ");
  }

  return "Ready to import.";
};

export function ImportPreviewStep({
  previewResult,
  isConfirming,
  errorMessage,
  onConfirm,
  onBack,
}: ImportPreviewStepProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.scaleSpace(spacing.md),
        },
        statsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.scaleSpace(spacing.sm),
        },
        statCard: {
          minWidth: "47%",
          flexGrow: 1,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.secondary,
          padding: theme.scaleSpace(spacing.md),
          gap: theme.scaleSpace(4),
        },
        statLabel: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(11),
          fontFamily: "InterBold",
          letterSpacing: 0.4,
          textTransform: "uppercase",
        },
        statValue: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(18),
          fontFamily: "InterBold",
        },
        warningCard: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.accent,
          padding: theme.scaleSpace(spacing.md),
          gap: theme.scaleSpace(6),
        },
        warningText: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        rowList: {
          gap: theme.scaleSpace(spacing.sm),
        },
        rowCard: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          padding: theme.scaleSpace(spacing.md),
          gap: theme.scaleSpace(4),
        },
        rowHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: theme.scaleSpace(spacing.sm),
        },
        rowTitle: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(14),
          fontFamily: "InterBold",
        },
        rowStatus: {
          color: theme.colors.primary,
          fontSize: theme.scaleText(12),
          fontFamily: "InterBold",
          textTransform: "uppercase",
        },
        rowBody: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          fontFamily: "InterSemiBold",
        },
        actions: {
          gap: theme.scaleSpace(spacing.sm),
        },
      }),
    [theme],
  );

  return (
    <View style={styles.content}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>File</Text>
          <Text style={styles.statValue}>{previewResult.fileName}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rows</Text>
          <Text style={styles.statValue}>{previewResult.totalRows}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Importable</Text>
          <Text style={styles.statValue}>{previewResult.validRows}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Duplicates</Text>
          <Text style={styles.statValue}>{previewResult.duplicateRows}</Text>
        </View>
      </View>

      {previewResult.warnings.length > 0 ? (
        <View style={styles.warningCard}>
          {previewResult.warnings.map((warning) => (
            <Text key={`${warning.code}-${warning.message}`} style={styles.warningText}>
              {warning.message}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.rowList}>
        {previewResult.rowResults.map((row) => (
          <View key={row.rowNumber} style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>Row {row.rowNumber}</Text>
              <Text style={styles.rowStatus}>{row.status}</Text>
            </View>
            <Text style={styles.rowBody}>{formatRowSummary(row)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton
          label="Confirm Import"
          isLoading={isConfirming}
          onPress={() => {
            void onConfirm();
          }}
        />
        <AppButton label="Back" variant="secondary" onPress={onBack} />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}
