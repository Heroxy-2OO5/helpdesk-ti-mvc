import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import jwt from 'jsonwebtoken';

import { app } from './app.js';
import { pool } from './config/database.js';
import { environment } from './config/environment.js';
import {
  hashPassword,
  verifyPassword,
} from './utils/password.js';

const ADMIN_EMAIL = 'admin@helpdesk.local';
const ADMIN_PASSWORD = 'Admin123*';

const REQUESTER_EMAIL = 'solicitante@helpdesk.local';
const REQUESTER_PASSWORD = 'Solicitante123*';

const INACTIVE_EMAIL =
  'inactivo.pruebas@helpdesk.local';

interface LoginResponseBody {
  token: string;
  expiresIn: string;
  usuario: {
    id: string;
    nombreCompleto: string;
    correo: string;
    rol: string;
  };
}

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
  };
}

let server: Server;
let baseUrl: string;

const requestLogin = async (
  correo: string,
  contrasena: string,
): Promise<{
  response: Response;
  body: LoginResponseBody | ErrorResponseBody;
}> => {
  const response = await fetch(
    `${baseUrl}/api/auth/login`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        correo,
        contrasena,
      }),
    },
  );

  const body = (await response.json()) as
    | LoginResponseBody
    | ErrorResponseBody;

  return {
    response,
    body,
  };
};

const getLoginBody = (
  body: LoginResponseBody | ErrorResponseBody,
): LoginResponseBody => {
  assert.ok('token' in body);
  return body;
};

const getErrorBody = (
  body: LoginResponseBody | ErrorResponseBody,
): ErrorResponseBody => {
  assert.ok('error' in body);
  return body;
};

before(
  () =>
    new Promise<void>((resolve, reject) => {
      server = app.listen(
        0,
        '127.0.0.1',
        () => {
          const address =
            server.address() as AddressInfo;

          baseUrl =
            `http://127.0.0.1:${address.port}`;

          resolve();
        },
      );

      server.on('error', reject);
    }),
);

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await pool.end();
});

