require('dotenv').config();

const {
  validateStorageCleanupEnv
} =
  require('../src/config/env');

const {
  processPendingStorageCleanup
} =
  require('../src/models/storageCleanup.model');

const {
  pool
} =
  require('../src/config/db');

async function main() {
  validateStorageCleanupEnv();

  const configuredLimit =
    Number(
      process.env
        .STORAGE_CLEANUP_LIMIT ||
      25
    );

  const limit =
    Number.isSafeInteger(
      configuredLimit
    ) &&
    configuredLimit > 0
      ? Math.min(
          configuredLimit,
          100
        )
      : 25;

  const summary =
    await processPendingStorageCleanup(
      limit
    );

  console.log(
    [
      'Limpieza de storage finalizada.',
      `Total: ${summary.total}.`,
      `Borrados: ${summary.cleaned}.`,
      `Fallidos: ${summary.failed}.`
    ].join(' ')
  );
}

main()
  .catch(
    (error) => {
      console.error(
        'Error procesando limpieza pendiente de storage:',
        error.message
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );