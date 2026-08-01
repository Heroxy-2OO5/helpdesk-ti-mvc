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

const TECHNICIAN_EMAIL = 'tecnico@helpdesk.local';
const TECHNICIAN_PASSWORD = 'Tecnico123*';

const OTHER_REQUESTER_EMAIL =
  'otro.solicitante.pruebas@helpdesk.local';
const OTHER_REQUESTER_PASSWORD =
  'OtroSolicitante123*';

const INACTIVE_EMAIL =
  'inactivo.pruebas@helpdesk.local';

const CRUD_USER_EMAIL =
  'crud.usuarios.pruebas@helpdesk.local';
const CRUD_USER_PASSWORD = 'UsuarioCrud123*';

const CRUD_CATEGORY_NAME =
  'Categoría CRUD de Pruebas';
const UPDATED_CATEGORY_NAME =
  'Categoría CRUD Actualizada';

const TICKET_TEST_SEARCH =
  'flujo automatizado de pruebas';

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

interface UserResponseBody {
  message?: string;
  usuario: {
    id: string;
    nombreCompleto: string;
    correo: string;
    rol: string;
    activo: boolean;
  };
}

interface UserListResponseBody {
  usuarios: UserResponseBody['usuario'][];
  paginacion: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CategoryResponseBody {
  message?: string;
  categoria: {
    id: string;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    desactivadoEn: string | null;
    desactivadoPorId: string | null;
  };
}

interface CategoryListResponseBody {
  categorias: CategoryResponseBody['categoria'][];
  paginacion: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TicketResponseBody {
  message?: string;
  ticket: {
    id: string;
    codigo: string;
    titulo: string;
    estadoCodigo: string;
    prioridadCodigo: string;
    solicitanteId: string;
    tecnicoId: string | null;
    solucion: string | null;
    activo: boolean;
    motivoEliminacion: string | null;
    historial: Array<{
      tipoEventoCodigo: string;
      observacion: string;
    }>;
  };
}

interface TicketListResponseBody {
  tickets: TicketResponseBody['ticket'][];
  paginacion: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

  test(
    'GET /api/users rechaza solicitudes sin token',
    async () => {
      const response = await fetch(
        `${baseUrl}/api/users`,
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
    'un solicitante recibe 403 al consultar usuarios',
    async () => {
      const loginResult = await requestLogin(
        REQUESTER_EMAIL,
        REQUESTER_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/users`,
        {
          headers: {
            authorization: `Bearer ${loginBody.token}`,
          },
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 403);
      assert.equal(body.error.code, 'FORBIDDEN');
    },
  );

  test(
    'POST /api/users valida los datos enviados',
    async () => {
      const loginResult = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/users`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${loginBody.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            nombreCompleto: 'A',
            correo: 'correo-invalido',
            contrasena: '123',
            rol: 'INVALID_ROLE',
          }),
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 400);
      assert.equal(
        body.error.code,
        'VALIDATION_ERROR',
      );
    },
  );

  test(
    'un administrador ejecuta el CRUD completo de usuarios',
    async () => {
      await pool.query(
        'DELETE FROM usuarios WHERE correo = $1',
        [CRUD_USER_EMAIL],
      );

      const loginResult = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);
      const headers = {
        authorization: `Bearer ${loginBody.token}`,
        'content-type': 'application/json',
      };

      try {
        const createResponse = await fetch(
          `${baseUrl}/api/users`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              nombreCompleto: 'Usuario CRUD de Pruebas',
              correo: CRUD_USER_EMAIL,
              contrasena: CRUD_USER_PASSWORD,
              rol: 'REQUESTER',
            }),
          },
        );
        const createBody =
          (await createResponse.json()) as UserResponseBody;

        assert.equal(createResponse.status, 201);
        assert.equal(createBody.usuario.correo, CRUD_USER_EMAIL);
        assert.equal(createBody.usuario.rol, 'REQUESTER');
        assert.equal(createBody.usuario.activo, true);
        assert.equal(
          Object.hasOwn(createBody.usuario, 'contrasenaHash'),
          false,
        );

