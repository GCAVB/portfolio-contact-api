const crypto = require('crypto');
const path = require('path');

const {
  pool
} = require('../config/db');

const {
  uploadPdfToGoogleStorage,
  deletePdfFromGoogleStorage
} = require('../config/storage');

function buildStoragePath(file) {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const originalBaseName = path.basename(
    file.originalname,
    extension
  );

  const safeBaseName =
    originalBaseName
      .normalize('NFKD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[^a-zA-Z0-9_.-]/g,
        '_'
      )
      .replace(
        /_+/g,
        '_'
      )
      .slice(0, 120) ||
    'documento';

  const unique =
    crypto.randomUUID();

  const now =
    new Date();

  const year =
    now.getUTCFullYear();

  const month =
    String(
      now.getUTCMonth() + 1
    ).padStart(2, '0');

  return [
    'formularios',
    String(year),
    month,
    `${unique}-${safeBaseName}.pdf`
  ].join('/');
}

async function registerPendingStorageCleanup(
  storagePath,
  error
) {
  await pool.query(
    `
      INSERT INTO storage_cleanup_pending
      (
        storage_path,
        bucket_name,
        reason
      )
      VALUES ($1, $2, $3)

      ON CONFLICT DO NOTHING
    `,
    [
      storagePath,

      process.env
        .GOOGLE_CLOUD_STORAGE_BUCKET,

      error?.message ||
        'Error eliminando archivo huérfano'
    ]
  );
}

async function cleanupUploadedFiles(
  uploadedFiles,
  originalError
) {
  for (const file of uploadedFiles) {
    try {
      await deletePdfFromGoogleStorage(
        file.storagePath,
        file.generation
      );
    } catch (cleanupError) {
      console.error(
        'No se pudo eliminar un PDF huérfano:',
        cleanupError.message
      );

      try {
        await registerPendingStorageCleanup(
          file.storagePath,
          originalError ||
            cleanupError
        );
      } catch (registerError) {
        console.error(
          'No se pudo registrar cleanup pendiente:',
          registerError.message
        );
      }
    }
  }
}

async function uploadFiles(files) {
  const uploadedFiles = [];

  try {
    for (const file of files) {
      const storagePath =
        buildStoragePath(file);

      const uploaded =
        await uploadPdfToGoogleStorage(
          file,
          storagePath
        );

      uploadedFiles.push({
        originalName:
          file.originalname,

        storedName:
          path.basename(
            storagePath
          ),

        mimeType:
          uploaded.mimeType ||
          'application/pdf',

        sizeBytes:
          uploaded.sizeBytes,

        storagePath,

        generation:
          uploaded.generation
      });
    }

    return uploadedFiles;
  } catch (error) {
    await cleanupUploadedFiles(
      uploadedFiles,
      error
    );

    throw error;
  }
}

async function createFormWithFiles(
  data,
  files = []
) {
  const uploadedFiles =
    await uploadFiles(files);

  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN'
    );

    const formResult =
      await client.query(
        `
          INSERT INTO formularios
          (
            tipo,
            nombre,
            email,
            telefono,
            empresa,
            asunto,
            mensaje,
            metadata
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
          RETURNING *
        `,
        [
          data.tipo,
          data.nombre,
          data.email,
          data.telefono || null,
          data.empresa || null,
          data.asunto || null,
          data.mensaje || null,
          data.metadata || {}
        ]
      );

    const formulario =
      formResult.rows[0];

    for (
      const file
      of uploadedFiles
    ) {
      await client.query(
        `
          INSERT INTO archivos_pdf
          (
            formulario_id,
            original_name,
            stored_name,
            mime_type,
            size_bytes,
            storage_path,
            generation
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
        `,
        [
          formulario.id,
          file.originalName,
          file.storedName,
          file.mimeType,
          file.sizeBytes,
          file.storagePath,
          file.generation
        ]
      );
    }

    await client.query(
      'COMMIT'
    );

    return {
      formulario,
      uploadedFiles
    };
  } catch (error) {
    try {
      await client.query(
        'ROLLBACK'
      );
    } catch (rollbackError) {
      console.error(
        'Error ejecutando rollback:',
        rollbackError.message
      );
    }

    await cleanupUploadedFiles(
      uploadedFiles,
      error
    );

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createFormWithFiles,
  buildStoragePath
};