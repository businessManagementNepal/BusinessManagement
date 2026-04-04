import React from "react";
import { createLocalInventoryDatasource } from "@/feature/inventory/data/dataSource/local.inventory.datasource.impl";
import { createInventoryRepository } from "@/feature/inventory/data/repository/inventory.repository.impl";
import { createGetInventorySnapshotUseCase } from "@/feature/inventory/useCase/getInventorySnapshot.useCase.impl";
import { createSaveInventoryMovementUseCase } from "@/feature/inventory/useCase/saveInventoryMovement.useCase.impl";
import { useInventoryViewModel } from "@/feature/inventory/viewModel/inventory.viewModel.impl";
import { InventoryScreen } from "@/feature/inventory/ui/InventoryScreen";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import appDatabase from "@/shared/database/appDatabase";

const INVENTORY_MANAGE_PERMISSION_CODE = "inventory.manage";

type Props = {
  activeAccountRemoteId: string | null;
  activeUserRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
};

export function GetInventoryScreenFactory({
  activeAccountRemoteId,
  activeUserRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
}: Props) {
  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });

  const datasource = React.useMemo(
    () => createLocalInventoryDatasource(appDatabase),
    [],
  );
  const repository = React.useMemo(
    () => createInventoryRepository(datasource),
    [datasource],
  );
  const getInventorySnapshotUseCase = React.useMemo(
    () => createGetInventorySnapshotUseCase(repository),
    [repository],
  );
  const saveInventoryMovementUseCase = React.useMemo(
    () => createSaveInventoryMovementUseCase(repository),
    [repository],
  );

  const viewModel = useInventoryViewModel({
    accountRemoteId: activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    canManage: permissionAccess.hasPermission(INVENTORY_MANAGE_PERMISSION_CODE),
    getInventorySnapshotUseCase,
    saveInventoryMovementUseCase,
  });

  return <InventoryScreen viewModel={viewModel} />;
}
