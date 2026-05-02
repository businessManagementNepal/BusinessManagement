import { describe, expect, it, vi } from "vitest";

describe("importAudit.repository", () => {
  it("maps job row JSON fields back into entities", async () => {
    const { createImportAuditRepository } = await import(
      "@/feature/appSettings/dataTransfer/import/audit/data/repository/importAudit.repository.impl"
    );

    const datasource = {
      getImportJobByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: null,
      })),
      getImportJobRowsByJobRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "row-1",
            importJobRemoteId: "job-1",
            rowNumber: 1,
            status: "valid",
            rawJson: "{\"name\":\"Notebook\"}",
            normalizedJson: "{\"name\":\"Notebook\"}",
            errorJson: "[\"Missing SKU\"]",
            warningJson: "[\"Defaulted unit\"]",
            createdRecordRemoteId: null,
            createdAt: new Date(1),
            updatedAt: new Date(2),
          },
        ],
      })),
      createImportPreviewJob: vi.fn(),
      updateImportJob: vi.fn(),
      updateImportJobRow: vi.fn(),
    };

    const repository = createImportAuditRepository(datasource as never);
    const result = await repository.getImportJobRowsByJobRemoteId("job-1");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value[0]).toEqual(
      expect.objectContaining({
        rawData: { name: "Notebook" },
        errors: ["Missing SKU"],
        warnings: ["Defaulted unit"],
      }),
    );
  });
});
