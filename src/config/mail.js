const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendReceiptEmail(formulario) {
  if (!process.env.SMTP_HOST) {
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: formulario.email,
    subject: 'Hemos recibido tu mensaje',
    text: `
Hola ${formulario.nombre},

Hemos recibido correctamente tu solicitud.

Número de solicitud: ${formulario.id}
Estado: ${formulario.estado}

Te contactaré a la brevedad.

Saludos.
    `.trim()
  });
}

async function sendAdminNotification(
  formulario,
  uploadedFiles = []
) {
  const adminEmail = process.env.MAIL_ADMIN_TO;

  if (!adminEmail || !process.env.SMTP_HOST) {
    return;
  }

  const totalBytes = uploadedFiles.reduce(
    (total, file) =>
      total + Number(file.sizeBytes || 0),
    0
  );

  const totalMb = (
    totalBytes /
    1024 /
    1024
  ).toFixed(2);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: adminEmail,
    subject: `Nuevo formulario #${formulario.id}`,
    text: `
Nuevo formulario recibido.

ID: ${formulario.id}
Tipo: ${formulario.tipo}
Nombre: ${formulario.nombre}
Email: ${formulario.email}
Teléfono: ${formulario.telefono || 'No informado'}
Empresa: ${formulario.empresa || 'No informada'}
Asunto: ${formulario.asunto || 'Sin asunto'}
Estado: ${formulario.estado}

Archivos PDF: ${uploadedFiles.length}
Tamaño total de archivos: ${totalMb} MB

Mensaje:
${formulario.mensaje || 'Sin mensaje'}

Los archivos PDF están almacenados de forma privada en Google Cloud Storage y deben consultarse desde el panel administrativo.
    `.trim()
  });
}

module.exports = {
  sendReceiptEmail,
  sendAdminNotification
};