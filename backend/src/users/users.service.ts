import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventsGateway } from '../events/events.gateway';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { name: createUserDto.name },
    });

    if (existingUser) {
      throw new ConflictException('User with this name already exists');
    }

    // Hash password if provided and not already hashed
    // bcrypt hashes start with $2b$, $2a$, or $2y$
    const data = { ...createUserDto };
    if (data.password && !data.password.startsWith('$2')) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // Convert email to lowercase for case-insensitive comparison
    if (data.email) {
      data.email = data.email.toLowerCase();
    }

    const user = await this.prisma.user.create({
      data,
    });

    // Emit WebSocket event
    this.eventsGateway.emitUserCreated(user);

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        projects: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
        schedules: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByName(name: string) {
    return this.prisma.user.findUnique({
      where: { name }
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.name && updateUserDto.name !== user.name) {
      const existingUser = await this.prisma.user.findUnique({
        where: { name: updateUserDto.name },
      });
      if (existingUser) {
        throw new ConflictException('User with this name already exists');
      }
    }

    // Hash password if provided and not already hashed
    // bcrypt hashes start with $2b$, $2a$, or $2y$
    const data = { ...updateUserDto };
    if (updateUserDto.password && !updateUserDto.password.startsWith('$2')) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Convert email to lowercase for case-insensitive comparison
    if (data.email) {
      data.email = data.email.toLowerCase();
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    // Emit WebSocket event
    this.eventsGateway.emitUserUpdated(updatedUser);

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.findOne(id); // Check if user exists
    await this.prisma.user.delete({
      where: { id },
    });

    // Emit WebSocket event
    this.eventsGateway.emitUserDeleted({ id: user.id });
  }
}
