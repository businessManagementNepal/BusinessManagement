import { syncDependencyOrder } from "@/feature/sync/registry/syncDependencyOrder";
import { describe, expect, it } from "vitest";

const getRank = (tableName: string): number => syncDependencyOrder.indexOf(
  tableName as (typeof syncDependencyOrder)[number],
);

describe("sync dependency order", () => {
  it("keeps parent business records ahead of dependent records", () => {
    expect(getRank("accounts")).toBeLessThan(getRank("business_profiles"));
    expect(getRank("billing_documents")).toBeLessThan(
      getRank("billing_document_items"),
    );
    expect(getRank("orders")).toBeLessThan(getRank("order_lines"));
    expect(getRank("emi_plans")).toBeLessThan(
      getRank("installment_payment_links"),
    );
  });

  it("places inventory movements before downstream financial workflow aggregates", () => {
    expect(getRank("inventory_movements")).toBeLessThan(
      getRank("transactions"),
    );
    expect(getRank("transactions")).toBeLessThan(getRank("pos_sales"));
  });
});
