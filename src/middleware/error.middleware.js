function errorMiddleware(
  error,
  req,
  res,
  next
) {
  console.error(
    error?.message ||
    'Error desconocido'
  );

  if (
    res.headersSent
  ) {
    return next(error);
  }

  if (
    error?.name ===
    'ZodError'
  ) {
    return res
      .status(400)
      .json({
        ok: false,

        message:
          'Datos inválidos',

        errors:
          error.issues
      });
  }

  if (
    error?.code ===
    'LIMIT_FILE_SIZE'
  ) {
    return res
      .status(413)
      .json({
        ok: false,

        message:
          'Un PDF supera el tamaño máximo permitido'
      });
  }

  if (
    error?.code ===
    'LIMIT_FILE_COUNT'
  ) {
    return res
      .status(400)
      .json({
        ok: false,

        message:
          'Se superó la cantidad máxima de PDFs'
      });
  }

  if (
    error?.code ===
    'LIMIT_PART_COUNT'
  ) {
    return res
      .status(400)
      .json({
        ok: false,

        message:
          'La solicitud contiene demasiadas partes'
      });
  }

  if (
    error?.code ===
    'LIMIT_FIELD_COUNT'
  ) {
    return res
      .status(400)
      .json({
        ok: false,

        message:
          'La solicitud contiene demasiados campos'
      });
  }

  if (
    error?.code ===
    'LIMIT_FIELD_VALUE'
  ) {
    return res
      .status(400)
      .json({
        ok: false,

        message:
          'Uno de los campos supera el tamaño permitido'
      });
  }

  if (
    Number.isInteger(
      error?.statusCode
    )
  ) {
    return res
      .status(
        error.statusCode
      )
      .json({
        ok: false,

        message:
          error.message
      });
  }

  return res
    .status(500)
    .json({
      ok: false,

      message:
        'Error interno del servidor'
    });
}

module.exports = {
  errorMiddleware
};