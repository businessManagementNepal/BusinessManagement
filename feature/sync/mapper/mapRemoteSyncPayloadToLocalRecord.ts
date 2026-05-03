const REMOTE_TO_LOCAL_TRANSACTION_DIRECTION: Record<string, string> = {
  inflow: "in",
  outflow: "out",
};

const REMOTE_TO_LOCAL_TRANSACTION_POSTING_STATUS: Record<string, string> = {
  posted: "posted",
  void: "voided",
};

const REMOTE_TO_LOCAL_LEDGER_BALANCE_DIRECTION: Record<string, string> = {
  debit: "receive",
  credit: "pay",
};

const clonePayload = (
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
};

const removeProjectionFields = (
  tableName: string,
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  switch (tableName) {
    case "products": {
      const { stock_quantity: _ignored, ...rest } = payload;
      return rest;
    }
    case "money_accounts": {
      const { current_balance: _ignored, ...rest } = payload;
      return rest;
    }
    default:
      return payload;
  }
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

export const mapRemoteSyncPayloadToLocalRecord = ({
  tableName,
  payload,
  serverRevision,
}: {
  tableName: string;
  payload: Record<string, unknown>;
  serverRevision?: string | null;
}): Record<string, unknown> => {
  let nextPayload = removeProjectionFields(tableName, clonePayload(payload));

  switch (tableName) {
    case "transactions":
      nextPayload = mapEnumField(
        mapEnumField(
          nextPayload,
          "direction",
          REMOTE_TO_LOCAL_TRANSACTION_DIRECTION,
          tableName,
        ),
        "posting_status",
        REMOTE_TO_LOCAL_TRANSACTION_POSTING_STATUS,
        tableName,
      );
      break;
    case "ledger_entries":
      nextPayload = mapEnumField(
        nextPayload,
        "balance_direction",
        REMOTE_TO_LOCAL_LEDGER_BALANCE_DIRECTION,
        tableName,
      );
      break;
    default:
      break;
  }

  const normalizedServerRevision =
    typeof serverRevision === "string" ? serverRevision.trim() : "";
  if (!normalizedServerRevision) {
    return nextPayload;
  }

  return {
    ...nextPayload,
    server_revision: normalizedServerRevision,
  };
};
