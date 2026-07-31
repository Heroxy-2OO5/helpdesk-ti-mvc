import type { ErrorRequestHandler } from 'express';
import {  HttpError } from '../errors/http-errors.js';

interface ExpressHttpError extends Error {
  status?: number;
  statusCode?: number;
}

const getStatusCode = (error: ExpressHttpError): number => {
  const statusCode = error.statusCode ?? error.status;

  if (statusCode && statusCode >= 400 && statusCode <= 599) {
    return statusCode;
  }

  return 500;
};

export const errorMiddleware: ErrorRequestHandler = (
  error: ExpressHttpError,
  _request,
  response,
  _next,
) => {
  const statusCode = getStatusCode(error);
  const isServerError = statusCode >= 500;
  const isControlledError = error instanceof HttpError;

  if (isServerError) {
    console.error('Error no controlado en la API:', error);
  }

  let code = 'BAD_REQUEST';
  let message = 'La solicitud contiene datos inválidos';
  
  if (isServerError){
    code = 'INTERNAL_SERVER_ERROR';
    message = 'Ocurrió un error interno al procesar la solicitud';
  } else if (isControlledError) {
    code = error.code;
    message = error.message;
  }

  response.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
};
