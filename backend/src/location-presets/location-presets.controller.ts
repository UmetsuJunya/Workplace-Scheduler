import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LocationPresetsService } from './location-presets.service';
import { CreateLocationPresetDto } from './dto/create-location-preset.dto';
import { UpdateLocationPresetDto } from './dto/update-location-preset.dto';
import { ReorderLocationPresetDto } from './dto/reorder-location-preset.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('location-presets')
@UseGuards(OptionalJwtAuthGuard)
export class LocationPresetsController {
  constructor(private readonly locationPresetsService: LocationPresetsService) {}

  @Post()
  create(@Body() createLocationPresetDto: CreateLocationPresetDto) {
    return this.locationPresetsService.create(createLocationPresetDto);
  }

  @Post('reorder')
  reorder(@Body() reorderDto: ReorderLocationPresetDto) {
    return this.locationPresetsService.reorder(reorderDto.ids);
  }

  @Get()
  findAll() {
    return this.locationPresetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationPresetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLocationPresetDto: UpdateLocationPresetDto) {
    return this.locationPresetsService.update(id, updateLocationPresetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationPresetsService.remove(id);
  }
}
