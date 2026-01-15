import { IsString, IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  task: string;

  @IsDateString()
  date: string;

  @IsString()
  time: string;
}
