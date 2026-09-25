require('dotenv').config();

const express = require('express');

const goRouter = require('./src/routes/go');

const cors = require('cors');

const helmet = require('helmet');

const compression = require('compression');

const morgan = require('morgan');

const formRoutes = require('./src/routes/form.routes');

const authRoutes = require('./src/routes/auth.routes');

const adminRoutes = require('./src/routes/admin.routes');

const { errorMiddleware} = require('./src/middleware/error.middleware');

const { publicRateLimit} = require('./src/middleware/rateLimit.middleware');

const { checkDatabaseConnection} = require('./src/config/db');

const { validateEnv} = require('./src/config/env');

validateEnv();

function getAllowedOrigins() {
  const frontendUrl =
    process.env.FRONTEND_URL;

  if (
    process.env.NODE_ENV ===
    'production'
  ) {
    return [
      frontendUrl
    ].filter(Boolean);
  }

  const extraOrigins =
    (
      process.env
        .EXTRA_ALLOWED_ORIGINS ||
      ''
    )
      .split(',')
      .map(
        (origin) =>
          origin.trim()
      )
      .filter(Boolean);

  return [
    frontendUrl,
    ...extraOrigins
  ].filter(Boolean);
}

const allowedOrigins =
  getAllowedOrigins();

const app =
  express();

app.disable( 'x-powered-by');

app.set( 'trust proxy',  1);

app.use('/go', goRouter);

app.use(  helmet());

app.use(  compression());

app.use(
  morgan(
    process.env.NODE_ENV ===
      'production'
      ? 'combined'
      : 'dev'
  )
);

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      /*
       * Permite clientes sin Origin,
       * por ejemplo health checks,
       * curl o herramientas internas.
       */
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      const error =
        new Error(
          'Origen no permitido'
        );

      error.statusCode =
        403;

      return callback(
        error
      );
    },

    methods: [
      'GET',
      'POST',
      'PATCH',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],

    credentials:
      false
  })
);

app.use(
  express.json({
    limit: '128kb'
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: '64kb'
  })
);

app.get(
  '/healthz',
  (
    req,
    res
  ) => {
    return res.json({
      ok: true,
      service:
        'private-forms-api'
    });
  }
);

app.get(
  '/readyz',
  async (
    req,
    res,
    next
  ) => {
    try {
      await checkDatabaseConnection();

      return res.json({
        ok: true,

        service:
          'private-forms-api',

        database:
          'connected'
      });
    } catch (error) {
      return next(error);
    }
  }
);

/*
 * Se conserva /status
 * por compatibilidad.
 */
app.get(
  '/status',
  async (
    req,
    res,
    next
  ) => {
    try {
      await checkDatabaseConnection();

      return res.json({
        ok: true,

        service:
          'private-forms-api',

        database:
          'connected'
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.use(
  '/formularios',

  publicRateLimit,

  formRoutes
);

app.use(
  '/auth',
  authRoutes
);

app.use(
  '/admin',
  adminRoutes
);

app.use(
  (
    req,
    res
  ) => {
    return res
      .status(404)
      .json({
        ok: false,
        message:
          'Ruta no encontrada'
      });
  }
);

app.use(
  errorMiddleware
);

module.exports =
  app;