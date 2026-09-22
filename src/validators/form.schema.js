const {
  z
} = require('zod');

const optionalTrimmedString = (
  maxLength
) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform(
      (value) =>
        value === ''
          ? undefined
          : value
    );

const formSchema =
  z.object({
    tipo:
      z
        .enum([
          'contacto',
          'cotizacion',
          'personalizado'
        ])
        .default(
          'contacto'
        ),

    nombre:
      z
        .string()
        .trim()
        .min(
          2,
          'El nombre debe tener al menos 2 caracteres'
        )
        .max(
          120,
          'El nombre es demasiado largo'
        ),

    email:
      z
        .string()
        .trim()
        .toLowerCase()
        .email(
          'Email inválido'
        )
        .max(180),

    telefono:
      optionalTrimmedString(
        50
      ),

    empresa:
      optionalTrimmedString(
        150
      ),

    asunto:
      optionalTrimmedString(
        180
      ),

    mensaje:
      optionalTrimmedString(
        3000
      ),

    metadata:
      z
        .record(
          z.string(),
          z.unknown()
        )
        .optional()
  })
  .strip();

module.exports = {
  formSchema
};