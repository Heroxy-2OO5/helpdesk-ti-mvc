import { findMetricsDashboard } from '../models/metrics.model.js';
import type { MetricsDashboard } from '../types/metrics.types.js';

export const getMetricsDashboard = async (): Promise<
    MetricsDashboard
> => findMetricsDashboard();
