import React from "react";
import { AccountSelectionScreen } from "../ui/AccountSelectionScreen";

type GetAccountSelectionScreenFactoryProps = {
  onBackToLogin: () => void;
};

export function GetAccountSelectionScreenFactory({
  onBackToLogin,
}: GetAccountSelectionScreenFactoryProps) {
  return <AccountSelectionScreen onBackToLogin={onBackToLogin} />;
}
