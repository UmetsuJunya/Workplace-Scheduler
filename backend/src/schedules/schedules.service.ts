import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { EventsGateway } from '../events/events.gateway';
import { AuthenticatedUser } from '../auth/interfaces';
import { ScheduleUpdateData } from './interfaces';
@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createScheduleDto: CreateScheduleDto) {
    // Check if schedule already exists for this user and date
    const existing = await this.prisma.schedule.findUnique({
      where: {
        userId_date: {
          userId: createScheduleDto.userId,
          date: new Date(createScheduleDto.date),
        },
      },
    });

    if (existing) {
      // Update existing schedule instead
      return this.update(existing.id, createScheduleDto);
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        ...createScheduleDto,
        date: new Date(createScheduleDto.date),
      },
      include: {
        user: true,
      },
    });

    this.eventsGateway.emitScheduleCreated(schedule);
    return schedule;
  }

  async findAll() {
    return this.prisma.schedule.findMany({
      include: {
        user: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async findByDateRange(startDate: string, endDate: string) {
    return this.prisma.schedule.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        user: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.schedule.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID "${id}" not found`);
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto, user?: AuthenticatedUser) {
    const schedule = await this.findOne(id); // Check if schedule exists

    // Check ownership if user is provided and not an admin
    if (user && user.role !== 'ADMIN' && schedule.userId !== user.userId) {
      throw new ForbiddenException('You can only update your own schedules');
    }

    const updateData: ScheduleUpdateData = {
      am: updateScheduleDto.am,
      pm: updateScheduleDto.pm,
      note: updateScheduleDto.note,
    };
    if (updateScheduleDto.date) {
      updateData.date = new Date(updateScheduleDto.date);
    }

    const updatedSchedule = await this.prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    });

    this.eventsGateway.emitScheduleUpdated(updatedSchedule);
    return updatedSchedule;
  }

  async remove(id: string, user?: AuthenticatedUser) {
    const schedule = await this.findOne(id); // Check if schedule exists

    // Check ownership if user is provided and not an admin
    if (user && user.role !== 'ADMIN' && schedule.userId !== user.userId) {
      throw new ForbiddenException('You can only delete your own schedules');
    }

    await this.prisma.schedule.delete({
      where: { id },
    });
    this.eventsGateway.emitScheduleDeleted({ id });
  }

  async bulkCreate(schedules: CreateScheduleDto[]) {
    const createdSchedules = [];
    for (const scheduleDto of schedules) {
      // Upsert: 既存のスケジュールがあれば更新、なければ作成
      const schedule = await this.prisma.schedule.upsert({
        where: {
          userId_date: {
            userId: scheduleDto.userId,
            date: new Date(scheduleDto.date),
          },
        },
        update: {
          am: scheduleDto.am,
          pm: scheduleDto.pm,
          note: scheduleDto.note,
        },
        create: {
          userId: scheduleDto.userId,
          date: new Date(scheduleDto.date),
          am: scheduleDto.am,
          pm: scheduleDto.pm,
          note: scheduleDto.note,
        },
        include: {
          user: true,
        },
      });
      createdSchedules.push(schedule);
      this.eventsGateway.emitScheduleCreated(schedule);
    }
    return createdSchedules;
  }
}
