import React from "react";
import { useMoreDashboardViewModel } from "../viewModel/moreDashboard.viewModel.impl";
import { MoreDashboardScreen } from "../ui/MoreDashboardScreen";
import { MoreDashboardMenuAccessPredicate } from "../types/moreDashboard.types";

type GetMoreDashboardScreenFactoryProps = {
  isBusinessMode: boolean;
  onOpenProfile: () => void;
  onOpenLedger: () => void;
  onOpenPos: () => void;
  onOpenOrders: () => void;
  onOpenReports: () => void;
  onOpenProducts: () => void;
  onOpenCategories: () => void;
  onOpenInventory: () => void;
  onOpenMoneyAccounts: () => void;
  onOpenContacts: () => void;
  onOpenBilling: () => void;
  onOpenTaxCalculator: () => void;
  onOpenNotes: () => void;
  onOpenEmi: () => void;
  onOpenTransactions: () => void;
  onOpenBudget: () => void;
  onOpenUserManagement: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onLogout: () => Promise<void>;
  hasMenuAccess: MoreDashboardMenuAccessPredicate;
};

export function GetMoreDashboardScreenFactory({
  isBusinessMode,
  onOpenProfile,
  onOpenLedger,
  onOpenPos,
  onOpenOrders,
  onOpenReports,
  onOpenProducts,
  onOpenCategories,
  onOpenInventory,
  onOpenMoneyAccounts,
  onOpenContacts,
  onOpenBilling,
  onOpenTaxCalculator,
  onOpenNotes,
  onOpenEmi,
  onOpenTransactions,
  onOpenBudget,
  onOpenUserManagement,
  onOpenSettings,
  onOpenNotifications,
  onLogout,
  hasMenuAccess,
}: GetMoreDashboardScreenFactoryProps) {
  const viewModel = useMoreDashboardViewModel({
    isBusinessMode,
    onOpenProfile,
    onOpenLedger,
    onOpenPos,
    onOpenOrders,
    onOpenReports,
    onOpenProducts,
    onOpenCategories,
    onOpenInventory,
    onOpenMoneyAccounts,
    onOpenContacts,
    onOpenBilling,
    onOpenTaxCalculator,
    onOpenNotes,
    onOpenEmi,
    onOpenTransactions,
    onOpenBudget,
    onOpenUserManagement,
    onOpenSettings,
    onOpenNotifications,
    onLogout,
    hasMenuAccess,
  });

  return <MoreDashboardScreen viewModel={viewModel} />;
}
