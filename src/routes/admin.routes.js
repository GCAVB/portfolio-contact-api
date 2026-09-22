const express =
  require('express');

const {
  requireAdminAuth
} =
  require('../middleware/auth.middleware');

const {
  listFormsController,
  getFormDetailController,
  getPdfSignedUrlController,
  updateFormStatusController,
  listStorageCleanupController,
  processStorageCleanupController
} =
  require('../controllers/admin.controller');

const asyncHandler =
  require('../utils/asyncHandler');

const router =
  express.Router();

router.use(
  requireAdminAuth
);

router.get(
  '/formularios',

  asyncHandler(
    listFormsController
  )
);

router.get(
  '/formularios/:id',

  asyncHandler(
    getFormDetailController
  )
);

router.get(
  '/archivos/:id/url',

  asyncHandler(
    getPdfSignedUrlController
  )
);

router.patch(
  '/formularios/:id/estado',

  asyncHandler(
    updateFormStatusController
  )
);

router.get(
  '/storage-cleanup',

  asyncHandler(
    listStorageCleanupController
  )
);

router.post(
  '/storage-cleanup/process',

  asyncHandler(
    processStorageCleanupController
  )
);

module.exports =
  router;