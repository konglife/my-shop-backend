import path from 'path';
import { parse } from 'pg-connection-string';

export default ({ env }) => {
  const isProd = env('NODE_ENV') === 'production';

  if (!isProd) {
    // Development: ใช้ SQLite
    return {
      connection: {
        client: 'sqlite',
        connection: {
          filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
        },
        useNullAsDefault: true,
      },
    };
  }

  // Production: ใช้ PostgreSQL (Neon)
  const { host, port, database, user, password } = parse(env('DATABASE_URL'));

  return {
    connection: {
      client: 'postgres',
      connection: {
        host,
        port: Number(port),
        database,
        user,
        password,
        ssl: { rejectUnauthorized: false },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
