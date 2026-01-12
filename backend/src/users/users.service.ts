import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(name?: string, id?: string) {
    const user = await this.prisma.user.create({
      data: {
        id: id || undefined, // If ID provided, use it; otherwise let Prisma generate UUID
        name,
      },
    });

    return {
      id: user.id,
      name: user.name || undefined,
    };
  }

  async findOrCreate(id: string, name?: string) {
    let user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id,
          name,
        },
      });
    }

    return {
      id: user.id,
      name: user.name || undefined,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      name: user.name || undefined,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => ({
      id: user.id,
      name: user.name || undefined,
    }));
  }
}

