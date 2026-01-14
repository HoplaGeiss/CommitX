import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
    
    // P2025 is "Record not found" - not a connection error
    if (errorCode === 'P2025') {
      return; // Don't log connection error messages for "not found" errors
    }
    
    // Prisma "Invalid invocation" errors often indicate database connection issues
    const isInvalidInvocation = errorString.includes('invalid') && errorString.includes('invocation');
    const isConnectionError = errorString.includes('connect econnrefused') || 
                              errorString.includes('connection refused') ||
                              errorString.includes('econnrefused') ||
                              errorString.includes('getaddrinfo enotfound') ||
                              errorString.includes('timeout') ||
                              errorCode === 'ECONNREFUSED' ||
                              isInvalidInvocation;
    
    if (isConnectionError || (errorName.includes('PrismaClient') && errorCode !== 'P2025')) {
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
    // Generate a 6-digit numeric code (100000 to 999999)
    const min = 100000;
    const max = 999999;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code.toString();
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
          // Check if there's a soft-deleted participant to restore
          const deletedParticipant = await this.prisma.commitmentParticipant.findFirst({
            where: {
              commitmentId: commitment.id,
              userId: createCommitmentDto.userId,
              deleted: true,
            },
          });

          if (deletedParticipant) {
            // Restore soft-deleted participant
            await this.prisma.commitmentParticipant.update({
              where: { id: deletedParticipant.id },
              data: { deleted: false },
            });
          } else {
            // Create new participant
            await this.prisma.commitmentParticipant.create({
              data: {
                commitmentId: commitment.id,
                userId: createCommitmentDto.userId,
              },
            });
          }
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
        deleted: commitment.deleted,
      };
    } catch (error) {
      this.logger.error('Failed to create commitment');
      this.logDatabaseConnectionError(error, 'create commitment');
      throw error;
    }
  }

  async findAll(userId?: string): Promise<Commitment[]> {
    try {
      const where = userId ? { userId, deleted: false } : { deleted: false };
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
        deleted: c.deleted,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch commitments');
      this.logDatabaseConnectionError(error, 'fetch commitments');
      throw error;
    }
  }

  async findOne(id: string): Promise<Commitment> {
    const commitment = await this.prisma.commitment.findFirst({
      where: { id, deleted: false },
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
      deleted: commitment.deleted,
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
        deleted: commitment.deleted,
      };
    } catch (error: any) {
      // Handle "record not found" error (P2025)
      if (error?.code === 'P2025') {
        throw new NotFoundException(`Commitment with ID ${id} not found`);
      }
      
      this.logger.error(`Failed to update commitment ${id}`);
      this.logDatabaseConnectionError(error, 'update commitment');
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const commitment = await this.prisma.commitment.findFirst({
        where: { id, deleted: false },
        include: { participants: { where: { deleted: false } } },
      });

      if (!commitment) {
        throw new NotFoundException(`Commitment with ID ${id} not found`);
      }

      // For collaborative commitments, check if user is creator or participant
      if (commitment.type === 'collaborative') {
        const isCreator = commitment.userId === userId;
        const isParticipant = commitment.participants.some(p => p.userId === userId);

        if (isCreator) {
          // Creator soft deletes the entire commitment and all its completions
          await this.prisma.commitment.update({
            where: { id },
            data: { deleted: true },
          });
          
          // Soft-delete all completions for this commitment
          await this.prisma.completion.updateMany({
            where: {
              commitmentId: id,
              deleted: false,
            },
            data: { deleted: true },
          });
          
          // Soft-delete all participants
          await this.prisma.commitmentParticipant.updateMany({
            where: {
              commitmentId: id,
              deleted: false,
            },
            data: { deleted: true },
          });
        } else if (isParticipant) {
          // Participant leaves the challenge (soft delete their participation AND completions)
          await this.prisma.commitmentParticipant.updateMany({
            where: {
              commitmentId: id,
              userId,
              deleted: false,
            },
            data: { deleted: true },
          });
          
          // Also soft-delete their completions for this commitment
          await this.prisma.completion.updateMany({
            where: {
              commitmentId: id,
              userId,
              deleted: false,
            },
            data: { deleted: true },
          });
        } else {
          throw new NotFoundException('You are not a participant of this challenge');
        }
      } else {
        // For non-collaborative commitments, only creator can delete
        if (commitment.userId !== userId) {
          throw new NotFoundException('You do not have permission to delete this commitment');
        }
        await this.prisma.commitment.update({
          where: { id },
          data: { deleted: true },
        });
        
        // Also soft-delete all completions for this commitment
        await this.prisma.completion.updateMany({
          where: {
            commitmentId: id,
            deleted: false,
          },
          data: { deleted: true },
        });
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
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
    const existingParticipant = await this.prisma.commitmentParticipant.findFirst({
      where: {
        commitmentId: commitment.id,
        userId,
        deleted: false,
      },
    });

    if (existingParticipant) {
      // User is already a participant, return the commitment
      return this.findOne(commitment.id);
    }

    // Check participant limit (max 2 participants: creator + 1 other)
    const participantCount = await this.prisma.commitmentParticipant.count({
      where: {
        commitmentId: commitment.id,
        deleted: false,
      },
    });

    // Block if already at or above limit (2 participants = creator + 1 other)
    // Check BEFORE adding to prevent exceeding limit
    if (participantCount >= 2) {
      this.logger.warn(`Attempted to join full challenge. Commitment: ${commitment.id}, Current count: ${participantCount}, User: ${userId}`);
      throw new BadRequestException('This collaborative challenge is full. Maximum 2 participants allowed (creator + 1 other).');
    }

    // Add the new participant (or restore if soft-deleted)
    const deletedParticipant = await this.prisma.commitmentParticipant.findFirst({
      where: {
        commitmentId: commitment.id,
        userId,
        deleted: true,
      },
    });

    if (deletedParticipant) {
      // Restore the soft-deleted participant (start fresh, no completion restoration)
      await this.prisma.commitmentParticipant.update({
        where: { id: deletedParticipant.id },
        data: { deleted: false },
      });
      // Note: We don't restore old completions - user starts with a clean slate
    } else {
      // Create new participant
      await this.prisma.commitmentParticipant.create({
        data: {
          commitmentId: commitment.id,
          userId,
        },
      });
    }

    // Verify we didn't exceed limit after adding
    const newCount = await this.prisma.commitmentParticipant.count({
      where: {
        commitmentId: commitment.id,
        deleted: false,
      },
    });
    
    if (newCount > 2) {
      this.logger.error(`ERROR: Challenge exceeded participant limit! Commitment: ${commitment.id}, Count: ${newCount}`);
      // Note: We've already added the participant, so we can't easily rollback here
      // This should not happen if the check above works correctly
    }

    return this.findOne(commitment.id);
  }

  async viewSharedChallenge(shareCode: string): Promise<Commitment> {
    const commitment = await this.prisma.commitment.findFirst({
      where: { shareCode, deleted: false },
    });

    if (!commitment) {
      throw new NotFoundException('Invalid share code');
    }

    return this.findOne(commitment.id);
  }

  async getParticipants(commitmentId: string): Promise<string[]> {
    const participants = await this.prisma.commitmentParticipant.findMany({
      where: { commitmentId, deleted: false },
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
          deleted: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get commitments where user is a participant
      const participantRecords = await this.prisma.commitmentParticipant.findMany({
        where: { userId, deleted: false },
        select: { commitmentId: true },
      });

      const participantCommitmentIds = participantRecords.map(p => p.commitmentId);

      const participantCommitments = participantCommitmentIds.length > 0
        ? await this.prisma.commitment.findMany({
            where: {
              id: { in: participantCommitmentIds },
              type: 'collaborative',
              deleted: false,
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
        deleted: c.deleted,
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

    const existing = await this.prisma.completion.findFirst({
      where: {
        commitmentId,
        userId,
        date,
        deleted: false,
      },
    });

    if (existing) {
      // Soft delete completion
      await this.prisma.completion.update({
        where: { id: existing.id },
        data: { deleted: true },
      });
    } else {
      // Check if a deleted completion exists and restore it
      const deletedCompletion = await this.prisma.completion.findFirst({
        where: {
          commitmentId,
          userId,
          date,
          deleted: true,
        },
      });

      if (deletedCompletion) {
        // Restore deleted completion
        await this.prisma.completion.update({
          where: { id: deletedCompletion.id },
          data: { deleted: false },
        });
      } else {
        // Create new completion
        await this.prisma.completion.create({
          data: {
            commitmentId,
            userId,
            date,
          },
        });
      }
    }

    return this.getCompletionsForCommitment(commitmentId, userId);
  }

  async getCompletionsForCommitment(commitmentId: string, userId?: string): Promise<Completion[]> {
    const where: any = { commitmentId };
    if (userId) {
      where.userId = userId;
    }

    // Return ALL completions (including deleted ones with deleted flag)
    // Frontend will handle filtering and sync logic
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
      updatedAt: c.updatedAt.toISOString(),
      deleted: c.deleted,
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
      updatedAt: c.updatedAt.toISOString(),
      deleted: c.deleted,
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

