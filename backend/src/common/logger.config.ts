import { Params } from 'nestjs-pino';
import { getRequestId } from './request-id.middleware';

export const pinoLoggerConfig: Params = {
  pinoHttp: {
    // Custom request ID using our middleware
    genReqId: (req: any) => req.id || getRequestId(),
    
    // Include requestId in all logs
    customProps: (req: any) => ({
      requestId: req.id || getRequestId(),
    }),
    
    // Transport for pretty printing in development
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              ignore: 'pid,hostname',
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
    
    // Custom serializers
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        // Don't log headers by default (may contain sensitive data)
        // headers: req.headers,
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
  },
};
