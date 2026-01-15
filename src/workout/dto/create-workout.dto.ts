import { IsString, IsInt, Min, IsDateString } from 'class-validator';

export class CreateWorkoutDto {
  @IsString()
  exercise: string;

  @IsInt()
  @Min(1)
  sets: number;

  @IsInt()
  @Min(1)
  reps: number;

  @IsInt()
  @Min(0)
  weight: number;

  @IsInt()
  @Min(0)
  calories: number;

  @IsDateString()
  date: string;
}
