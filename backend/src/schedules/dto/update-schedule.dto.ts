import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  am?: string;

  @IsOptional()
  @IsString()
  pm?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
