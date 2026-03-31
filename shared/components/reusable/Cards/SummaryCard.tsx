import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius } from "@/shared/components/theme/spacing";

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  valueColor: string;
  iconBg: string;
}

export function SummaryCard({
  icon,
  title,
  value,
  valueColor,
  iconBg,
}: SummaryCardProps) {
  return (
    <Card style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 126,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontFamily: "InterBold",
  },
});

