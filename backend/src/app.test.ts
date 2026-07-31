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

const CRUD_USER_EMAIL =
  'crud.usuarios.pruebas@helpdesk.local';
const CRUD_USER_PASSWORD = 'UsuarioCrud123*';

const CRUD_CATEGORY_NAME =
  'Categoría CRUD de Pruebas';
const UPDATED_CATEGORY_NAME =
  'Categoría CRUD Actualizada';

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
});