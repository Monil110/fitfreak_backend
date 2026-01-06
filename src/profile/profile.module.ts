import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [PrismaModule],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
