export interface HealthStatus {
  status: 'ok';
  service: string;
  timestamp: string;
}

export const createHealthStatus = (): HealthStatus => ({
  status: 'ok',
  service: 'helpdesk-ti-backend',
  timestamp: new Date().toISOString(),
});
