import { IsString, IsInt, Min, IsDateString } from 'class-validator';

export class CreateDietDto {
  @IsString()
  food: string;

  @IsInt()
  @Min(0)
  calories: number;

  @IsInt()
  @Min(0)
  protein: number;

  @IsInt()
  @Min(0)
  carbs: number;

  @IsInt()
  @Min(0)
  fats: number;

  @IsString()
  time: string;

  @IsDateString()
  date: string;
}
