import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

// AsyncLocalStorage for request context
export const requestContext = new AsyncLocalStorage<{ requestId: string; userId?: string }>();

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    
    // Store requestId in request object
    (req as any).id = requestId;
    
    // Add X-Request-Id response header
    res.setHeader('X-Request-Id', requestId);
    
    // Run the rest of the request in AsyncLocalStorage context
    requestContext.run({ requestId }, () => {
      next();
    });
  }
}

// Helper function to get current requestId from anywhere
export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

// Helper function to set userId in context
export function setUserId(userId: string): void {
  const store = requestContext.getStore();
  if (store) {
    store.userId = userId;
  }
}

// Helper function to get userId from context
export function getUserId(): string | undefined {
  return requestContext.getStore()?.userId;
}
