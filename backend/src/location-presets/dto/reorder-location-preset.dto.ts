import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class ReorderLocationPresetDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
