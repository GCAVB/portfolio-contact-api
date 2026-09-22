const bcrypt =
  require('bcryptjs');

const jwt =
  require('jsonwebtoken');

const JWT_ISSUER =
  'private-forms-api';

const JWT_AUDIENCE =
  'private-forms-admin';

async function loginController(
  req,
  res
) {
  const email =
    String(
      req.body?.email || ''
    )
      .trim()
      .toLowerCase();

  const password =
    String(
      req.body?.password || ''
    );

  if (
    !email ||
    !password
  ) {
    return res
      .status(400)
      .json({
        ok: false,
        message:
          'Email y contraseña son obligatorios'
      });
  }

  const adminEmail =
    String(
      process.env.ADMIN_EMAIL ||
      ''
    )
      .trim()
      .toLowerCase();

  const isValidEmail =
    email === adminEmail;

  const isValidPassword =
    await bcrypt.compare(
      password,
      process.env
        .ADMIN_PASSWORD_HASH
    );

  if (
    !isValidEmail ||
    !isValidPassword
  ) {
    return res
      .status(401)
      .json({
        ok: false,
        message:
          'Credenciales inválidas'
      });
  }

  const token =
    jwt.sign(
      {
        email:
          adminEmail,

        role:
          'admin',

        singleAdmin:
          true
      },

      process.env.JWT_SECRET,

      {
        algorithm:
          'HS256',

        expiresIn:
          process.env
            .JWT_EXPIRES_IN ||
          '2h',

        issuer:
          JWT_ISSUER,

        audience:
          JWT_AUDIENCE
      }
    );

  return res.json({
    ok: true,
    token
  });
}

module.exports = {
  loginController,
  JWT_ISSUER,
  JWT_AUDIENCE
};