import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationPresetsService } from './location-presets.service';
import { LocationPresetsController } from './location-presets.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule, ConfigModule],
  controllers: [LocationPresetsController],
  providers: [LocationPresetsService],
  exports: [LocationPresetsService],
})
export class LocationPresetsModule {}
