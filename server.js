const app =
  require('./app');

const {
  pool
} =
  require('./src/config/db');

const port =
  Number(
    process.env.PORT ||
    8080
  );

const server =
  app.listen(
    port,
    '0.0.0.0',
    () => {
      console.log(
        `API privada escuchando en puerto ${port}`
      );
    }
  );

async function shutdown(
  signal
) {
  console.log(
    `${signal} recibido. Cerrando servidor...`
  );

  server.close(
    async () => {
      try {
        await pool.end();

        console.log(
          'Conexiones cerradas correctamente.'
        );

        process.exit(0);
      } catch (error) {
        console.error(
          'Error cerrando conexiones:',
          error.message
        );

        process.exit(1);
      }
    }
  );
}

process.on(
  'SIGTERM',
  () =>
    shutdown(
      'SIGTERM'
    )
);

process.on(
  'SIGINT',
  () =>
    shutdown(
      'SIGINT'
    )
);