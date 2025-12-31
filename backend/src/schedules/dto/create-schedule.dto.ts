import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  date: string;

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
