import type { LedgerEntry } from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import type { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import type { Transaction } from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDirection,
  TransactionPostingStatus,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import type { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import { createGetBusinessDashboardReadModelUseCase } from "@/feature/dashboard/business/readModel/useCase/getBusinessDashboardReadModel.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const todayAt = (hour: number): number => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
};

const daysAgoAt = (daysAgo: number, hour: number): number => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
};

const buildTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  remoteId: "txn-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Business Account",
  transactionType: TransactionType.Income,
  direction: TransactionDirection.In,
  title: "Sale Payment",
  amount: 100,
  currencyCode: "NPR",
  categoryRemoteId: null,
  categoryNameSnapshot: null,
  categoryLabel: "Sales",
  note: null,
  happenedAt: todayAt(10),
  settlementMoneyAccountRemoteId: "money-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash",
  sourceModule: TransactionSourceModule.Pos,
  sourceRemoteId: "sale-1",
  sourceAction: "checkout",
  idempotencyKey: null,
  postingStatus: TransactionPostingStatus.Posted,
  contactRemoteId: null,
  createdAt: todayAt(10),
  updatedAt: todayAt(10),
  ...overrides,
});

const buildLedgerEntry = (
  overrides: Partial<LedgerEntry> = {},
): LedgerEntry => ({
  remoteId: "ledger-1",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  partyName: "Customer One",
  partyPhone: "9800000000",
  contactRemoteId: "contact-1",
  entryType: LedgerEntryType.Sale,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "Sale Due",
  amount: 500,
  currencyCode: "NPR",
  note: null,
  happenedAt: daysAgoAt(2, 9),
  dueAt: daysAgoAt(1, 0),
  paymentMode: null,
  referenceNumber: "INV-1",
  reminderAt: null,
  attachmentUri: null,
  settledAgainstEntryRemoteId: null,
  linkedDocumentRemoteId: null,
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  createdAt: daysAgoAt(2, 9),
  updatedAt: daysAgoAt(2, 9),
  ...overrides,
});

const createUseCase = ({
  transactions,
  ledgerEntries,
}: {
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
}) => {
  const getTransactionsUseCase: GetTransactionsUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: transactions,
    })),
  };

  const getLedgerEntriesUseCase: GetLedgerEntriesUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: ledgerEntries,
    })),
  };

  return {
    useCase: createGetBusinessDashboardReadModelUseCase({
      getTransactionsUseCase,
      getLedgerEntriesUseCase,
    }),
    getTransactionsUseCase,
    getLedgerEntriesUseCase,
  };
};

describe("getBusinessDashboardReadModel.useCase", () => {
  it("builds dashboard read model from transactions and ledger entries", async () => {
    const { useCase } = createUseCase({
      transactions: [
        buildTransaction({
          remoteId: "txn-in",
          direction: TransactionDirection.In,
          amount: 100,
          happenedAt: todayAt(10),
        }),
        buildTransaction({
          remoteId: "txn-out",
          direction: TransactionDirection.Out,
          amount: 40,
          happenedAt: todayAt(11),
          title: "Expense Payment",
          categoryLabel: "Expense",
        }),
      ],
      ledgerEntries: [
        buildLedgerEntry({
          remoteId: "ledger-receive",
          entryType: LedgerEntryType.Sale,
          balanceDirection: LedgerBalanceDirection.Receive,
          amount: 500,
        }),
        buildLedgerEntry({
          remoteId: "ledger-pay",
          partyName: "Supplier One",
          partyPhone: "9811111111",
          contactRemoteId: "supplier-1",
          entryType: LedgerEntryType.Purchase,
          balanceDirection: LedgerBalanceDirection.Pay,
          amount: 200,
        }),
      ],
    });

    const result = await useCase.execute({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "business-1",
      currencyCode: "NPR",
      countryCode: "NP",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value.summaryCards).toHaveLength(2);
      expect(result.value.summaryCards[0]?.id).toBe("to-receive");
      expect(result.value.summaryCards[1]?.id).toBe("to-pay");
      expect(result.value.overdueCountLabel).toBe("2");
      expect(result.value.todayTransactionRows).toHaveLength(2);
      expect(result.value.profitOverviewSeries).toHaveLength(7);
    }
  });

  it("fails when active account context is missing", async () => {
    const { useCase } = createUseCase({
      transactions: [],
      ledgerEntries: [],
    });

    const result = await useCase.execute({
      activeUserRemoteId: null,
      activeAccountRemoteId: "business-1",
      currencyCode: "NPR",
      countryCode: "NP",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.message).toBe("Active account context is required.");
    }
  });
});
