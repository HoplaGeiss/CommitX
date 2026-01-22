import { Params } from 'nestjs-pino';
import { getRequestId } from './request-id.middleware';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const pinoLoggerConfig: Params = {
  pinoHttp: {
    // Custom request ID using our middleware
    genReqId: (req: any) => req.id || getRequestId(),
    
    // Include requestId in all logs
    customProps: (req: any) => ({
      requestId: req.id || getRequestId(),
    }),
    
    // Transport for pretty printing in development
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,req.headers,req.remoteAddress,req.remotePort',
            // Custom message format for better readability
            messageFormat: '{req.method} {req.url} → {res.statusCode} ({responseTime}ms) [{requestId}]',
            singleLine: false,
          },
        }
      : undefined,
    
    // Custom serializers
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
      err: (err: any) => ({
        type: err.type,
        message: err.message,
        stack: err.stack,
      }),
    },
    
    // Log level
    level: process.env.LOG_LEVEL || 'info',
    
    // Auto-logging options
    autoLogging: {
      ignore: (req: any) => {
        // Optionally ignore certain routes (e.g., health checks)
        return req.url === '/health' || req.url === '/api';
      },
    },
    
    // Custom log message for requests
    customSuccessMessage: (req: any, res: any) => {
      return `${req.method} ${req.url} completed`;
    },
    
    customErrorMessage: (req: any, res: any, err: any) => {
      return `${req.method} ${req.url} failed`;
    },
  },
};
