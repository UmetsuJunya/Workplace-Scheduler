import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateLocationPresetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
