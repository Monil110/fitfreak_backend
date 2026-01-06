import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const data = await this.prisma.schedule.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    return data.map(s => ({ _id: s.id, ...s }));
  }

  create(userId: string, data: any) {
    return this.prisma.schedule.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId,
      },
    });
  }

  update(id: string, userId: string, data: any) {
    return this.prisma.schedule.updateMany({
      where: { id, userId },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
      },
    });
  }

  delete(id: string, userId: string) {
    return this.prisma.schedule.deleteMany({ where: { id, userId } });
  }
}
