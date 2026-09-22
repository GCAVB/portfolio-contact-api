# Portfolio Contact API

API REST para gestionar el formulario de contacto de mi portafolio profesional.

El backend mantiene separada la lógica privada del frontend y evita exponer información sensible como destinatarios de correo, credenciales SMTP y configuración de base de datos.

## Tecnologías

- Node.js
- Express
- PostgreSQL
- `multipart/form-data`
- Google Cloud Run

## Arquitectura

```text
Portafolio
Vercel
   │
   │ HTTPS
   ▼
Portfolio Contact API
Node.js + Express
   │
   ├── Validación
   ├── PostgreSQL
   └── Servicio de correo