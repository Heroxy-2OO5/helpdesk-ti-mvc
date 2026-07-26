import { Pool } from 'pg';
import 'dotenv/config';

// Configuración del Pool con variables de entorno
export const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
});

// Escuchar conexión exitosa
pool.on('connect', () => {
    console.log('📦 Conexión establecida con PostgreSQL');
});

// Escuchar errores inesperados
pool.on('error', (err) => {
    console.error('❌ Error inesperado en PostgreSQL', err);
    process.exit(-1);
});