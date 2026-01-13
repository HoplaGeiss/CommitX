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
      this.logger.log('🔌 Attempting to connect to database...');
      const startTime = Date.now();
      await this.$connect();
      const duration = Date.now() - startTime;
      this.logger.log(`✅ Successfully connected to database (${duration}ms)`);
    } catch (error) {
      this.logger.error('❌ Failed to connect to database');
      
      // Check for common connection errors and provide helpful messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorString = errorMessage.toLowerCase();
      
      if (errorString.includes('connect econnrefused') || 
          errorString.includes('connection refused') ||
          errorString.includes('getaddrinfo enotfound')) {
        this.logger.error('💡 Database connection refused. Possible causes:');
        this.logger.error('   1. Docker is not running - Start Docker Desktop');
        this.logger.error('   2. Database container is not running - Run: docker-compose up -d postgres');
        this.logger.error('   3. Database URL is incorrect - Check DATABASE_URL in .env');
      } else if (errorString.includes('timeout') || errorString.includes('timed out')) {
        this.logger.error('💡 Database connection timeout. Check if:');
        this.logger.error('   1. Database is running but slow to respond');
        this.logger.error('   2. Network/firewall is blocking the connection');
        this.logger.error('   3. DATABASE_URL points to the correct host and port');
      } else if (errorString.includes('authentication') || errorString.includes('password')) {
        this.logger.error('💡 Database authentication failed. Check:');
        this.logger.error('   1. Database username and password in DATABASE_URL');
        this.logger.error('   2. Database user has proper permissions');
      } else {
        this.logger.error('💡 Make sure your database is running. Try: docker-compose up -d postgres');
      }
      
      this.logger.error(`   Error details: ${errorMessage}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
