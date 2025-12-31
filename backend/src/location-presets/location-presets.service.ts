import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationPresetDto } from './dto/create-location-preset.dto';
import { UpdateLocationPresetDto } from './dto/update-location-preset.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class LocationPresetsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createLocationPresetDto: CreateLocationPresetDto) {
    const maxOrderResult = await this.prisma.locationPreset.aggregate({
      _max: {
        order: true,
      },
    });

    const order = createLocationPresetDto.order ?? (maxOrderResult._max.order ?? -1) + 1;

    const location = await this.prisma.locationPreset.create({
      data: {
        ...createLocationPresetDto,
        order,
      },
    });

    this.eventsGateway.emitLocationCreated(location);
    return location;
  }

  async findAll() {
    return this.prisma.locationPreset.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const locationPreset = await this.prisma.locationPreset.findUnique({
      where: { id },
    });

    if (!locationPreset) {
      throw new NotFoundException(`Location preset with ID "${id}" not found`);
    }

    return locationPreset;
  }

  async update(id: string, updateLocationPresetDto: UpdateLocationPresetDto) {
    await this.findOne(id); // Check if preset exists

    const location = await this.prisma.locationPreset.update({
      where: { id },
      data: updateLocationPresetDto,
    });

    this.eventsGateway.emitLocationUpdated(location);
    return location;
  }

  async remove(id: string) {
    await this.findOne(id); // Check if preset exists
    await this.prisma.locationPreset.delete({
      where: { id },
    });
    this.eventsGateway.emitLocationDeleted({ id });
  }

  async reorder(ids: string[]) {
    // Update order for each preset
    const updatePromises = ids.map((id, index) =>
      this.prisma.locationPreset.update({
        where: { id },
        data: { order: index },
      }),
    );

    await Promise.all(updatePromises);

    const locations = await this.findAll();
    this.eventsGateway.emitLocationReordered(locations);
    return locations;
  }
}
