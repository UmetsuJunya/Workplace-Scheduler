import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule, ConfigModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
