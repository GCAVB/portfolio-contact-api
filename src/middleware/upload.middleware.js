const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

function getPdfUploadLimits() {
  const maxFiles = Number(
    process.env.PDF_MAX_FILES || 10
  );

  const maxTotalMb = Number(
    process.env.PDF_MAX_TOTAL_MB || 40
  );

  return {
    maxFiles,

    maxTotalBytes:
      maxTotalMb *
      1024 *
      1024
  };
}

function createUploadError(
  message,
  statusCode = 400
) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function fileFilter(
  req,
  file,
  callback
) {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const validExtension =
    extension === '.pdf';

  const validMime =
    file.mimetype === 'application/pdf';

  if (
    !validExtension ||
    !validMime
  ) {
    return callback(
      createUploadError(
        'Solo se permiten archivos PDF'
      )
    );
  }

  callback(null, true);
}

function validatePdfSignature(file) {
  if (
    !file ||
    !file.buffer ||
    file.buffer.length < 5
  ) {
    throw createUploadError(
      'PDF inválido'
    );
  }

  const signature = file.buffer
    .subarray(0, 5)
    .toString('ascii');

  if (signature !== '%PDF-') {
    throw createUploadError(
      'El archivo no contiene una firma PDF válida'
    );
  }
}

function validateUploadedPdfSignatures(
  req,
  res,
  next
) {
  try {
    const files = req.files || [];

    files.forEach(
      validatePdfSignature
    );

    next();
  } catch (error) {
    next(error);
  }
}

function validatePdfTotalSize(
  req,
  res,
  next
) {
  try {
    const files = req.files || [];

    const {
      maxTotalBytes
    } = getPdfUploadLimits();

    const totalPdfBytes =
      files.reduce(
        (total, file) =>
          total +
          Number(file.size || 0),
        0
      );

    if (
      totalPdfBytes >
      maxTotalBytes
    ) {
      throw createUploadError(
        'El total de PDFs supera el tamaño máximo permitido',
        413
      );
    }

    req.pdfUploadSummary = {
      totalPdfBytes,
      fileCount: files.length
    };

    next();
  } catch (error) {
    next(error);
  }
}

const {
  maxFiles,
  maxTotalBytes
} = getPdfUploadLimits();

const uploadPdf = multer({
  storage,

  fileFilter,

  limits: {
    files: maxFiles,

    /*
     * Este límite es individual.
     * La suma total se valida después.
     */
    fileSize: maxTotalBytes,

    fields: 20,

    parts:
      maxFiles + 20,

    fieldSize:
      64 * 1024
  }
});

module.exports = {
  uploadPdf,
  validateUploadedPdfSignatures,
  validatePdfTotalSize,
  getPdfUploadLimits
};