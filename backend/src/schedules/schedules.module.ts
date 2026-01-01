import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule, ConfigModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
