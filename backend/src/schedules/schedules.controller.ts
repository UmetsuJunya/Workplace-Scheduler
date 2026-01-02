import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, UseGuards, Request } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { OwnScheduleOrAdminGuard } from '../auth/guards/own-schedule-or-admin.guard';
import { AuthenticatedUser } from '../auth/interfaces';

@Controller('schedules')
@UseGuards(OptionalJwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @UseGuards(OwnScheduleOrAdminGuard)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Post('bulk')
  @UseGuards(OwnScheduleOrAdminGuard)
  bulkCreate(@Body() schedules: CreateScheduleDto[]) {
    return this.schedulesService.bulkCreate(schedules);
  }

  @Get()
  findAll(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    if (startDate && endDate) {
      return this.schedulesService.findByDateRange(startDate, endDate);
    }
    return this.schedulesService.findAll();
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.schedulesService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OwnScheduleOrAdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Request() req: Request & { user?: AuthenticatedUser },
  ) {
    return this.schedulesService.update(id, updateScheduleDto, req.user);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(OwnScheduleOrAdminGuard)
  remove(
    @Param('id') id: string,
    @Request() req: Request & { user?: AuthenticatedUser },
  ) {
    return this.schedulesService.remove(id, req.user);
  }
}
