import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { getRequestId, getUserId } from './request-id.middleware';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const requestId = getRequestId() || (request as any).id;
    const userId = getUserId();

    // Determine status and message
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    // The @SentryExceptionCaptured() decorator automatically captures the exception to Sentry
    // The beforeSend hook in instrument.ts enriches it with requestId and userId
    // So we don't need to manually call Sentry.captureException here

    // Log the error with structured data (pino with requestId)
    this.logger.error({
      message: typeof message === 'string' ? message : JSON.stringify(message),
      requestId,
      userId,
      method: request.method,
      url: request.url,
      status,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Send response with requestId for correlation
    response.status(status).json({
      statusCode: status,
      message: typeof message === 'object' ? message : { message },
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}
