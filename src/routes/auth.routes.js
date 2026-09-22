const express =
  require('express');

const {
  loginController
} =
  require('../controllers/auth.controller');

const {
  loginRateLimit
} =
  require('../middleware/rateLimit.middleware');

const asyncHandler =
  require('../utils/asyncHandler');

const router =
  express.Router();

router.post(
  '/login',

  loginRateLimit,

  asyncHandler(
    loginController
  )
);

module.exports =
  router;