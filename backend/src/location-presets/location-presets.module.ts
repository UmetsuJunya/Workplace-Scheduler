import { Module } from '@nestjs/common';
import { LocationPresetsService } from './location-presets.service';
import { LocationPresetsController } from './location-presets.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [LocationPresetsController],
  providers: [LocationPresetsService],
  exports: [LocationPresetsService],
})
export class LocationPresetsModule {}
