import type { RequestHandler } from 'express';

import { createHealthStatus } from '../models/health.model.js';

export const getHealth: RequestHandler = (_request, response) => {
  response.status(200).json(createHealthStatus());
};
