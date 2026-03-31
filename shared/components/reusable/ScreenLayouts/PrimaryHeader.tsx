import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Bell, ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";

interface PrimaryHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onProfilePress?: () => void;
  onBellPress?: () => void;
  rightLabel?: string;
  showBell?: boolean;
  showProfile?: boolean;
  topInsetEnabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  rightContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  bottomContentStyle?: StyleProp<ViewStyle>;
}

export function PrimaryHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  onProfilePress,
  onBellPress,
  rightLabel = "KD",
  showBell = true,
  showProfile = true,
  topInsetEnabled = true,
  containerStyle,
  rightContent,
  bottomContent,
  bottomContentStyle,
}: PrimaryHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop: (topInsetEnabled ? insets.top : 0) + 12 },
        containerStyle,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.leftRow}>
          {showBack ? (
            <Pressable onPress={onBack} style={styles.iconButton} accessibilityRole="button">
              <ChevronLeft color={colors.headerForeground} size={22} />
            </Pressable>
          ) : (
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>eL</Text>
            </View>
          )}
          <View>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        {rightContent ? (
          rightContent
        ) : (
          <View style={styles.rightRow}>
            {showBell ? (
              <Pressable
                style={styles.iconButton}
                onPress={onBellPress}
                accessibilityRole="button"
              >
                <Bell color={colors.headerForeground} size={20} />
              </Pressable>
            ) : null}
            {showProfile ? (
              <Pressable
                style={styles.profileButton}
                onPress={onProfilePress}
                accessibilityRole="button"
              >
                <Text style={styles.profileText}>{rightLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      {bottomContent ? (
        <View style={[styles.bottomContent, bottomContentStyle]}>{bottomContent}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.header,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.headerForeground,
    fontFamily: "InterBold",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    color: colors.headerForeground,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginBottom: 2,
  },
  title: {
    color: colors.headerForeground,
    fontSize: 20,
    fontFamily: "InterBold",
  },
  bottomContent: {
    marginTop: 14,
  },
});
