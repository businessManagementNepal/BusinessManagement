import { createLocalInventoryDatasource } from "@/feature/inventory/data/dataSource/local.inventory.datasource.impl";
import { createInventoryRepository } from "@/feature/inventory/data/repository/inventory.repository.impl";
import { createCreateOpeningStockForProductUseCase } from "@/feature/inventory/useCase/createOpeningStockForProduct.useCase.impl";
import { createSaveInventoryMovementUseCase } from "@/feature/inventory/useCase/saveInventoryMovement.useCase.impl";
import { createLocalProductDatasource } from "@/feature/products/data/dataSource/local.product.datasource.impl";
import { createProductRepository } from "@/feature/products/data/repository/product.repository.impl";
import { ProductsScreen } from "@/feature/products/ui/ProductsScreen";
import { createCreateProductWithOpeningStockUseCase } from "@/feature/products/useCase/createProductWithOpeningStock.useCase.impl";
import { createDeleteProductUseCase } from "@/feature/products/useCase/deleteProduct.useCase.impl";
import { createGetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase.impl";
import { createSaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase.impl";
import { useProductsViewModel } from "@/feature/products/viewModel/products.viewModel.impl";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import appDatabase from "@/shared/database/appDatabase";
import React from "react";

const PRODUCTS_MANAGE_PERMISSION_CODE = "products.manage";

type Props = {
  activeAccountRemoteId: string | null;
  activeUserRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
};

export function GetProductsScreenFactory({
  activeAccountRemoteId,
  activeUserRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  activeAccountDefaultTaxRatePercent,
}: Props) {
  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });

  const datasource = React.useMemo(
    () => createLocalProductDatasource(appDatabase),
    [],
  );
  const repository = React.useMemo(
    () => createProductRepository(datasource),
    [datasource],
  );
  const getProductsUseCase = React.useMemo(
    () => createGetProductsUseCase(repository),
    [repository],
  );
  const saveProductUseCase = React.useMemo(
    () => createSaveProductUseCase(repository),
    [repository],
  );
  const inventoryDatasource = React.useMemo(
    () => createLocalInventoryDatasource(appDatabase),
    [],
  );
  const inventoryRepository = React.useMemo(
    () => createInventoryRepository(inventoryDatasource),
    [inventoryDatasource],
  );
  const saveInventoryMovementUseCase = React.useMemo(
    () => createSaveInventoryMovementUseCase(inventoryRepository),
    [inventoryRepository],
  );
  const createOpeningStockForProductUseCase = React.useMemo(
    () =>
      createCreateOpeningStockForProductUseCase({
        productRepository: repository,
        saveInventoryMovementUseCase,
      }),
    [repository, saveInventoryMovementUseCase],
  );
  const deleteProductUseCase = React.useMemo(
    () => createDeleteProductUseCase(repository),
    [repository],
  );
  const createProductWithOpeningStockUseCase = React.useMemo(
    () =>
      createCreateProductWithOpeningStockUseCase({
        saveProductUseCase,
        deleteProductUseCase,
        createOpeningStockForProductUseCase,
      }),
    [
      createOpeningStockForProductUseCase,
      deleteProductUseCase,
      saveProductUseCase,
    ],
  );

  const viewModel = useProductsViewModel({
    accountRemoteId: activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    activeAccountDefaultTaxRatePercent,
    canManage: permissionAccess.hasPermission(PRODUCTS_MANAGE_PERMISSION_CODE),
    getProductsUseCase,
    saveProductUseCase,
    createProductWithOpeningStockUseCase,
    deleteProductUseCase,
  });

  return <ProductsScreen viewModel={viewModel} />;
}

