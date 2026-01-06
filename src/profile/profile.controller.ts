import { Controller, Get, Put, Req, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ProfileService } from './profile.service';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get()
  get(@Req() req) {
    return this.service.get(req.user.userId);
  }

  @Put()
  save(@Req() req, @Body() body) {
    return this.service.save(req.user.userId, body);
  }
}
