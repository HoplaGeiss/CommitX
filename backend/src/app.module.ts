import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { PrismaModule } from './prisma/prisma.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { UsersModule } from './users/users.module';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { pinoLoggerConfig } from './common/logger.config';

@Module({
  imports: [
    SentryModule.forRoot(),
    LoggerModule.forRoot(pinoLoggerConfig),
    PrismaModule,
    CommitmentsModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}

