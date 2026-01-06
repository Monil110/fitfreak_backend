import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async daily(userId: string, date: string) {
    const d = new Date(date);

    const diet = await this.prisma.diet.findMany({
      where: { userId, date: d },
    });

    const workouts = await this.prisma.workout.findMany({
      where: { userId, date: d },
    });

    return {
      calories: {
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

  async weekly(userId: string, start: string) {
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const diet = await this.prisma.diet.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
    });

    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
    });

    return {
      totals: {
        eaten: diet.reduce((a, b) => a + b.calories, 0),
        burned: workouts.reduce((a, b) => a + b.calories, 0),
        protein: diet.reduce((a, b) => a + b.protein, 0),
        carbs: diet.reduce((a, b) => a + b.carbs, 0),
        fats: diet.reduce((a, b) => a + b.fats, 0),
      },
    };
  }

  async monthly(userId: string, month: string) {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const diet = await this.prisma.diet.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
    });

    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
    });

    return {
      totals: {
        eaten: diet.reduce((a, b) => a + b.calories, 0),
        burned: workouts.reduce((a, b) => a + b.calories, 0),
        protein: diet.reduce((a, b) => a + b.protein, 0),
        carbs: diet.reduce((a, b) => a + b.carbs, 0),
        fats: diet.reduce((a, b) => a + b.fats, 0),
      },
    };
  }
}
