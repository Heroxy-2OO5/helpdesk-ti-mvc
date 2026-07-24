import type { ErrorRequestHandler } from 'express';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

const getStatusCode = (error: HttpError): number => {
  const statusCode = error.statusCode ?? error.status;

  if (statusCode && statusCode >= 400 && statusCode <= 599) {
    return statusCode;
  }

  return 500;
};

export const errorMiddleware: ErrorRequestHandler = (
  error: HttpError,
  _request,
  response,
  _next,
) => {
  const statusCode = getStatusCode(error);
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error('Error no controlado en la API:', error);
  }

  response.status(statusCode).json({
    error: {
      code: isServerError ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST',
      message: isServerError
        ? 'Ocurrió un error interno al procesar la solicitud'
        : 'La solicitud contiene datos inválidos',
    },
  });
};
