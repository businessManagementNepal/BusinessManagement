export const BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME =
  "billing_documents_account_document_number_active_unique_idx";

export const BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS ${BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME}
ON billing_documents (account_remote_id, document_number COLLATE NOCASE)
WHERE deleted_at IS NULL;
`.trim();

export const NORMALIZE_BILLING_DOCUMENT_NUMBER_SQL = `
UPDATE billing_documents
SET
  document_number = UPPER(TRIM(COALESCE(document_number, ''))),
  sync_status = CASE
    WHEN sync_status = 'synced' THEN 'pending_update'
    ELSE sync_status
  END,
  last_synced_at = CASE
    WHEN sync_status = 'synced' THEN NULL
    ELSE last_synced_at
  END,
  updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE
  document_number IS NULL
  OR document_number <> UPPER(TRIM(COALESCE(document_number, '')));
`.trim();

export const BACKFILL_EMPTY_BILLING_DOCUMENT_NUMBER_SQL = `
UPDATE billing_documents
SET
  document_number = 'DOC-' || UPPER(SUBSTR(REPLACE(TRIM(COALESCE(remote_id, id)), '-', ''), 1, 8)),
  sync_status = CASE
    WHEN sync_status = 'synced' THEN 'pending_update'
    ELSE sync_status
  END,
  last_synced_at = CASE
    WHEN sync_status = 'synced' THEN NULL
    ELSE last_synced_at
  END,
  updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE
  deleted_at IS NULL
  AND (
    document_number IS NULL
    OR LENGTH(TRIM(document_number)) = 0
  );
`.trim();

export const DEDUPE_ACTIVE_BILLING_DOCUMENT_NUMBER_SQL = `
UPDATE billing_documents
SET
  document_number = document_number || '-DEDUP-' || id,
  sync_status = CASE
    WHEN sync_status = 'synced' THEN 'pending_update'
    ELSE sync_status
  END,
  last_synced_at = CASE
    WHEN sync_status = 'synced' THEN NULL
    ELSE last_synced_at
  END,
  updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM billing_documents AS newer
    WHERE
      newer.account_remote_id = billing_documents.account_remote_id
      AND newer.document_number = billing_documents.document_number
      AND newer.deleted_at IS NULL
      AND (
        newer.updated_at > billing_documents.updated_at
        OR (
          newer.updated_at = billing_documents.updated_at
          AND newer.created_at > billing_documents.created_at
        )
        OR (
          newer.updated_at = billing_documents.updated_at
          AND newer.created_at = billing_documents.created_at
          AND newer.id > billing_documents.id
        )
      )
  );
`.trim();
