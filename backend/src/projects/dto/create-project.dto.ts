import { IsString, IsArray, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}
