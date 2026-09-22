const {
  formSchema
} = require('../validators/form.schema');

const {
  createFormWithFiles
} = require('../models/form.model');

const {
  sendReceiptEmail,
  sendAdminNotification
} = require('../config/mail');

function createBadRequest(message) {
  const error =
    new Error(message);

  error.statusCode = 400;

  return error;
}

function parseMetadata(
  rawMetadata
) {
  if (
    rawMetadata === undefined ||
    rawMetadata === null ||
    rawMetadata === ''
  ) {
    return undefined;
  }

  if (
    typeof rawMetadata ===
      'object' &&
    !Array.isArray(
      rawMetadata
    )
  ) {
    return rawMetadata;
  }

  if (
    typeof rawMetadata !==
    'string'
  ) {
    throw createBadRequest(
      'metadata debe ser un objeto JSON válido'
    );
  }

  try {
    const parsed =
      JSON.parse(
        rawMetadata
      );

    if (
      !parsed ||
      typeof parsed !==
        'object' ||
      Array.isArray(parsed)
    ) {
      throw createBadRequest(
        'metadata debe ser un objeto JSON válido'
      );
    }

    return parsed;
  } catch (error) {
    if (
      error.statusCode
    ) {
      throw error;
    }

    throw createBadRequest(
      'metadata debe ser un JSON válido'
    );
  }
}

async function submitFormController(
  req,
  res
) {
  const honeypot =
    String(
      req.body.website || ''
    ).trim();

  if (honeypot) {
    return res
      .status(400)
      .json({
        ok: false,
        message:
          'Solicitud rechazada.'
      });
  }

  const metadata =
    parseMetadata(
      req.body.metadata
    );

  const data =
    formSchema.parse({
      ...req.body,
      metadata
    });

  const files =
    req.files || [];

  const {
    formulario,
    uploadedFiles
  } =
    await createFormWithFiles(
      data,
      files
    );

  const emailResults =
    await Promise.allSettled([
      sendReceiptEmail(
        formulario
      ),

      sendAdminNotification(
        formulario,
        uploadedFiles
      )
    ]);

  for (
    const [
      index,
      result
    ]
    of emailResults.entries()
  ) {
    if (
      result.status ===
      'rejected'
    ) {
      console.error(
        index === 0
          ? 'Error enviando correo de confirmación'
          : 'Error enviando notificación administrativa',
        result.reason?.message ||
          result.reason
      );
    }
  }

  return res
    .status(201)
    .json({
      ok: true,

      message:
        'Formulario recibido correctamente.',

      data: {
        id:
          formulario.id,

        estado:
          formulario.estado,

        pdfCount:
          uploadedFiles.length
      }
    });
}

module.exports = {
  submitFormController
};