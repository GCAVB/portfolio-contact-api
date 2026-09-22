const {
  pool
} = require('../config/db');

const {
  deletePdfFromGoogleStorage
} = require('../config/storage');

function normalizeLimit(
  value,
  fallback = 25
) {
  const parsed =
    Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return Math.min(
    parsed,
    100
  );
}

async function listPendingStorageCleanup(
  limit = 25
) {
  const safeLimit =
    normalizeLimit(limit);

  const result =
    await pool.query(
      `
        SELECT
          id,
          storage_path,
          bucket_name,
          reason,
          status,
          attempts,
          last_error,
          created_at,
          updated_at
        FROM storage_cleanup_pending
        WHERE status IN (
          'pending',
          'failed'
        )
        ORDER BY created_at ASC
        LIMIT $1
      `,
      [safeLimit]
    );

  return result.rows;
}

async function claimPendingStorageCleanup(
  client,
  limit = 25
) {
  const safeLimit =
    normalizeLimit(limit);

  const result =
    await client.query(
      `
        SELECT
          id,
          storage_path,
          bucket_name,
          reason,
          attempts,
          created_at
        FROM storage_cleanup_pending
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `,
      [safeLimit]
    );

  return result.rows;
}

async function markStorageCleanupCleaned(
  client,
  id
) {
  await client.query(
    `
      UPDATE storage_cleanup_pending
      SET
        status = 'cleaned',
        last_error = NULL
      WHERE id = $1
    `,
    [id]
  );
}

async function markStorageCleanupFailed(
  client,
  id,
  error
) {
  await client.query(
    `
      UPDATE storage_cleanup_pending
      SET
        attempts = attempts + 1,

        status =
          CASE
            WHEN attempts + 1 >= 3
              THEN 'failed'
            ELSE 'pending'
          END,

        last_error = $2

      WHERE id = $1
    `,
    [
      id,

      error?.message ||
        'Error desconocido eliminando archivo'
    ]
  );
}

async function processPendingStorageCleanup(
  limit = 25
) {
  const client =
    await pool.connect();

  const summary = {
    total: 0,
    cleaned: 0,
    failed: 0
  };

  try {
    await client.query(
      'BEGIN'
    );

    const pendingItems =
      await claimPendingStorageCleanup(
        client,
        limit
      );

    summary.total =
      pendingItems.length;

    for (
      const item
      of pendingItems
    ) {
      try {
        await deletePdfFromGoogleStorage(
          item.storage_path
        );

        await markStorageCleanupCleaned(
          client,
          item.id
        );

        summary.cleaned += 1;
      } catch (error) {
        await markStorageCleanupFailed(
          client,
          item.id,
          error
        );

        summary.failed += 1;
      }
    }

    await client.query(
      'COMMIT'
    );

    return summary;
  } catch (error) {
    try {
      await client.query(
        'ROLLBACK'
      );
    } catch (rollbackError) {
      console.error(
        'Error ejecutando rollback de cleanup:',
        rollbackError.message
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listPendingStorageCleanup,
  processPendingStorageCleanup
};