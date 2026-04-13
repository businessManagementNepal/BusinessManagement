import { exportDocument } from "@/shared/utils/document/exportDocument";
import { Platform } from "react-native";
import { PosErrorType, PosOperationResult } from "../types/pos.error.types";
import { buildPosReceiptHtml } from "../utils/buildPosReceiptHtml.util";
import {
    ShareReceiptPayload,
    ShareReceiptUseCase,
} from "./shareReceipt.useCase";

export const createShareReceiptUseCase = (): ShareReceiptUseCase => ({
  async execute(payload: ShareReceiptPayload): Promise<PosOperationResult> {
    if (Platform.OS === "web") {
      return {
        success: false,
        error: {
          type: PosErrorType.UnsupportedOperation,
          message: "Sharing is not available in this web build.",
        },
      };
    }

    const html = buildPosReceiptHtml(
      payload.receipt,
      payload.currencyCode,
      payload.countryCode,
    );

    const result = await exportDocument({
      html,
      action: "share",
      fileName: `pos_receipt_${payload.receipt.receiptNumber}`,
      title: `POS Receipt ${payload.receipt.receiptNumber}`,
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          type: PosErrorType.UnsupportedOperation,
          message: result.error,
        },
      };
    }

    return { success: true, value: true };
  },
});