describe('API HelpDesk TI', () => {
  test(
    'GET /api/health informa que la API y PostgreSQL están disponibles',
    async () => {
      const response = await fetch(
        `${baseUrl}/api/health`,
      );

      const body = (await response.json()) as {
        api: string;
        database: string;
        message: string;
      };

      assert.equal(response.status, 200);
      assert.equal(body.api, 'ok');
      assert.equal(body.database, 'ok');
      assert.equal(
        body.message,
        'HelpDesk TI API y PostgreSQL funcionando correctamente',
      );
    },
  );

  test(
    'una ruta inexistente devuelve un error 404 controlado',
    async () => {
      const response = await fetch(
        `${baseUrl}/api/no-existe`,
      );

      const body = (await response.json()) as {
        error: {
          code: string;
          path: string;
        };
      };

      assert.equal(response.status, 404);
      assert.equal(
        body.error.code,
        'ROUTE_NOT_FOUND',
      );
      assert.equal(
        body.error.path,
        '/api/no-existe',
      );
    },
  );

  test(
    'un JSON inválido devuelve un error 400 controlado',
    async () => {
      const response = await fetch(
        `${baseUrl}/api/health`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: '{',
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 400);
      assert.equal(
        body.error.code,
        'BAD_REQUEST',
      );
    },
  );

  test(
    'bcrypt cifra y verifica una contraseña sin guardar texto plano',
    async () => {
      const password = 'ClaveSegura123*';
      const passwordHash =
        await hashPassword(password);

      assert.notEqual(passwordHash, password);

      assert.equal(
        await verifyPassword(
          password,
          passwordHash,
        ),
        true,
      );

      assert.equal(
        await verifyPassword(
          'ClaveIncorrecta123*',
          passwordHash,
        ),
        false,
      );
    },
  );

  test(
    'POST /api/auth/login entrega un JWT con datos seguros',
    async () => {
      const { response, body } =
        await requestLogin(
          ADMIN_EMAIL,
          ADMIN_PASSWORD,
        );

      const loginBody = getLoginBody(body);

      assert.equal(response.status, 200);
      assert.ok(loginBody.token.length > 20);
      assert.equal(loginBody.expiresIn, '2h');
      assert.equal(
        loginBody.usuario.correo,
        ADMIN_EMAIL,
      );
      assert.equal(
        loginBody.usuario.rol,
        'ADMINISTRATOR',
      );
      assert.equal(
        Object.hasOwn(
          loginBody.usuario,
          'contrasenaHash',
        ),
        false,
      );
    },
  );

  test(
    'el login rechaza una contraseña incorrecta con mensaje genérico',
    async () => {
      const { response, body } =
        await requestLogin(
          ADMIN_EMAIL,
          'ClaveIncorrecta123*',
        );

      const errorBody = getErrorBody(body);

      assert.equal(response.status, 401);
      assert.equal(
        errorBody.error.code,
        'INVALID_CREDENTIALS',
      );
      assert.equal(
        errorBody.error.message,
        'El correo o la contraseña son incorrectos',
      );
    },
  );

  test(
    'el login rechaza un intento de inyección SQL',
    async () => {
      const { response, body } =
        await requestLogin(
          "' OR 1=1 --",
          '12345678',
        );

      const errorBody = getErrorBody(body);

      assert.equal(response.status, 400);
      assert.equal(
        errorBody.error.code,
        'VALIDATION_ERROR',
      );
    },
  );

  test(
    'el login rechaza usuarios inactivos',
    async () => {
      await pool.query(
        'DELETE FROM usuarios WHERE correo = $1',
        [INACTIVE_EMAIL],
      );

      const password = 'UsuarioInactivo123*';
      const passwordHash =
        await hashPassword(password);

      await pool.query(
        `INSERT INTO usuarios (
           rol_codigo,
           nombre_completo,
           correo,
           contrasena_hash,
           activo
         )
         VALUES ($1, $2, $3, $4, FALSE)`,
        [
          'REQUESTER',
          'Usuario Inactivo de Pruebas',
          INACTIVE_EMAIL,
          passwordHash,
        ],
      );

      try {
        const { response, body } =
          await requestLogin(
            INACTIVE_EMAIL,
            password,
          );

        const errorBody =
          getErrorBody(body);

        assert.equal(response.status, 401);
        assert.equal(
          errorBody.error.code,
          'INVALID_CREDENTIALS',
        );
      } finally {
        await pool.query(
          'DELETE FROM usuarios WHERE correo = $1',
          [INACTIVE_EMAIL],
        );
      }
    },
  );

  test(
    'GET /api/auth/me rechaza solicitudes sin token',
    async () => {
      const response = await fetch(
        `${baseUrl}/api/auth/me`,
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 401);
      assert.equal(
        body.error.code,
        'UNAUTHORIZED',
      );
    },
  );

  test(
    'GET /api/auth/me rechaza un token inválido',
    async () => {
      const response = await fetch(
        `${baseUrl}/api/auth/me`,
        {
          headers: {
            authorization:
              'Bearer token-invalido',
          },
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 401);
      assert.equal(
        body.error.code,
        'UNAUTHORIZED',
      );
    },
  );

  test(
    'GET /api/auth/me rechaza un token vencido',
    async () => {
      const expiredToken = jwt.sign(
        {},
        environment.jwtSecret,
        {
          subject: '1',
          expiresIn: -1,
          algorithm: 'HS256',
        },
      );

      const response = await fetch(
        `${baseUrl}/api/auth/me`,
        {
          headers: {
            authorization:
              `Bearer ${expiredToken}`,
          },
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 401);
      assert.equal(
        body.error.code,
        'UNAUTHORIZED',
      );
    },
  );

  test(
    'GET /api/auth/me devuelve el usuario del token válido',
    async () => {
      const loginResult =
        await requestLogin(
          ADMIN_EMAIL,
          ADMIN_PASSWORD,
        );

      const loginBody =
        getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/auth/me`,
        {
          headers: {
            authorization:
              `Bearer ${loginBody.token}`,
          },
        },
      );

      const body = (await response.json()) as {
        usuario:
          LoginResponseBody['usuario'];
      };

      assert.equal(response.status, 200);
      assert.equal(
        body.usuario.correo,
        ADMIN_EMAIL,
      );
      assert.equal(
        body.usuario.rol,
        'ADMINISTRATOR',
      );
    },
  );

  test(
    'POST /api/auth/logout confirma el cierre de sesión',
    async () => {
      const loginResult =
        await requestLogin(
          ADMIN_EMAIL,
          ADMIN_PASSWORD,
        );

      const loginBody =
        getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/auth/logout`,
        {
          method: 'POST',
          headers: {
            authorization:
              `Bearer ${loginBody.token}`,
          },
        },
      );

      const body = (await response.json()) as {
        message: string;
      };

      assert.equal(response.status, 200);
      assert.equal(
        body.message,
        'Sesión cerrada correctamente',
      );
    },
  );

  test(
    'un solicitante recibe 403 en la ruta de administrador',
    async () => {
      const loginResult =
        await requestLogin(
          REQUESTER_EMAIL,
          REQUESTER_PASSWORD,
        );

      const loginBody =
        getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/auth/admin-check`,
        {
          headers: {
            authorization:
              `Bearer ${loginBody.token}`,
          },
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 403);
      assert.equal(
        body.error.code,
        'FORBIDDEN',
      );
    },
  );

  test(
    'un administrador accede a la ruta exclusiva de su rol',
    async () => {
      const loginResult =
        await requestLogin(
          ADMIN_EMAIL,
          ADMIN_PASSWORD,
        );

      const loginBody =
        getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/auth/admin-check`,
        {
          headers: {
            authorization:
              `Bearer ${loginBody.token}`,
          },
        },
      );

      const body = (await response.json()) as {
        message: string;
      };

      assert.equal(response.status, 200);
      assert.equal(
        body.message,
        'Permiso de administrador verificado',
      );
    },
  );
});