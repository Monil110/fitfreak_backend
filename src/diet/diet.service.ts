import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DietService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const data = await this.prisma.diet.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return data.map(d => ({ _id: d.id, ...d }));
  }

  async create(userId: string, data: any) {
  const diet = await this.prisma.diet.create({
    data: {
      ...data,
      date: new Date(data.date),
      userId,
    },
  });
  return { _id: diet.id, ...diet };
}


  update(id: string, userId: string, data: any) {
    return this.prisma.diet.updateMany({
      where: { id, userId },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
      },
    });
  }

  delete(id: string, userId: string) {
    return this.prisma.diet.deleteMany({ where: { id, userId } });
  }
}
