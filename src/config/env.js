function findMissingEnv(required) {
  return required.filter(
    (name) => !process.env[name]
  );
}

function assertRequiredEnv(required) {
  const missing = findMissingEnv(required);

  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}`
    );
  }
}

function validateFrontendUrl() {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    return;
  }

  if (frontendUrl.endsWith('/')) {
    throw new Error(
      'FRONTEND_URL debe configurarse sin slash final. Ejemplo: https://tudominio.cl'
    );
  }

  let parsed;

  try {
    parsed = new URL(frontendUrl);
  } catch {
    throw new Error(
      'FRONTEND_URL debe ser una URL válida'
    );
  }

  if (
    parsed.protocol !== 'http:' &&
    parsed.protocol !== 'https:'
  ) {
    throw new Error(
      'FRONTEND_URL debe utilizar http o https'
    );
  }
}

function validatePositiveNumber(name) {
  if (!process.env[name]) {
    return;
  }

  const value = Number(process.env[name]);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${name} debe ser un número positivo`
    );
  }
}

function validateEnv() {
  assertRequiredEnv([
    'DATABASE_URL',
    'JWT_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD_HASH',
    'FRONTEND_URL'
  ]);

  validateFrontendUrl();

  validatePositiveNumber('PDF_MAX_FILES');
  validatePositiveNumber('PDF_MAX_TOTAL_MB');
  validatePositiveNumber(
    'PDF_ADMIN_LINK_EXPIRES_SECONDS'
  );

  if (process.env.NODE_ENV === 'production') {
    assertRequiredEnv([
      'GOOGLE_CLOUD_PROJECT_ID',
      'GOOGLE_CLOUD_STORAGE_BUCKET',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'MAIL_FROM'
    ]);

    if (process.env.EXTRA_ALLOWED_ORIGINS) {
      console.warn(
        'EXTRA_ALLOWED_ORIGINS será ignorado en producción.'
      );
    }
  }
}

function validateStorageCleanupEnv() {
  assertRequiredEnv([
    'DATABASE_URL',
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_CLOUD_STORAGE_BUCKET'
  ]);
}

module.exports = {
  validateEnv,
  validateStorageCleanupEnv
};