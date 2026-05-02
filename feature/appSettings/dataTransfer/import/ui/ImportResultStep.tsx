import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ConfirmImportResult } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

type ImportResultStepProps = {
  result: ConfirmImportResult;
  onClose: () => void;
  onStartOver: () => void;
};

export function ImportResultStep({
  result,
  onClose,
  onStartOver,
}: ImportResultStepProps) {
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
        errorList: {
          gap: theme.scaleSpace(6),
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        actions: {
          gap: theme.scaleSpace(spacing.sm),
        },
      }),
    [theme],
  );

  return (
    <View style={styles.content}>
      <View style={styles.summaryCard}>
        <Text style={styles.label}>Imported</Text>
        <Text style={styles.value}>{result.importedRows}</Text>
        <Text style={styles.label}>Skipped</Text>
        <Text style={styles.value}>{result.skippedRows}</Text>
        <Text style={styles.label}>Failed</Text>
        <Text style={styles.value}>{result.failedRows}</Text>
      </View>

      {result.errors.length > 0 ? (
        <View style={styles.errorList}>
          {result.errors.map((errorMessage) => (
            <Text key={errorMessage} style={styles.errorText}>
              {errorMessage}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton label="Import Another File" onPress={onStartOver} />
        <AppButton label="Close" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}
