const express =
  require('express');

const {
  submitFormController
} =
  require('../controllers/form.controller');

const {
  uploadPdf,
  validateUploadedPdfSignatures,
  validatePdfTotalSize
} =
  require('../middleware/upload.middleware');

const asyncHandler =
  require('../utils/asyncHandler');

const router =
  express.Router();

router.post(
  '/',

  uploadPdf.array(
    'pdfs',
    Number(
      process.env.PDF_MAX_FILES ||
      10
    )
  ),

  validateUploadedPdfSignatures,

  validatePdfTotalSize,

  asyncHandler(
    submitFormController
  )
);

module.exports =
  router;