import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

import { ProfileModule } from './profile/profile.module';
import { WorkoutModule } from './workout/workout.module';
import { DietModule } from './diet/diet.module';
import { ScheduleModule } from './schedule/schedule.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { EnvValidation } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const validatedConfig = plainToInstance(
          EnvValidation,
          config,
          { enableImplicitConversion: true },
        );
        const errors = validateSync(validatedConfig, {
          skipMissingProperties: false,
        });
        if (errors.length > 0) {
          throw new Error('Invalid environment variables');
        }
        return validatedConfig;
      },
    }),

    PrismaModule,
    AuthModule,

    ProfileModule,
    WorkoutModule,
    DietModule,
    ScheduleModule,
    DashboardModule,
    ReportsModule,
  ],
})
export class AppModule {}
