import { pool } from '../config/database.js';

export const checkDatabaseConnection = async () => {
    try {
        const result = await pool.query('SELECT 1 AS status');
        return result.rows[0].status === 1;
    } catch (error) {
        console.error('Error en el modelo de salud:', error);
        return false;
    }
};