const jwt =
  require('jsonwebtoken');

const {
  JWT_ISSUER,
  JWT_AUDIENCE
} =
  require('../controllers/auth.controller');

function requireAdminAuth(
  req,
  res,
  next
) {
  const header =
    req.headers.authorization ||
    '';

  const token =
    header.startsWith(
      'Bearer '
    )
      ? header.slice(7).trim()
      : null;

  if (!token) {
    return res
      .status(401)
      .json({
        ok: false,
        message:
          'Token requerido'
      });
  }

  try {
    const payload =
      jwt.verify(
        token,

        process.env.JWT_SECRET,

        {
          algorithms: [
            'HS256'
          ],

          issuer:
            JWT_ISSUER,

          audience:
            JWT_AUDIENCE
        }
      );

    const adminEmail =
      String(
        process.env.ADMIN_EMAIL ||
        ''
      )
        .trim()
        .toLowerCase();

    if (
      payload.role !==
        'admin' ||
      payload.singleAdmin !==
        true ||
      String(
        payload.email || ''
      )
        .trim()
        .toLowerCase() !==
        adminEmail
    ) {
      return res
        .status(401)
        .json({
          ok: false,
          message:
            'Token administrativo inválido'
        });
    }

    req.admin =
      payload;

    return next();
  } catch {
    return res
      .status(401)
      .json({
        ok: false,
        message:
          'Token inválido o expirado'
      });
  }
}

module.exports = {
  requireAdminAuth
};