import {
    Transaction,
    TransactionDirection,
    TransactionPostingStatus,
    TransactionSourceModule,
    TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import {
    getTransactionActionLabel,
    getTransactionStatementLabel,
    getTransactionStatusLabel,
} from "@/feature/transactions/viewModel/transactionAuditDisplay.util";
import { describe, expect, it } from "vitest";

const buildTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  remoteId: "txn-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Main Business",
  transactionType: TransactionType.Income,
  direction: TransactionDirection.In,
  title: "Opening balance - Cash Drawer",
  amount: 500,
  currencyCode: "NPR",
  categoryRemoteId: null,
  categoryNameSnapshot: null,
  categoryLabel: "Opening Balance",
  note: null,
  happenedAt: 1_710_000_000_000,
  settlementMoneyAccountRemoteId: "cash-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Drawer",
  sourceModule: TransactionSourceModule.MoneyAccounts,
  sourceRemoteId: "cash-1",
  sourceAction: "opening_balance",
  idempotencyKey: null,
  postingStatus: TransactionPostingStatus.Posted,
  contactRemoteId: null,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe("transaction audit display labels", () => {
  it("labels money account opening balance entries clearly", () => {
    const transaction = buildTransaction({
      sourceAction: "opening_balance",
    });

    expect(getTransactionActionLabel(transaction)).toBe("Opening Balance");
    expect(getTransactionStatementLabel(transaction)).toBe("Opening Balance");
  });

  it("labels money account balance corrections clearly", () => {
    const transaction = buildTransaction({
      sourceAction: "balance_reconciliation",
    });

    expect(getTransactionActionLabel(transaction)).toBe("Balance Correction");
    expect(getTransactionStatementLabel(transaction)).toBe(
      "Balance Correction",
    );
  });

  it("labels voided rows without changing their original action label", () => {
    const transaction = buildTransaction({
      postingStatus: TransactionPostingStatus.Voided,
      sourceAction: "balance_reconciliation",
    });

    expect(getTransactionStatusLabel(transaction)).toBe("Voided");
    expect(getTransactionStatementLabel(transaction)).toBe(
      "Balance Correction",
    );
  });
});
