import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, CommitmentsModule, UsersModule],
})
export class AppModule {}

