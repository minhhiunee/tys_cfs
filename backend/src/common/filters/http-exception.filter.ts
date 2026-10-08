import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        code = HttpStatus[statusCode] ?? 'HTTP_ERROR';
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        message =
          typeof obj.message === 'string'
            ? obj.message
            : Array.isArray(obj.message)
              ? obj.message.join(', ')
              : message;
        code =
          typeof obj.code === 'string'
            ? obj.code
            : (HttpStatus[statusCode] ?? 'HTTP_ERROR');
        details = obj.details;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
      );
    }

    if (statusCode >= 500 && !(exception instanceof HttpException)) {
      this.logger.error(`${request.method} ${request.url}`, exception);
    }

    const payload: ApiErrorBody = {
      statusCode,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    };

    response.status(statusCode).json(payload);
  }
}
