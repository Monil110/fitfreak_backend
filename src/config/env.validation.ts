import { IsString, IsOptional, IsNumberString } from 'class-validator';

export class EnvValidation {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;
}