        const userId = createBody.usuario.id;

        const listResponse = await fetch(
          `${baseUrl}/api/users?search=${CRUD_USER_EMAIL}&page=1&limit=10`,
          { headers },
        );
        const listBody =
          (await listResponse.json()) as UserListResponseBody;

        assert.equal(listResponse.status, 200);
        assert.equal(listBody.usuarios.length, 1);
        assert.equal(listBody.usuarios[0]?.id, userId);
        assert.equal(listBody.paginacion.total, 1);

        const detailResponse = await fetch(
          `${baseUrl}/api/users/${userId}`,
          { headers },
        );
        const detailBody =
          (await detailResponse.json()) as UserResponseBody;

        assert.equal(detailResponse.status, 200);
        assert.equal(detailBody.usuario.id, userId);

        const updateResponse = await fetch(
          `${baseUrl}/api/users/${userId}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              nombreCompleto: 'Usuario CRUD Actualizado',
              rol: 'TECHNICIAN',
              contrasena: 'UsuarioActualizado123*',
            }),
          },
        );
        const updateBody =
          (await updateResponse.json()) as UserResponseBody;

        assert.equal(updateResponse.status, 200);
        assert.equal(
          updateBody.usuario.nombreCompleto,
          'Usuario CRUD Actualizado',
        );
        assert.equal(updateBody.usuario.rol, 'TECHNICIAN');

        const updatedLogin = await requestLogin(
          CRUD_USER_EMAIL,
          'UsuarioActualizado123*',
        );

        assert.equal(updatedLogin.response.status, 200);

        const deleteResponse = await fetch(
          `${baseUrl}/api/users/${userId}`,
          {
            method: 'DELETE',
            headers,
          },
        );
        const deleteBody =
          (await deleteResponse.json()) as UserResponseBody;

        assert.equal(deleteResponse.status, 200);
        assert.equal(deleteBody.usuario.activo, false);

        const inactiveLogin = await requestLogin(
          CRUD_USER_EMAIL,
          'UsuarioActualizado123*',
        );

        assert.equal(inactiveLogin.response.status, 401);
      } finally {
        await pool.query(
          'DELETE FROM usuarios WHERE correo = $1',
          [CRUD_USER_EMAIL],
        );
      }
    },
  );

  test(
    'POST /api/users rechaza correos duplicados',
    async () => {
      const loginResult = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/users`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${loginBody.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            nombreCompleto: 'Administrador Duplicado',
            correo: ADMIN_EMAIL,
            contrasena: 'Administrador123*',
            rol: 'ADMINISTRATOR',
          }),
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 409);
      assert.equal(
        body.error.code,
        'EMAIL_ALREADY_EXISTS',
      );
    },
  );

  test(
    'GET /api/users valida el identificador solicitado',
    async () => {
      const loginResult = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/users/identificador-invalido`,
        {
          headers: {
            authorization: `Bearer ${loginBody.token}`,
          },
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 400);
      assert.equal(
        body.error.code,
        'VALIDATION_ERROR',
      );
    },
  );

  test(
    'un administrador no puede desactivar su propia cuenta',
    async () => {
      const loginResult = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/users/${loginBody.usuario.id}`,
        {
          method: 'DELETE',
          headers: {
            authorization: `Bearer ${loginBody.token}`,
          },
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 409);
      assert.equal(
        body.error.code,
        'SELF_DEACTIVATION_NOT_ALLOWED',
      );
    },
  );

  test(
    'GET /api/categories rechaza solicitudes sin token',
    async () => {
      const response = await fetch(
        `${baseUrl}/api/categories`,
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 401);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    },
  );

  test(
    'un solicitante no puede crear categorías',
    async () => {
      const loginResult = await requestLogin(
        REQUESTER_EMAIL,
        REQUESTER_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/categories`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${loginBody.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            nombre: 'Categoría No Permitida',
          }),
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 403);
      assert.equal(body.error.code, 'FORBIDDEN');
    },
  );

  test(
    'POST /api/categories valida los datos enviados',
    async () => {
      const loginResult = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/categories`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${loginBody.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            nombre: 'A',
            descripcion: 'x'.repeat(301),
          }),
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 400);
      assert.equal(
        body.error.code,
        'VALIDATION_ERROR',
      );
    },
  );

  test(
    'un administrador ejecuta el CRUD y la eliminación lógica de categorías',
    async () => {
      await pool.query(
        `DELETE FROM categorias
        WHERE nombre = $1 OR nombre = $2`,
        [CRUD_CATEGORY_NAME, UPDATED_CATEGORY_NAME],
      );

      const adminLogin = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const adminBody = getLoginBody(adminLogin.body);
      const adminHeaders = {
        authorization: `Bearer ${adminBody.token}`,
        'content-type': 'application/json',
      };

      const requesterLogin = await requestLogin(
        REQUESTER_EMAIL,
        REQUESTER_PASSWORD,
      );
      const requesterBody = getLoginBody(requesterLogin.body);
      const requesterHeaders = {
        authorization: `Bearer ${requesterBody.token}`,
      };

      try {
        const createResponse = await fetch(
          `${baseUrl}/api/categories`,
          {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({
              nombre: CRUD_CATEGORY_NAME,
              descripcion: 'Categoría temporal para pruebas',
            }),
          },
        );
        const createBody =
          (await createResponse.json()) as CategoryResponseBody;

        assert.equal(createResponse.status, 201);
        assert.equal(
          createBody.categoria.nombre,
          CRUD_CATEGORY_NAME,
        );
        assert.equal(createBody.categoria.activo, true);

        const categoryId = createBody.categoria.id;
        const encodedSearch = encodeURIComponent(
          CRUD_CATEGORY_NAME,
        );

        const listResponse = await fetch(
          `${baseUrl}/api/categories?search=${encodedSearch}&page=1&limit=10`,
          { headers: adminHeaders },
        );
        const listBody =
          (await listResponse.json()) as CategoryListResponseBody;

        assert.equal(listResponse.status, 200);
        assert.equal(listBody.categorias.length, 1);
        assert.equal(listBody.categorias[0]?.id, categoryId);

        const detailResponse = await fetch(
          `${baseUrl}/api/categories/${categoryId}`,
          { headers: adminHeaders },
        );
        const detailBody =
          (await detailResponse.json()) as CategoryResponseBody;

        assert.equal(detailResponse.status, 200);
        assert.equal(detailBody.categoria.id, categoryId);

        const updateResponse = await fetch(
          `${baseUrl}/api/categories/${categoryId}`,
          {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({
              nombre: UPDATED_CATEGORY_NAME,
              descripcion: 'Descripción actualizada',
            }),
          },
        );
        const updateBody =
          (await updateResponse.json()) as CategoryResponseBody;

        assert.equal(updateResponse.status, 200);
        assert.equal(
          updateBody.categoria.nombre,
          UPDATED_CATEGORY_NAME,
        );

        const deleteResponse = await fetch(
          `${baseUrl}/api/categories/${categoryId}`,
          {
            method: 'DELETE',
            headers: adminHeaders,
          },
        );
        const deleteBody =
          (await deleteResponse.json()) as CategoryResponseBody;

        assert.equal(deleteResponse.status, 200);
        assert.equal(deleteBody.categoria.activo, false);
        assert.ok(deleteBody.categoria.desactivadoEn);
        assert.equal(
          deleteBody.categoria.desactivadoPorId,
          adminBody.usuario.id,
        );

        const databaseResult = await pool.query<{
          activo: boolean;
          desactivado_en: Date | null;
          desactivado_por_id: string | null;
        }>(
          `SELECT
              activo,
              desactivado_en,
              desactivado_por_id::text
          FROM categorias
          WHERE id = $1`,
          [categoryId],
        );

        assert.equal(databaseResult.rowCount, 1);
        assert.equal(databaseResult.rows[0]?.activo, false);
        assert.ok(databaseResult.rows[0]?.desactivado_en);
        assert.equal(
          databaseResult.rows[0]?.desactivado_por_id,
          adminBody.usuario.id,
        );

        const hiddenDetailResponse = await fetch(
          `${baseUrl}/api/categories/${categoryId}`,
          { headers: requesterHeaders },
        );
        const hiddenDetailBody =
          (await hiddenDetailResponse.json()) as ErrorResponseBody;

        assert.equal(hiddenDetailResponse.status, 404);
        assert.equal(
          hiddenDetailBody.error.code,
          'CATEGORY_NOT_FOUND',
        );

        const reactivateResponse = await fetch(
          `${baseUrl}/api/categories/${categoryId}`,
          {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({ activo: true }),
          },
        );
        const reactivateBody =
          (await reactivateResponse.json()) as CategoryResponseBody;

        assert.equal(reactivateResponse.status, 200);
        assert.equal(reactivateBody.categoria.activo, true);
        assert.equal(
          reactivateBody.categoria.desactivadoEn,
          null,
        );
      } finally {
        await pool.query(
          `DELETE FROM categorias
          WHERE nombre = $1 OR nombre = $2`,
          [CRUD_CATEGORY_NAME, UPDATED_CATEGORY_NAME],
        );
      }
    },
  );

  test(
    'POST /api/categories rechaza nombres duplicados',
    async () => {
      const loginResult = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/categories`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${loginBody.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            nombre: 'Hardware',
            descripcion: 'Nombre duplicado para pruebas',
          }),
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 409);
      assert.equal(
        body.error.code,
        'CATEGORY_ALREADY_EXISTS',
      );
    },
  );

  test(
    'GET /api/categories valida el identificador solicitado',
    async () => {
      const loginResult = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/categories/id-invalido`,
        {
          headers: {
            authorization: `Bearer ${loginBody.token}`,
          },
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 400);
      assert.equal(
        body.error.code,
        'VALIDATION_ERROR',
      );
    },
  );

  test(
    'GET /api/tickets rechaza solicitudes sin token',
    async () => {
      const response = await fetch(
        `${baseUrl}/api/tickets`,
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 401);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    },
  );

  test(
    'POST /api/tickets valida los datos enviados',
    async () => {
      const loginResult = await requestLogin(
        REQUESTER_EMAIL,
        REQUESTER_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/tickets`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${loginBody.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            titulo: 'A',
            descripcion: 'Corta',
            categoriaId: 'id-invalido',
            prioridadCodigo: 'URGENT',
          }),
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 400);
      assert.equal(
        body.error.code,
        'VALIDATION_ERROR',
      );
    },
  );

  test(
    'un técnico no puede crear tickets',
    async () => {
      const loginResult = await requestLogin(
        TECHNICIAN_EMAIL,
        TECHNICIAN_PASSWORD,
      );
      const loginBody = getLoginBody(loginResult.body);

      const response = await fetch(
        `${baseUrl}/api/tickets`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${loginBody.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            titulo: 'Ticket no permitido',
            descripcion: 'Este ticket no debe ser creado por un técnico.',
            categoriaId: '1',
            prioridadCodigo: 'LOW',
          }),
        },
      );

      const body =
        (await response.json()) as ErrorResponseBody;

      assert.equal(response.status, 403);
      assert.equal(body.error.code, 'FORBIDDEN');
    },
  );

  test(
    'tickets respetan roles, estados, solución e historial inmutable',
    async () => {
      const adminLogin = await requestLogin(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      const adminBody = getLoginBody(adminLogin.body);
      const adminHeaders = {
        authorization: `Bearer ${adminBody.token}`,
        'content-type': 'application/json',
      };

      const requesterLogin = await requestLogin(
        REQUESTER_EMAIL,
        REQUESTER_PASSWORD,
      );
      const requesterBody = getLoginBody(requesterLogin.body);
      const requesterHeaders = {
        authorization: `Bearer ${requesterBody.token}`,
        'content-type': 'application/json',
      };

      const technicianLogin = await requestLogin(
        TECHNICIAN_EMAIL,
        TECHNICIAN_PASSWORD,
      );
      const technicianBody = getLoginBody(technicianLogin.body);
      const technicianHeaders = {
        authorization: `Bearer ${technicianBody.token}`,
        'content-type': 'application/json',
      };

      await pool.query(
        `UPDATE tickets
        SET
          activo = FALSE,
          actualizado_por_id = $1,
          eliminado_por_id = $1,
          motivo_eliminacion = 'Limpieza de una ejecución anterior'
        WHERE activo = TRUE
          AND titulo ILIKE '%' || $2 || '%'`,
        [adminBody.usuario.id, TICKET_TEST_SEARCH],
      );

      await pool.query(
        'DELETE FROM usuarios WHERE correo = $1',
        [OTHER_REQUESTER_EMAIL],
      );

      const otherRequesterHash = await hashPassword(
        OTHER_REQUESTER_PASSWORD,
      );

      await pool.query(
        `INSERT INTO usuarios (
          rol_codigo,
          nombre_completo,
          correo,
          contrasena_hash
        ) VALUES ($1, $2, $3, $4)`,
        [
          'REQUESTER',
          'Otro Solicitante de Pruebas',
          OTHER_REQUESTER_EMAIL,
          otherRequesterHash,
        ],
      );

      try {
        const otherRequesterLogin = await requestLogin(
          OTHER_REQUESTER_EMAIL,
          OTHER_REQUESTER_PASSWORD,
        );
        const otherRequesterBody = getLoginBody(
          otherRequesterLogin.body,
        );
        const otherRequesterHeaders = {
          authorization: `Bearer ${otherRequesterBody.token}`,
          'content-type': 'application/json',
        };

        const categoryResult = await pool.query<{
          id: string;
        }>(
          `SELECT id::text
          FROM categorias
          WHERE activo = TRUE
          ORDER BY id
          LIMIT 1`,
        );
        const categoryId = categoryResult.rows[0]?.id;

        assert.ok(categoryId);

        const createResponse = await fetch(
          `${baseUrl}/api/tickets`,
          {
            method: 'POST',
            headers: requesterHeaders,
            body: JSON.stringify({
              titulo: `Ticket ${TICKET_TEST_SEARCH}`,
              descripcion:
                'El equipo de pruebas presenta una falla que requiere atención técnica.',
              categoriaId: categoryId,
              prioridadCodigo: 'MEDIUM',
            }),
          },
        );
        const createBody =
          (await createResponse.json()) as TicketResponseBody;

        assert.equal(createResponse.status, 201);
        assert.match(
          createBody.ticket.codigo,
          /^HD-[0-9]{4}-[0-9]{6,}$/,
        );
        assert.equal(createBody.ticket.estadoCodigo, 'PENDING');
        assert.equal(
          createBody.ticket.solicitanteId,
          requesterBody.usuario.id,
        );
        assert.equal(createBody.ticket.tecnicoId, null);
        assert.deepEqual(
          createBody.ticket.historial.map(
            (item) => item.tipoEventoCodigo,
          ),
          ['CREATED'],
        );

        const ticketId = createBody.ticket.id;
        const ticketCode = createBody.ticket.codigo;

        const updateResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}`,
          {
            method: 'PATCH',
            headers: requesterHeaders,
            body: JSON.stringify({
              titulo: `Ticket ${TICKET_TEST_SEARCH} actualizado`,
              prioridadCodigo: 'HIGH',
            }),
          },
        );
        const updateBody =
          (await updateResponse.json()) as TicketResponseBody;

        assert.equal(updateResponse.status, 200);
        assert.equal(updateBody.ticket.prioridadCodigo, 'HIGH');
        assert.ok(
          updateBody.ticket.historial.some(
            (item) => item.tipoEventoCodigo === 'UPDATED',
          ),
        );

        const forbiddenDetailResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}`,
          { headers: otherRequesterHeaders },
        );
        const forbiddenDetailBody =
          (await forbiddenDetailResponse.json()) as ErrorResponseBody;

        assert.equal(forbiddenDetailResponse.status, 403);
        assert.equal(forbiddenDetailBody.error.code, 'FORBIDDEN');

        const technicianBeforeResponse = await fetch(
          `${baseUrl}/api/tickets?search=${encodeURIComponent(ticketCode)}`,
          { headers: technicianHeaders },
        );
        const technicianBeforeBody =
          (await technicianBeforeResponse.json()) as TicketListResponseBody;

        assert.equal(technicianBeforeResponse.status, 200);
        assert.equal(technicianBeforeBody.tickets.length, 0);

        const requesterAssignmentResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}/assignment`,
          {
            method: 'PATCH',
            headers: requesterHeaders,
            body: JSON.stringify({
              tecnicoId: technicianBody.usuario.id,
            }),
          },
        );
        const requesterAssignmentBody =
          (await requesterAssignmentResponse.json()) as ErrorResponseBody;

        assert.equal(requesterAssignmentResponse.status, 403);
        assert.equal(
          requesterAssignmentBody.error.code,
          'FORBIDDEN',
        );

        const assignmentResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}/assignment`,
          {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({
              tecnicoId: technicianBody.usuario.id,
            }),
          },
        );
        const assignmentBody =
          (await assignmentResponse.json()) as TicketResponseBody;

        assert.equal(assignmentResponse.status, 200);
        assert.equal(assignmentBody.ticket.estadoCodigo, 'ASSIGNED');
        assert.equal(
          assignmentBody.ticket.tecnicoId,
          technicianBody.usuario.id,
        );

        const technicianAfterResponse = await fetch(
          `${baseUrl}/api/tickets?search=${encodeURIComponent(ticketCode)}`,
          { headers: technicianHeaders },
        );
        const technicianAfterBody =
          (await technicianAfterResponse.json()) as TicketListResponseBody;

        assert.equal(technicianAfterResponse.status, 200);
        assert.equal(technicianAfterBody.tickets.length, 1);
        assert.equal(technicianAfterBody.tickets[0]?.id, ticketId);

        const invalidTransitionResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}/status`,
          {
            method: 'PATCH',
            headers: technicianHeaders,
            body: JSON.stringify({
              estadoCodigo: 'RESOLVED',
              solucion: 'Solución adelantada no permitida',
            }),
          },
        );
        const invalidTransitionBody =
          (await invalidTransitionResponse.json()) as ErrorResponseBody;

        assert.equal(invalidTransitionResponse.status, 409);
        assert.equal(
          invalidTransitionBody.error.code,
          'INVALID_STATUS_TRANSITION',
        );

        const requesterLateUpdateResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}`,
          {
            method: 'PATCH',
            headers: requesterHeaders,
            body: JSON.stringify({
              titulo: 'Cambio fuera de estado pendiente',
            }),
          },
        );
        const requesterLateUpdateBody =
          (await requesterLateUpdateResponse.json()) as ErrorResponseBody;

        assert.equal(requesterLateUpdateResponse.status, 409);
        assert.equal(
          requesterLateUpdateBody.error.code,
          'TICKET_NOT_EDITABLE',
        );

        const progressResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}/status`,
          {
            method: 'PATCH',
            headers: technicianHeaders,
            body: JSON.stringify({
              estadoCodigo: 'IN_PROGRESS',
            }),
          },
        );
        const progressBody =
          (await progressResponse.json()) as TicketResponseBody;

        assert.equal(progressResponse.status, 200);
        assert.equal(progressBody.ticket.estadoCodigo, 'IN_PROGRESS');

        const noSolutionResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}/status`,
          {
            method: 'PATCH',
            headers: technicianHeaders,
            body: JSON.stringify({
              estadoCodigo: 'RESOLVED',
            }),
          },
        );
        const noSolutionBody =
          (await noSolutionResponse.json()) as ErrorResponseBody;

        assert.equal(noSolutionResponse.status, 400);
        assert.equal(
          noSolutionBody.error.code,
          'SOLUTION_REQUIRED',
        );

        const resolutionResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}/status`,
          {
            method: 'PATCH',
            headers: technicianHeaders,
            body: JSON.stringify({
              estadoCodigo: 'RESOLVED',
              solucion:
                'Se reemplazó el componente defectuoso y se verificó el equipo.',
            }),
          },
        );
        const resolutionBody =
          (await resolutionResponse.json()) as TicketResponseBody;

        assert.equal(resolutionResponse.status, 200);
        assert.equal(resolutionBody.ticket.estadoCodigo, 'RESOLVED');
        assert.ok(resolutionBody.ticket.solucion);

        const technicianCloseResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}/status`,
          {
            method: 'PATCH',
            headers: technicianHeaders,
            body: JSON.stringify({
              estadoCodigo: 'CLOSED',
            }),
          },
        );
        const technicianCloseBody =
          (await technicianCloseResponse.json()) as ErrorResponseBody;

        assert.equal(technicianCloseResponse.status, 403);
        assert.equal(technicianCloseBody.error.code, 'FORBIDDEN');

        const closeResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}/status`,
          {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({
              estadoCodigo: 'CLOSED',
            }),
          },
        );
        const closeBody =
          (await closeResponse.json()) as TicketResponseBody;

        assert.equal(closeResponse.status, 200);
        assert.equal(closeBody.ticket.estadoCodigo, 'CLOSED');

        const deleteResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}`,
          {
            method: 'DELETE',
            headers: adminHeaders,
            body: JSON.stringify({
              motivo: 'Finalización de la prueba integral de tickets',
            }),
          },
        );
        const deleteBody =
          (await deleteResponse.json()) as TicketResponseBody;

        assert.equal(deleteResponse.status, 200);
        assert.equal(deleteBody.ticket.activo, false);
        assert.equal(
          deleteBody.ticket.motivoEliminacion,
          'Finalización de la prueba integral de tickets',
        );

        const eventTypes = deleteBody.ticket.historial.map(
          (item) => item.tipoEventoCodigo,
        );

        for (const expectedEvent of [
          'CREATED',
          'UPDATED',
          'ASSIGNED',
          'STATUS_CHANGED',
          'SOLUTION_RECORDED',
          'DELETED',
        ]) {
          assert.ok(eventTypes.includes(expectedEvent));
        }

        await assert.rejects(
          pool.query(
            `UPDATE historial_tickets
            SET observacion = 'Intento de modificación'
            WHERE ticket_id = $1`,
            [ticketId],
          ),
          /historial de tickets es inmutable/i,
        );

        const requesterDeletedResponse = await fetch(
          `${baseUrl}/api/tickets/${ticketId}`,
          { headers: requesterHeaders },
        );
        const requesterDeletedBody =
          (await requesterDeletedResponse.json()) as ErrorResponseBody;

        assert.equal(requesterDeletedResponse.status, 404);
        assert.equal(
          requesterDeletedBody.error.code,
          'TICKET_NOT_FOUND',
        );

        const inactiveListResponse = await fetch(
          `${baseUrl}/api/tickets?activo=false&search=${encodeURIComponent(ticketCode)}`,
          { headers: adminHeaders },
        );
        const inactiveListBody =
          (await inactiveListResponse.json()) as TicketListResponseBody;

        assert.equal(inactiveListResponse.status, 200);
        assert.ok(
          inactiveListBody.tickets.some(
            (ticket) => ticket.id === ticketId,
          ),
        );
      } finally {
        await pool.query(
          `UPDATE tickets
          SET
            activo = FALSE,
            actualizado_por_id = $1,
            eliminado_por_id = $1,
            motivo_eliminacion = 'Limpieza final de pruebas'
          WHERE activo = TRUE
            AND titulo ILIKE '%' || $2 || '%'`,
          [adminBody.usuario.id, TICKET_TEST_SEARCH],
        );

        await pool.query(
          'DELETE FROM usuarios WHERE correo = $1',
          [OTHER_REQUESTER_EMAIL],
        );
      }
    },
  );
});
