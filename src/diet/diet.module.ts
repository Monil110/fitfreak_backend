import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DietService } from './diet.service';
import { DietController } from './diet.controller';

@Module({
  imports: [PrismaModule],
  providers: [DietService],
  controllers: [DietController],
})
export class DietModule {}
