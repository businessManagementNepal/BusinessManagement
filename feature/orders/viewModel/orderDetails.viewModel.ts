import { Contact } from "@/feature/contacts/types/contact.types";
import { GetOrderByIdUseCase } from "@/feature/orders/useCase/getOrderById.useCase";
import { GetOrderSettlementSnapshotsUseCase } from "@/feature/orders/useCase/getOrderSettlementSnapshots.useCase";
import { Product } from "@/feature/products/types/product.types";
import { OrderDetailView } from "./orders.viewModel";

export type OrderDetailsViewModelParams = {
  accountRemoteId: string | null;
  ownerUserRemoteId: string | null;
  accountCountryCode: string | null;
  resolvedCurrencyCode: string;
  taxRatePercent: number;
  contactsByRemoteId: ReadonlyMap<string, Contact>;
  productsByRemoteId: ReadonlyMap<string, Product>;
  getOrderByIdUseCase: GetOrderByIdUseCase;
  getOrderSettlementSnapshotsUseCase: GetOrderSettlementSnapshotsUseCase;
  setErrorMessage: (message: string | null) => void;
};

export type OrderDetailsViewModelState = {
  isDetailVisible: boolean;
  detail: OrderDetailView | null;
  onOpenDetail: (remoteId: string) => Promise<void>;
  onCloseDetail: () => void;
  refreshDetail: (remoteId: string) => Promise<void>;
};

