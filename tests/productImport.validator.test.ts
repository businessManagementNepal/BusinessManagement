import { describe, expect, it } from "vitest";

describe("productImport.validator", () => {
  it("flags invalid and duplicate product rows", async () => {
    const { validateProductImportRow } = await import(
      "@/feature/appSettings/dataTransfer/import/validator/productImport.validator"
    );

    const duplicate = validateProductImportRow(
      1,
      {
        name: "Notebook",
        selling_price: "120",
        unit: "piece",
        sku: "NB001",
      },
      {
        existingSkuValues: new Set(["nb001"]),
        seenSkuValues: new Set<string>(),
      },
    );
    const invalid = validateProductImportRow(
      2,
      {
        name: "",
        selling_price: "-5",
        opening_stock: "-1",
      },
      {
        existingSkuValues: new Set<string>(),
        seenSkuValues: new Set<string>(),
      },
    );

    expect(duplicate.status).toBe("duplicate");
    expect(duplicate.errors).toContain("SKU or barcode already exists in this account.");
    expect(invalid.status).toBe("invalid");
    expect(invalid.errors).toContain("Product name is required.");
    expect(invalid.errors).toContain("Selling price cannot be negative.");
    expect(invalid.errors).toContain("Opening stock cannot be negative.");
  });
});
