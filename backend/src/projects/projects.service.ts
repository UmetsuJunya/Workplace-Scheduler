import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createProjectDto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        users: {
          create: createProjectDto.userIds.map((userId) => ({
            user: {
              connect: { id: userId },
            },
          })),
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    this.eventsGateway.emitProjectCreated(project);
    return project;
  }

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id); // Check if project exists

    // Delete all existing user associations
    if (updateProjectDto.userIds) {
      await this.prisma.projectUser.deleteMany({
        where: { projectId: id },
      });
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(updateProjectDto.name && { name: updateProjectDto.name }),
        ...(updateProjectDto.userIds && {
          users: {
            create: updateProjectDto.userIds.map((userId) => ({
              user: {
                connect: { id: userId },
              },
            })),
          },
        }),
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    this.eventsGateway.emitProjectUpdated(project);
    return project;
  }

  async remove(id: string) {
    await this.findOne(id); // Check if project exists
    await this.prisma.project.delete({
      where: { id },
    });
    this.eventsGateway.emitProjectDeleted({ id });
  }
}
