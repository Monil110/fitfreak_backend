import { Controller, Get, Post, Put, Delete, Req, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { WorkoutService } from './workout.service';

@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutController {
  constructor(private service: WorkoutService) {}

  @Get()
  list(@Req() req) {
    return this.service.list(req.user.userId);
  }

  @Post()
  create(@Req() req, @Body() body) {
    return this.service.create(req.user.userId, body);
  }

  @Put(':id')
  update(@Req() req, @Param('id') id, @Body() body) {
    return this.service.update(id, req.user.userId, body);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') id) {
    return this.service.delete(id, req.user.userId);
  }
}
