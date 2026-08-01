import type { RequestHandler } from 'express';

import { getMetricsDashboard } from '../services/metrics.service.js';

export const getMetricsController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const metricas = await getMetricsDashboard();

        response.status(200).json({ metricas });
    } catch (error) {
        next(error);
    }
};
