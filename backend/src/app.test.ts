import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';

import { app } from './app.js';

let server: Server;
let baseUrl: string;

before(
  () =>
    new Promise<void>((resolve, reject) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });

      server.on('error', reject);
    }),
);

after(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    }),
);

describe('API HelpDesk TI', () => {
  test('GET /api/health informa que el servicio está disponible', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = (await response.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'helpdesk-ti-backend');
    assert.equal(Number.isNaN(Date.parse(body.timestamp)), false);
  });

  test('una ruta inexistente devuelve un error 404 controlado', async () => {
    const response = await fetch(`${baseUrl}/api/no-existe`);
    const body = (await response.json()) as {
      error: { code: string; path: string };
    };

    assert.equal(response.status, 404);
    assert.equal(body.error.code, 'ROUTE_NOT_FOUND');
    assert.equal(body.error.path, '/api/no-existe');
  });

  test('un JSON inválido devuelve un error 400 controlado', async () => {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });
    const body = (await response.json()) as {
      error: { code: string };
    };

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'BAD_REQUEST');
  });
});
