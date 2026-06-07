import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

type SectionProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

type MoreDetailsSectionProps = SectionProps & {
  collapsed?: boolean;
  defaultExpanded?: boolean;
  disabled?: boolean;
  onToggleCollapsed?: (collapsed: boolean) => void;
};

function SectionHeading({
  title,
  subtitle,
}: Pick<SectionProps, "title" | "subtitle">) {
  const styles = useThemedStyles(createStyles);

  if (!title && !subtitle) {
    return null;
  }

  return (
    <View style={styles.heading}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function DefaultSection({
  children,
  title,
  subtitle,
  style,
  contentStyle,
}: SectionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.section, style]}>
      <SectionHeading title={title} subtitle={subtitle} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export function SummarySection({
  children,
  title = "Summary",
  subtitle,
  style,
  contentStyle,
}: SectionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.section, style]}>
      <SectionHeading title={title} subtitle={subtitle} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export function MoreDetailsSection({
  children,
  title = "More Details",
  subtitle,
  style,
  contentStyle,
  collapsed,
  defaultExpanded = false,
  disabled = false,
  onToggleCollapsed,
}: MoreDetailsSectionProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const isControlled = typeof collapsed === "boolean";
  const expanded = isControlled ? !collapsed : isExpanded;

  const handleToggle = React.useCallback(() => {
    if (disabled) {
      return;
    }

    const nextExpanded = !expanded;
    if (!isControlled) {
      setIsExpanded(nextExpanded);
    }

    onToggleCollapsed?.(!nextExpanded);
  }, [disabled, expanded, isControlled, onToggleCollapsed]);

  return (
    <View style={[styles.moreDetailsSection, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.moreDetailsToggle,
          disabled ? styles.disabledToggle : null,
          pressed && !disabled ? styles.pressedToggle : null,
        ]}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded, disabled }}
        disabled={disabled}
      >
        <View style={styles.moreDetailsHeading}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {expanded ? (
          <ChevronUp size={18} color={theme.colors.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={theme.colors.mutedForeground} />
        )}
      </Pressable>

      {expanded ? (
        <View style={[styles.moreDetailsContent, contentStyle]}>{children}</View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    section: {
      gap: theme.scaleSpace(spacing.sm),
    },
    heading: {
      gap: theme.scaleSpace(2),
    },
    title: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterBold",
    },
    subtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    content: {
      gap: theme.scaleSpace(spacing.sm),
    },
    moreDetailsSection: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.card,
      overflow: "hidden",
    },
    moreDetailsToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.md),
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.sm),
      backgroundColor: theme.colors.background,
    },
    moreDetailsHeading: {
      flex: 1,
      gap: theme.scaleSpace(2),
    },
    moreDetailsContent: {
      gap: theme.scaleSpace(spacing.sm),
      padding: theme.scaleSpace(spacing.md),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
    },
    disabledToggle: {
      opacity: 0.7,
    },
    pressedToggle: {
      opacity: 0.92,
    },
  });
