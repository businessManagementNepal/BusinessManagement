import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../Cards/Card';
import { colors } from '../../theme/colors';


interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

export function QuickActionButton({ label, icon, onPress }: QuickActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card style={styles.card}>
        <View style={styles.icon}>{icon}</View>
        <Text style={styles.label}>{label}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '23.5%',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    paddingHorizontal: 8,
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    color: colors.cardForeground,
    fontSize: 11,
    fontFamily: "InterBold",
    textAlign: 'center',
  },
});

