import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateLocationPresetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
