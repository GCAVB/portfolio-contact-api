const {
  pool
} = require('../config/db');

const {
  createSignedPdfUrl
} = require('../config/storage');

const {
  listPendingStorageCleanup,
  processPendingStorageCleanup
} = require('../models/storageCleanup.model');

function parsePositiveInteger(
  value
) {
  const parsed =
    Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

function parseLimit(
  value,
  fallback = 25
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback;
  }

  const parsed =
    parsePositiveInteger(
      value
    );

  if (!parsed) {
    return null;
  }

  return Math.min(
    parsed,
    100
  );
}

async function listFormsController(
  req,
  res
) {
  const result =
    await pool.query(
      `
        SELECT
          id,
          tipo,
          nombre,
          email,
          empresa,
          asunto,
          estado,
          created_at
        FROM formularios
        ORDER BY created_at DESC
        LIMIT 100
      `
    );

  return res.json({
    ok: true,
    data: result.rows
  });
}

async function getFormDetailController(
  req,
  res
) {
  const id =
    parsePositiveInteger(
      req.params.id
    );

  if (!id) {
    return res
      .status(400)
      .json({
        ok: false,
        message:
          'ID de formulario inválido'
      });
  }

  const formResult =
    await pool.query(
      `
        SELECT *
        FROM formularios
        WHERE id = $1
      `,
      [id]
    );

  if (
    formResult.rowCount === 0
  ) {
    return res
      .status(404)
      .json({
        ok: false,
        message:
          'Formulario no encontrado'
      });
  }

  const filesResult =
    await pool.query(
      `
        SELECT
          id,
          original_name,
          mime_type,
          size_bytes,
          created_at
        FROM archivos_pdf
        WHERE formulario_id = $1
        ORDER BY created_at DESC
      `,
      [id]
    );

  return res.json({
    ok: true,

    data: {
      formulario:
        formResult.rows[0],

      archivos:
        filesResult.rows
    }
  });
}

async function getPdfSignedUrlController(
  req,
  res
) {
  const id =
    parsePositiveInteger(
      req.params.id
    );

  if (!id) {
    return res
      .status(400)
      .json({
        ok: false,
        message:
          'ID de archivo inválido'
      });
  }

  const result =
    await pool.query(
      `
        SELECT
          id,
          original_name,
          storage_path
        FROM archivos_pdf
        WHERE id = $1
      `,
      [id]
    );

  if (
    result.rowCount === 0
  ) {
    return res
      .status(404)
      .json({
        ok: false,
        message:
          'PDF no encontrado'
      });
  }

  const archivo =
    result.rows[0];

  const {
    url,
    expiresInSeconds
  } =
    await createSignedPdfUrl(
      archivo.storage_path
    );

  return res.json({
    ok: true,

    fileName:
      archivo.original_name,

    url,

    expiresInSeconds
  });
}

async function updateFormStatusController(
  req,
  res
) {
  const id =
    parsePositiveInteger(
      req.params.id
    );

  if (!id) {
    return res
      .status(400)
      .json({
        ok: false,
        message:
          'ID de formulario inválido'
      });
  }

  const {
    estado
  } = req.body;

  const allowed = [
    'nuevo',
    'en_revision',
    'respondido',
    'cerrado'
  ];

  if (
    !allowed.includes(
      estado
    )
  ) {
    return res
      .status(400)
      .json({
        ok: false,
        message:
          'Estado inválido'
      });
  }

  const result =
    await pool.query(
      `
        UPDATE formularios
        SET estado = $1
        WHERE id = $2
        RETURNING *
      `,
      [
        estado,
        id
      ]
    );

  if (
    result.rowCount === 0
  ) {
    return res
      .status(404)
      .json({
        ok: false,
        message:
          'Formulario no encontrado'
      });
  }

  return res.json({
    ok: true,
    data: result.rows[0]
  });
}

async function listStorageCleanupController(
  req,
  res
) {
  const limit =
    parseLimit(
      req.query.limit
    );

  if (!limit) {
    return res
      .status(400)
      .json({
        ok: false,
        message:
          'limit debe ser un entero positivo'
      });
  }

  const data =
    await listPendingStorageCleanup(
      limit
    );

  return res.json({
    ok: true,
    data
  });
}

async function processStorageCleanupController(
  req,
  res
) {
  const limit =
    parseLimit(
      req.body?.limit
    );

  if (!limit) {
    return res
      .status(400)
      .json({
        ok: false,
        message:
          'limit debe ser un entero positivo'
      });
  }

  const summary =
    await processPendingStorageCleanup(
      limit
    );

  return res.json({
    ok: true,
    data: summary
  });
}

module.exports = {
  listFormsController,
  getFormDetailController,
  getPdfSignedUrlController,
  updateFormStatusController,
  listStorageCleanupController,
  processStorageCleanupController
};