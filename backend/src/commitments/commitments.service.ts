import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Commitment } from './entities/commitment.entity';
import { Completion } from './entities/completion.entity';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@Injectable()
export class CommitmentsService {
  private readonly logger = new Logger(CommitmentsService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  /**
   * Helper method to detect database connection errors and log helpful messages
   */
  private logDatabaseConnectionError(error: unknown, operation: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = errorMessage.toLowerCase();
    const errorName = error instanceof Error ? error.constructor.name : '';
    const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null;
    
    // Prisma "Invalid invocation" errors often indicate database connection issues
    const isInvalidInvocation = errorString.includes('invalid') && errorString.includes('invocation');
    const isConnectionError = errorString.includes('connect econnrefused') || 
                              errorString.includes('connection refused') ||
                              errorString.includes('econnrefused') ||
                              errorString.includes('getaddrinfo enotfound') ||
                              errorString.includes('timeout') ||
                              errorCode === 'ECONNREFUSED' ||
                              isInvalidInvocation;
    
    if (isConnectionError || errorName.includes('PrismaClient')) {
      // Log helpful messages FIRST so they're more visible
      this.logger.error('');
      this.logger.error('💡 Database connection issue detected during ' + operation + '.');
      this.logger.error('   Possible causes:');
      this.logger.error('   1. Docker is not running - Start Docker Desktop');
      this.logger.error('   2. Database container is stopped - Run: docker-compose up -d postgres');
      this.logger.error('   3. Database connection was lost - Restart the backend after starting Docker');
      this.logger.error('   4. DATABASE_URL is incorrect - Check your .env file');
      
      if (isInvalidInvocation || errorCode === 'ECONNREFUSED') {
        this.logger.error('');
        this.logger.error('   Note: This error usually means the database is unreachable.');
        this.logger.error('   Check if Docker and the database container are running.');
      }
      this.logger.error('');
    }
    
    // Then log technical details
    this.logger.error(`   Error type: ${errorName}`);
    if (errorCode) {
      this.logger.error(`   Error code: ${errorCode}`);
    }
    if (errorMessage && errorMessage.trim()) {
      // Only log message if it's not empty (Prisma sometimes has empty messages)
      this.logger.error(`   Error message: ${errorMessage.substring(0, 200)}${errorMessage.length > 200 ? '...' : ''}`);
    }
  }

  private generateRandomShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async create(createCommitmentDto: CreateCommitmentDto): Promise<Commitment> {
    try {
      // Ensure user exists, create if not
      await this.ensureUserExists(createCommitmentDto.userId);

      const type = createCommitmentDto.type || 'self';
      let shareCode: string | undefined = undefined;

      // Generate share code for collaborative/shared challenges
      if (type === 'collaborative' || type === 'shared') {
        shareCode = this.generateRandomShareCode();
        // Ensure uniqueness
        let exists = await this.prisma.commitment.findUnique({ where: { shareCode } });
        while (exists) {
          shareCode = this.generateRandomShareCode();
          exists = await this.prisma.commitment.findUnique({ where: { shareCode } });
        }
      }

      const commitment = await this.prisma.commitment.create({
        data: {
          title: createCommitmentDto.title,
          type,
          userId: createCommitmentDto.userId,
          shareCode,
        },
      });

      // For collaborative commitments, automatically add creator as participant
      if (type === 'collaborative') {
        try {
          await this.prisma.commitmentParticipant.create({
            data: {
              commitmentId: commitment.id,
              userId: createCommitmentDto.userId,
            },
          });
        } catch (error) {
          // Ignore duplicate participant errors (shouldn't happen, but be safe)
          this.logger.warn(`Failed to add creator as participant for commitment ${commitment.id}:`, error);
        }
      }

      return {
        id: commitment.id,
        title: commitment.title,
        type: commitment.type,
        userId: commitment.userId,
        shareCode: commitment.shareCode || undefined,
        ownerId: commitment.ownerId || undefined,
        createdAt: commitment.createdAt.toISOString(),
        updatedAt: commitment.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to create commitment');
      this.logDatabaseConnectionError(error, 'create commitment');
      throw error;
    }
  }

  async findAll(userId?: string): Promise<Commitment[]> {
    try {
      const where = userId ? { userId } : {};
      const commitments = await this.prisma.commitment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return commitments.map(c => ({
        id: c.id,
        title: c.title,
        type: c.type,
        userId: c.userId,
        shareCode: c.shareCode || undefined,
        ownerId: c.ownerId || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('Failed to fetch commitments');
      this.logDatabaseConnectionError(error, 'fetch commitments');
      throw error;
    }
  }

  async findOne(id: string): Promise<Commitment> {
    const commitment = await this.prisma.commitment.findUnique({
      where: { id },
    });

    if (!commitment) {
      throw new NotFoundException(`Commitment with ID ${id} not found`);
    }

    return {
      id: commitment.id,
      title: commitment.title,
      type: commitment.type,
      userId: commitment.userId,
      shareCode: commitment.shareCode || undefined,
      ownerId: commitment.ownerId || undefined,
      createdAt: commitment.createdAt.toISOString(),
      updatedAt: commitment.updatedAt.toISOString(),
    };
  }

  async update(id: string, updateCommitmentDto: UpdateCommitmentDto): Promise<Commitment> {
    try {
      const commitment = await this.prisma.commitment.update({
        where: { id },
        data: updateCommitmentDto,
      });

      return {
        id: commitment.id,
        title: commitment.title,
        type: commitment.type,
        userId: commitment.userId,
        shareCode: commitment.shareCode || undefined,
        ownerId: commitment.ownerId || undefined,
        createdAt: commitment.createdAt.toISOString(),
        updatedAt: commitment.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to update commitment ${id}`);
      this.logDatabaseConnectionError(error, 'update commitment');
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.commitment.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete commitment ${id}`);
      this.logDatabaseConnectionError(error, 'delete commitment');
      throw error;
    }
  }

  async generateShareCode(commitmentId: string): Promise<{ shareCode: string }> {
    let shareCode = this.generateRandomShareCode();
    let exists = await this.prisma.commitment.findUnique({ where: { shareCode } });
    while (exists) {
      shareCode = this.generateRandomShareCode();
      exists = await this.prisma.commitment.findUnique({ where: { shareCode } });
    }

    const commitment = await this.prisma.commitment.update({
      where: { id: commitmentId },
      data: { shareCode },
    });

    return { shareCode: commitment.shareCode! };
  }

  async joinChallenge(shareCode: string, userId: string): Promise<Commitment> {
    // Ensure user exists, create if not
    await this.ensureUserExists(userId);

    const commitment = await this.prisma.commitment.findUnique({
      where: { shareCode },
    });

    if (!commitment) {
      throw new NotFoundException('Invalid share code');
    }

    if (commitment.type !== 'collaborative') {
      throw new NotFoundException('This challenge is not collaborative');
    }

    // Check if user is already a participant
    const existingParticipant = await this.prisma.commitmentParticipant.findUnique({
      where: {
        commitmentId_userId: {
          commitmentId: commitment.id,
          userId,
        },
      },
    });

    if (!existingParticipant) {
      await this.prisma.commitmentParticipant.create({
        data: {
          commitmentId: commitment.id,
          userId,
        },
      });
    }

    return this.findOne(commitment.id);
  }

  async viewSharedChallenge(shareCode: string): Promise<Commitment> {
    const commitment = await this.prisma.commitment.findUnique({
      where: { shareCode },
    });

    if (!commitment) {
      throw new NotFoundException('Invalid share code');
    }

    return this.findOne(commitment.id);
  }

  async getParticipants(commitmentId: string): Promise<string[]> {
    const participants = await this.prisma.commitmentParticipant.findMany({
      where: { commitmentId },
      select: { userId: true },
    });

    return participants.map(p => p.userId);
  }

  async getCollaborativeCommitments(userId: string): Promise<Commitment[]> {
    try {
      // Get commitments where user is the owner
      const ownedCommitments = await this.prisma.commitment.findMany({
        where: {
          userId,
          type: 'collaborative',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get commitments where user is a participant
      const participantRecords = await this.prisma.commitmentParticipant.findMany({
        where: { userId },
        select: { commitmentId: true },
      });

      const participantCommitmentIds = participantRecords.map(p => p.commitmentId);

      const participantCommitments = participantCommitmentIds.length > 0
        ? await this.prisma.commitment.findMany({
            where: {
              id: { in: participantCommitmentIds },
              type: 'collaborative',
            },
            orderBy: { createdAt: 'desc' },
          })
        : [];

      // Combine and deduplicate
      const allCommitments = [...ownedCommitments, ...participantCommitments];
      const uniqueCommitments = Array.from(
        new Map(allCommitments.map(c => [c.id, c])).values()
      );

      return uniqueCommitments.map(c => ({
        id: c.id,
        title: c.title,
        type: c.type,
        userId: c.userId,
        shareCode: c.shareCode || undefined,
        ownerId: c.ownerId || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('Failed to fetch collaborative commitments');
      this.logDatabaseConnectionError(error, 'fetch collaborative commitments');
      throw error;
    }
  }

  // Completion methods
  async toggleCompletion(commitmentId: string, date: string, userId: string): Promise<Completion[]> {
    // Ensure user exists, create if not
    await this.ensureUserExists(userId);

    const existing = await this.prisma.completion.findUnique({
      where: {
        commitmentId_userId_date: {
          commitmentId,
          userId,
          date,
        },
      },
    });

    if (existing) {
      // Remove completion
      await this.prisma.completion.delete({
        where: {
          commitmentId_userId_date: {
            commitmentId,
            userId,
            date,
          },
        },
      });
    } else {
      // Add completion
      await this.prisma.completion.create({
        data: {
          commitmentId,
          userId,
          date,
        },
      });
    }

    return this.getCompletionsForCommitment(commitmentId, userId);
  }

  async getCompletionsForCommitment(commitmentId: string, userId?: string): Promise<Completion[]> {
    const where: any = { commitmentId };
    if (userId) {
      where.userId = userId;
    }

    const completions = await this.prisma.completion.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return completions.map(c => ({
      id: c.id,
      commitmentId: c.commitmentId,
      userId: c.userId,
      date: c.date,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async getAllCompletions(): Promise<Completion[]> {
    const completions = await this.prisma.completion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return completions.map(c => ({
      id: c.id,
      commitmentId: c.commitmentId,
      userId: c.userId,
      date: c.date,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  // Helper method to ensure user exists
  private async ensureUserExists(userId: string): Promise<void> {
    try {
      await this.usersService.findOrCreate(userId);
    } catch (error) {
      // If user creation fails, log but don't throw (allows offline mode)
      console.error(`Failed to ensure user exists: ${userId}`, error);
    }
  }
}

