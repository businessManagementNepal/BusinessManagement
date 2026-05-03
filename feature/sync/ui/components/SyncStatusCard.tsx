import { Card } from "@/shared/components/reusable/Cards/Card";
import { useToastMessage } from "@/shared/components/reusable/Feedback/useToastMessage";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SyncStatusViewModel } from "../../viewModel/syncStatus.viewModel";

type SyncStatusCardProps = {
  viewModel: SyncStatusViewModel;
};

export function SyncStatusCard({ viewModel }: SyncStatusCardProps) {
  useToastMessage({
    message: viewModel.successMessage,
    type: "success",
  });

  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: theme.scaleSpace(spacing.md),
          padding: theme.scaleSpace(spacing.md),
        },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: theme.scaleSpace(spacing.md),
        },
        titleWrap: {
          flex: 1,
          gap: theme.scaleSpace(4),
        },
        title: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(16),
          fontFamily: "InterBold",
        },
        subtitle: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        statusPill: {
          alignSelf: "flex-start",
          borderRadius: radius.pill,
          backgroundColor: theme.colors.accent,
          paddingHorizontal: theme.scaleSpace(spacing.sm),
          paddingVertical: theme.scaleSpace(6),
        },
        statusPillText: {
          color: theme.colors.primary,
          fontSize: theme.scaleText(12),
          fontFamily: "InterSemiBold",
        },
        statsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.scaleSpace(spacing.md),
        },
        statCard: {
          minWidth: "30%",
          flexGrow: 1,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.scaleSpace(spacing.sm),
          gap: theme.scaleSpace(4),
        },
        statLabel: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(11),
          fontFamily: "InterMedium",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },
        statValue: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(16),
          fontFamily: "InterBold",
        },
        footerRow: {
          flexDirection: "row",
          gap: theme.scaleSpace(spacing.sm),
          alignItems: "center",
        },
        primaryButton: {
          flex: 1,
          minHeight: theme.scaleSpace(44),
          borderRadius: radius.lg,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: theme.scaleSpace(spacing.md),
        },
        secondaryButton: {
          minHeight: theme.scaleSpace(44),
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: theme.scaleSpace(spacing.md),
        },
        disabledButton: {
          opacity: 0.55,
        },
        primaryButtonText: {
          color: theme.colors.primaryForeground,
          fontSize: theme.scaleText(14),
          fontFamily: "InterBold",
        },
        secondaryButtonText: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(14),
          fontFamily: "InterSemiBold",
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterSemiBold",
        },
      }),
    [theme],
  );

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Sync</Text>
          <Text style={styles.subtitle}>{viewModel.rolloutLabel}</Text>
        </View>
        <Switch
          value={viewModel.syncEnabled}
          onValueChange={(value) => {
            void viewModel.onToggleSyncEnabled(value);
          }}
          disabled={viewModel.isSavingPreference || viewModel.isRunningManualSync}
        />
      </View>

      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>{viewModel.statusLabel}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>{viewModel.pendingCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Conflicts</Text>
          <Text style={styles.statValue}>{viewModel.conflictCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={styles.statValue}>{viewModel.failedCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Last Synced</Text>
          <Text style={styles.statValue}>{viewModel.lastSyncedLabel}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Pressable
          style={[
            styles.primaryButton,
            !viewModel.canRunManualSync ? styles.disabledButton : null,
          ]}
          onPress={() => {
            void viewModel.onRunManualSync();
          }}
          disabled={!viewModel.canRunManualSync}
        >
          {viewModel.isRunningManualSync ? (
            <ActivityIndicator color={theme.colors.primaryForeground} />
          ) : (
            <Text style={styles.primaryButtonText}>Sync Now</Text>
          )}
        </Pressable>

        {viewModel.errorMessage ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              void viewModel.onRetry();
            }}
          >
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>

      {viewModel.errorMessage ? (
        <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
      ) : null}

      {!viewModel.errorMessage && viewModel.noticeMessage ? (
        <Text style={styles.subtitle}>{viewModel.noticeMessage}</Text>
      ) : null}
    </Card>
  );
}
