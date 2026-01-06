import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

import { ProfileModule } from './profile/profile.module';
import { WorkoutModule } from './workout/workout.module';
import { DietModule } from './diet/diet.module';
import { ScheduleModule } from './schedule/schedule.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
