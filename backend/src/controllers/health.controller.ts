import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../models/health.model.js';

export const checkHealth = async (req: Request, res: Response): Promise<void> => {
    const isDbConnected = await checkDatabaseConnection();

    if (isDbConnected) {
        res.status(200).json({
            api: 'ok',
            database: 'ok',
            message: 'HelpDesk TI API y PostgreSQL funcionando correctamente'
        });
    } else {
        res.status(500).json({
            api: 'ok',
            database: 'error',
            message: 'Error al conectar con PostgreSQL'
        });
    }
};