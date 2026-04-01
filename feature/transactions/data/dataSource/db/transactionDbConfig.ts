import { TransactionModel } from "./transaction.model";
import { transactionsTable } from "./transaction.schema";

export const transactionDbConfig = {
  models: [TransactionModel],
  tables: [transactionsTable],
};
