import {
  LedgerBalanceDirection,
  type LedgerEntry,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import {
  buildLedgerOutstandingDueItems,
  buildLedgerPartyBalances,
  buildSettlementLinkCandidates,
} from "@/feature/ledger/viewModel/ledger.shared";
import { describe, expect, it } from "vitest";

const now = Date.now();

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
  amount: 100,
  currencyCode: "NPR",
  note: null,
  happenedAt: now,
  dueAt: null,
  paymentMode: null,
  referenceNumber: "INV-1",
  reminderAt: null,
  attachmentUri: null,
  settledAgainstEntryRemoteId: null,
  linkedDocumentRemoteId: null,
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe("ledger party grouping", () => {
  it("groups renamed or changed-phone entries together by contactRemoteId", () => {
    const balances = buildLedgerPartyBalances([
      buildLedgerEntry({
        remoteId: "sale-1",
        partyName: "Kapil Dhami",
        partyPhone: "9800000000",
        contactRemoteId: "contact-kapil",
        amount: 100,
      }),
      buildLedgerEntry({
        remoteId: "sale-2",
        partyName: "Kapil D.",
        partyPhone: "9811111111",
        contactRemoteId: "contact-kapil",
        amount: 200,
      }),
    ]);

    expect(balances).toHaveLength(1);
    expect(balances[0]?.id).toBe("contact:contact-kapil");
    expect(balances[0]?.balanceAmount).toBe(300);
    expect(balances[0]?.openEntryCount).toBe(2);
  });

  it("keeps same-name entries separate when contactRemoteId is different", () => {
    const balances = buildLedgerPartyBalances([
      buildLedgerEntry({
        remoteId: "sale-1",
        partyName: "Ram Sharma",
        partyPhone: "9800000000",
        contactRemoteId: "contact-ram-1",
        amount: 100,
      }),
      buildLedgerEntry({
        remoteId: "sale-2",
        partyName: "Ram Sharma",
        partyPhone: "9800000000",
        contactRemoteId: "contact-ram-2",
        amount: 200,
      }),
    ]);

    expect(balances).toHaveLength(2);
    expect(balances.map((balance) => balance.id).sort()).toEqual([
      "contact:contact-ram-1",
      "contact:contact-ram-2",
    ]);
  });

  it("falls back to party snapshot when contactRemoteId is missing", () => {
    const balances = buildLedgerPartyBalances([
      buildLedgerEntry({
        remoteId: "sale-1",
        partyName: "Walk In",
        partyPhone: null,
        contactRemoteId: null,
        amount: 100,
      }),
      buildLedgerEntry({
        remoteId: "sale-2",
        partyName: "Walk In",
        partyPhone: null,
        contactRemoteId: null,
        amount: 50,
      }),
    ]);

    expect(balances).toHaveLength(1);
    expect(balances[0]?.id).toBe("snapshot:walk in::");
    expect(balances[0]?.balanceAmount).toBe(150);
  });

  it("uses contactRemoteId for outstanding due partyId", () => {
    const dueItems = buildLedgerOutstandingDueItems([
      buildLedgerEntry({
        remoteId: "sale-1",
        partyName: "Customer One",
        partyPhone: "9800000000",
        contactRemoteId: "contact-1",
        amount: 100,
      }),
    ]);

    expect(dueItems).toHaveLength(1);
    expect(dueItems[0]?.partyId).toBe("contact:contact-1");
  });

  it("filters settlement candidates by contactRemoteId when provided", () => {
    const candidates = buildSettlementLinkCandidates({
      entries: [
        buildLedgerEntry({
          remoteId: "sale-contact-1",
          partyName: "Same Name",
          partyPhone: "9800000000",
          contactRemoteId: "contact-1",
          amount: 100,
        }),
        buildLedgerEntry({
          remoteId: "sale-contact-2",
          partyName: "Same Name",
          partyPhone: "9800000000",
          contactRemoteId: "contact-2",
          amount: 200,
        }),
      ],
      settlementEntryType: LedgerEntryType.Collection,
      partyName: "Same Name",
      contactRemoteId: "contact-2",
      fallbackCurrencyCode: "NPR",
      countryCode: "NP",
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.remoteId).toBe("sale-contact-2");
    expect(candidates[0]?.outstandingAmount).toBe(200);
  });

  it("keeps settlement candidate fallback by partyName for unlinked entries", () => {
    const candidates = buildSettlementLinkCandidates({
      entries: [
        buildLedgerEntry({
          remoteId: "sale-walk-in",
          partyName: "Walk In",
          partyPhone: null,
          contactRemoteId: null,
          amount: 100,
        }),
      ],
      settlementEntryType: LedgerEntryType.Collection,
      partyName: "Walk In",
      fallbackCurrencyCode: "NPR",
      countryCode: "NP",
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.remoteId).toBe("sale-walk-in");
  });
});
