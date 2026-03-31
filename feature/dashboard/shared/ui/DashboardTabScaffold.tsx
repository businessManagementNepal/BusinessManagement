import React from "react";
import { StyleSheet, Text } from "react-native";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";

type DashboardTabScaffoldProps = {
  children: React.ReactNode;
};

export function DashboardTabScaffold({
  children,
}: DashboardTabScaffoldProps) {
  return (
    <ScreenContainer
      showDivider={false}
      contentContainerStyle={styles.scrollContent}
    >
      {children}
    </ScreenContainer>
  );
}

type DashboardInfoCardProps = {
  title: string;
  description: string;
};

export function DashboardInfoCard({
  title,
  description,
}: DashboardInfoCardProps) {
  return (
    <Card style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <Text style={styles.infoCardDescription}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  infoCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  infoCardTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
    marginBottom: 4,
  },
  infoCardDescription: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 19,
  },
});

