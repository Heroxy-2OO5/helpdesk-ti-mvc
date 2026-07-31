import 'dotenv/config';

const DEFAULT_PORT = 3000;
const port = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);

const jwtSecret = process.env.JWT_SECRET ?? '';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '2h';

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PORT debe ser un número entero entre 1 y 65535');
}

if (jwtSecret.length < 32){
  throw new Error('JWT_SECRET debe contener al menos 32 caracteres');
}

export const environment = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  jwtSecret,
  jwtExpiresIn,
} as const;
