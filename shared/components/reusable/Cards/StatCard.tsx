import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors } from '../../theme/colors';


interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  valueColor?: string;
}

export function StatCard({ icon, value, label, valueColor }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 104,
  },
  iconWrap: {
    marginBottom: 6,
  },
  value: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
    marginBottom: 2,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 11,
    textAlign: 'center',
  },
});

