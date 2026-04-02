import { EmiPlansResult } from "@/feature/emiLoans/types/emi.entity.types";

export type GetEmiPlansParams = {
  planMode: "personal" | "business";
  ownerUserRemoteId: string | null;
  businessAccountRemoteId: string | null;
};

export interface GetEmiPlansUseCase {
  execute(params: GetEmiPlansParams): Promise<EmiPlansResult>;
}
