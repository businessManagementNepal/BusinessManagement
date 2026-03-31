import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  ArrowLeftRight,
  BookOpen,
  CreditCard,
  Home,
  MoreHorizontal,
  PiggyBank,
  ShoppingCart,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabIconName, BottomTabItem, RouteName } from "@/shared/types/navigation";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";

type BottomTabBarProps<T extends string = RouteName> = {
  route: T;
  onNavigate: (route: T) => void;
  items?: readonly BottomTabItem<T>[];
};

const DEFAULT_ITEMS: readonly BottomTabItem<RouteName>[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "ledger", label: "Ledger", icon: "ledger" },
  { key: "pos", label: "POS", icon: "pos", center: true },
  { key: "transactions", label: "Txns", icon: "transactions" },
  { key: "more", label: "More", icon: "more" },
];

export function BottomTabBar<T extends string = RouteName>({
  route,
  onNavigate,
  items,
}: BottomTabBarProps<T>) {
  const insets = useSafeAreaInsets();
  const tabItems = items ?? (DEFAULT_ITEMS as readonly BottomTabItem<T>[]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      <View style={styles.row}>
        {tabItems.map((tabItem) => {
          const Icon = resolveIcon(tabItem.icon, String(tabItem.key));
          const isActive = route === tabItem.key;

          if (tabItem.center) {
            return (
              <Pressable
                key={tabItem.key}
                style={styles.centerItem}
                onPress={() => {
                  if (isActive) {
                    return;
                  }

                  onNavigate(tabItem.key);
                }}
                disabled={isActive}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.centerCircle}>
                  <Icon size={24} color={colors.primaryForeground} />
                </View>
                <Text style={[styles.label, isActive ? styles.activeLabel : null]}>
                  {tabItem.label}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tabItem.key}
              style={styles.item}
              onPress={() => {
                if (isActive) {
                  return;
                }

                onNavigate(tabItem.key);
              }}
              disabled={isActive}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Icon
                size={22}
                color={isActive ? colors.navActive : colors.navForeground}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text style={[styles.label, isActive ? styles.activeLabel : null]}>
                {tabItem.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const resolveIcon = (
  iconName: BottomTabIconName | undefined,
  fallbackRoute: string,
) => {
  const resolvedName = iconName ?? routeToIconName(fallbackRoute);

  switch (resolvedName) {
    case "home":
      return Home;
    case "ledger":
      return BookOpen;
    case "pos":
      return ShoppingCart;
    case "transactions":
      return ArrowLeftRight;
    case "budget":
      return PiggyBank;
    case "emi":
      return CreditCard;
    case "more":
      return MoreHorizontal;
    default:
      return Home;
  }
};

const routeToIconName = (route: string): BottomTabIconName => {
  switch (route) {
    case "ledger":
      return "ledger";
    case "pos":
      return "pos";
    case "transactions":
      return "transactions";
    case "budget":
      return "budget";
    case "emi":
      return "emi";
    case "more":
      return "more";
    default:
      return "home";
  }
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.nav,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    zIndex: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: spacing.xs,
  },
  centerItem: {
    flex: 1,
    alignItems: "center",
    marginTop: -(spacing.xl + spacing.xs),
  },
  centerCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 2,
    color: colors.navForeground,
    fontSize: 10,
    fontFamily: "InterSemiBold",
  },
  activeLabel: {
    color: colors.navActive,
    fontFamily: "InterBold",
  },
});

