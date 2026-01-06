import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const diet = await this.prisma.diet.findMany({
      where: { userId, date: new Date(today) },
    });

    const workouts = await this.prisma.workout.findMany({
      where: { userId, date: new Date(today) },
    });

    return {
      todayCalories: {
        eaten: diet.reduce((a, b) => a + b.calories, 0),
        burned: workouts.reduce((a, b) => a + b.calories, 0),
      },
      macros: {
        protein: diet.reduce((a, b) => a + b.protein, 0),
        carbs: diet.reduce((a, b) => a + b.carbs, 0),
        fats: diet.reduce((a, b) => a + b.fats, 0),
      },
    };
  }
}
