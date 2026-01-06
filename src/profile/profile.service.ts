import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  get(userId: string) {
    return this.prisma.profile.findUnique({ where: { userId } });
  }

  save(userId: string, data: any) {
    return this.prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  }
}
