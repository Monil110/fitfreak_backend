import { Controller, Get, Post, Put, Delete, Req, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private service: ScheduleService) {}

  @Get()
  list(@Req() req) {
    return this.service.list(req.user.userId);
  }

  @Post()
  create(@Req() req, @Body() body: CreateScheduleDto) {
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
