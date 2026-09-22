const rateLimit =
  require('express-rate-limit');

const publicRateLimit =
  rateLimit({
    windowMs:
      20 *
      60 *
      1000,

    max: 20,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      ok: false,

      message:
        'Demasiadas solicitudes. Intenta nuevamente en unos minutos.'
    }
  });

const loginRateLimit =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    max: 10,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      ok: false,

      message:
        'Demasiados intentos de inicio de sesión. Intenta nuevamente más tarde.'
    }
  });

module.exports = {
  publicRateLimit,
  loginRateLimit
};