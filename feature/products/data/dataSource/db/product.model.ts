import {
    ProductKindValue,
    ProductStatusValue,
} from "@/feature/products/types/product.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class ProductModel extends Model {
  static table = "products";

  @field("remote_id") remoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("name") name!: string;
  @field("kind") kind!: ProductKindValue;
  @field("category_name") categoryName!: string | null;
  @field("sale_price") salePrice!: number;
  @field("cost_price") costPrice!: number | null;
  @field("stock_quantity") stockQuantity!: number | null;
  @field("unit_label") unitLabel!: string | null;
  @field("sku_or_barcode") skuOrBarcode!: string | null;
  @field("tax_rate_label") taxRateLabel!: string | null;
  @field("description") description!: string | null;
  @field("image_url") imageUrl!: string | null;
  @field("status") status!: ProductStatusValue;
  @field("server_revision") serverRevision!: string | null;
  @field("sync_status") recordSyncStatus!: string;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}

