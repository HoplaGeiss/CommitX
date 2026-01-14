import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body } = req;
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(`➡️  ${method} ${originalUrl}`);
    
    // Log request body for non-GET requests (excluding sensitive data)
    if (method !== 'GET' && Object.keys(body).length > 0) {
      this.logger.debug(`   Body: ${JSON.stringify(body)}`);
    }

    // Log response when finished
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '↩️' : '✅';
      
      this.logger.log(`${statusEmoji}  ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    });

    next();
  }
}
