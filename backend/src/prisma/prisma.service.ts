import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { adapter } from '../../prisma.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Successfully connected to database');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      this.logger.error('💡 Make sure your database is running. Try: docker-compose up -d postgres');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
