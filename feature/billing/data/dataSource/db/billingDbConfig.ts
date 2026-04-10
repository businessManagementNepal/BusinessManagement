import { BillingDocumentModel } from "./billingDocument.model";
import { billingDocumentsTable } from "./billingDocument.schema";
import { BillingDocumentItemModel } from "./billingDocumentItem.model";
import { billingDocumentItemsTable } from "./billingDocumentItem.schema";
import { BillPhotoModel } from "./billPhoto.model";
import { billPhotosTable } from "./billPhoto.schema";
import { BillingDocumentAllocationModel } from "./billingDocumentAllocation.model";
import { billingDocumentAllocationsTable } from "./billingDocumentAllocation.schema";

export const billingDbConfig = {
  models: [
    BillingDocumentModel,
    BillingDocumentItemModel,
    BillPhotoModel,
    BillingDocumentAllocationModel,
  ],
  tables: [
    billingDocumentsTable,
    billingDocumentItemsTable,
    billPhotosTable,
    billingDocumentAllocationsTable,
  ],
};
