const LOCAL_ONLY_SYNC_FIELDS = new Set([
  "id",
  "sync_status",
  "last_synced_at",
  "server_revision",
]);

const TRANSACTION_DIRECTION_TO_REMOTE: Record<string, string> = {
  in: "inflow",
  out: "outflow",
};

const TRANSACTION_POSTING_STATUS_TO_REMOTE: Record<string, string> = {
  posted: "posted",
  voided: "void",
};

const LEDGER_BALANCE_DIRECTION_TO_REMOTE: Record<string, string> = {
  receive: "debit",
  pay: "credit",
};

const clonePayloadWithoutFields = (
  payload: Record<string, unknown>,
  fieldNames: readonly string[],
): Record<string, unknown> => {
  const excludedFields = new Set(fieldNames);

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([fieldName, fieldValue]) =>
        !excludedFields.has(fieldName) && fieldValue !== undefined,
    ),
  );
};

const mapEnumField = (
  payload: Record<string, unknown>,
  fieldName: string,
  mapping: Record<string, string>,
  tableName: string,
): Record<string, unknown> => {
  const rawValue = payload[fieldName];
  if (rawValue === undefined || rawValue === null) {
    return payload;
  }

  if (typeof rawValue !== "string" || !(rawValue in mapping)) {
    throw new Error(
      `Unsupported ${tableName}.${fieldName} value '${String(rawValue)}' for sync mapping.`,
    );
  }

  return {
    ...payload,
    [fieldName]: mapping[rawValue],
  };
};

const stripProjectionFields = (
  tableName: string,
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  switch (tableName) {
    case "products":
      return clonePayloadWithoutFields(payload, ["stock_quantity"]);
    case "money_accounts":
      return clonePayloadWithoutFields(payload, ["current_balance"]);
    default:
      return payload;
  }
};

export const mapLocalRecordToRemoteSyncPayload = (
  tableName: string,
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  const sanitizedPayload = clonePayloadWithoutFields(payload, [
    ...LOCAL_ONLY_SYNC_FIELDS,
  ]);

  switch (tableName) {
    case "transactions":
      return mapEnumField(
        mapEnumField(
          stripProjectionFields(tableName, sanitizedPayload),
          "direction",
          TRANSACTION_DIRECTION_TO_REMOTE,
          tableName,
        ),
        "posting_status",
        TRANSACTION_POSTING_STATUS_TO_REMOTE,
        tableName,
      );
    case "ledger_entries":
      return mapEnumField(
        stripProjectionFields(tableName, sanitizedPayload),
        "balance_direction",
        LEDGER_BALANCE_DIRECTION_TO_REMOTE,
        tableName,
      );
    default:
      return stripProjectionFields(tableName, sanitizedPayload);
  }
};
