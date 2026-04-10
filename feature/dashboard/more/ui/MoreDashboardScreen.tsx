import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Boxes,
  Box,
  Calculator,
  ChevronRight,
  CreditCard,
  ReceiptText,
  PieChart,
  StickyNote,
  PiggyBank,
  ShieldCheck,
  ShoppingCart,
  LogOut,
  Settings2,
  Tags,
  User,
  WalletCards,
  Users,
} from "lucide-react-native";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { MoreDashboardViewModel } from "../viewModel/moreDashboard.viewModel";
import { MoreDashboardMenuItemId } from "../types/moreDashboard.types";

type MoreDashboardScreenProps = {
  viewModel: MoreDashboardViewModel;
};

export function MoreDashboardScreen({ viewModel }: MoreDashboardScreenProps) {
  return (
    <DashboardTabScaffold
      footer={null}
      baseBottomPadding={110}
      contentContainerStyle={null}
      showDivider={false}
    >
      {viewModel.sections.map((section) => (
        <View key={section.id} style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Card style={styles.sectionCard}>
            {section.items.map((item) => (
              <Pressable
                key={item.id}
                style={styles.row}
                onPress={() => viewModel.onMenuItemPress(item.id)}
                accessibilityRole="button"
              >
                <View style={styles.iconWrap}>{getItemIcon(item.id)}</View>

                <View style={styles.rowBody}>
                  <Text
                    style={
                      item.id === "logout" ? styles.logoutTitle : styles.rowTitle
                    }
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                </View>

                <ChevronRight size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
    </DashboardTabScaffold>
  );
}

const getItemIcon = (itemId: MoreDashboardMenuItemId) => {
  switch (itemId) {
    case "profile":
      return <User size={18} color={colors.primary} />;
    case "ledger":
      return <BookOpen size={18} color={colors.primary} />;
    case "pos":
      return <ShoppingCart size={18} color={colors.primary} />;
    case "orders":
      return <ReceiptText size={18} color={colors.primary} />;
    case "reports":
      return <PieChart size={18} color={colors.primary} />;
    case "products":
      return <Box size={18} color={colors.primary} />;
    case "categories":
      return <Tags size={18} color={colors.primary} />;
    case "inventory":
      return <Boxes size={18} color={colors.primary} />;
    case "moneyAccounts":
      return <WalletCards size={18} color={colors.primary} />;
    case "contacts":
      return <Users size={18} color={colors.primary} />;
    case "billing":
      return <ReceiptText size={18} color={colors.primary} />;
    case "taxCalculator":
      return <Calculator size={18} color={colors.primary} />;
    case "notes":
      return <StickyNote size={18} color={colors.primary} />;
    case "emi":
      return <CreditCard size={18} color={colors.primary} />;
    case "transactions":
      return <ArrowLeftRight size={18} color={colors.primary} />;
    case "budget":
      return <PiggyBank size={18} color={colors.primary} />;
    case "userManagement":
      return <ShieldCheck size={18} color={colors.primary} />;
    case "settings":
      return <Settings2 size={18} color={colors.primary} />;
    case "notifications":
      return <Bell size={18} color={colors.primary} />;
    case "logout":
      return <LogOut size={18} color={colors.destructive} />;
    default:
      return <User size={18} color={colors.primary} />;
  }
};

const styles = StyleSheet.create({
  sectionWrap: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterBold",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectionCard: {
    padding: 0,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
    marginBottom: 2,
  },
  logoutTitle: {
    color: colors.destructive,
    fontSize: 14,
    fontFamily: "InterBold",
    marginBottom: 2,
  },
  rowSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
  },
});
