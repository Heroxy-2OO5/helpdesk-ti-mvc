import 'dotenv/config';

const DEFAULT_PORT = 3000;
const port = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PORT debe ser un número entero entre 1 y 65535');
}

export const environment = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
} as const;
