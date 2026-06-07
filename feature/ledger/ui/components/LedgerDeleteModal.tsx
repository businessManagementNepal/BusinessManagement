import React from "react";
import { ConfirmDeleteModal } from "@/shared/components/reusable/Modals/ConfirmDeleteModal";
import { LedgerDeleteViewModel } from "@/feature/ledger/viewModel/ledgerDelete.viewModel";

type LedgerDeleteModalProps = {
  viewModel: LedgerDeleteViewModel;
};

export function LedgerDeleteModal({
  viewModel,
}: LedgerDeleteModalProps) {
  return (
    <ConfirmDeleteModal
      visible={Boolean(viewModel.pendingDeleteRemoteId)}
      title="Delete ledger entry?"
      message="This removes the selected ledger entry from this business ledger list. You can not undo this from the current screen."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      isDeleting={viewModel.isDeleting}
      errorMessage={viewModel.errorMessage}
      onCancel={viewModel.closeDelete}
      onConfirm={() => void viewModel.confirmDelete()}
    />
  );
}
