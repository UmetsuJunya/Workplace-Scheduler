import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LocationPresetsService } from './location-presets.service';
import { CreateLocationPresetDto } from './dto/create-location-preset.dto';
import { UpdateLocationPresetDto } from './dto/update-location-preset.dto';

@Controller('location-presets')
export class LocationPresetsController {
  constructor(private readonly locationPresetsService: LocationPresetsService) {}

  @Post()
  create(@Body() createLocationPresetDto: CreateLocationPresetDto) {
    return this.locationPresetsService.create(createLocationPresetDto);
  }

  @Post('reorder')
  reorder(@Body() body: { ids: string[] }) {
    return this.locationPresetsService.reorder(body.ids);
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
