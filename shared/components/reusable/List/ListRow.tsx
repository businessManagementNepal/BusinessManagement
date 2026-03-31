import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";

interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
}

export function ListRow({ title, subtitle, value, icon, onPress }: ListRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  value: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterBold",
    marginRight: 6,
  },
});

