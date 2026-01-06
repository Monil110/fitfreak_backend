import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';

@Module({
  imports: [PrismaModule],
  providers: [WorkoutService],
  controllers: [WorkoutController],
})
export class WorkoutModule {}
