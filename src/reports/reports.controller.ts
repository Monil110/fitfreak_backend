import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('daily')
  daily(@Req() req, @Query('date') date: string) {
    return this.service.daily(req.user.userId, date);
  }

  @Get('weekly')
  weekly(@Req() req, @Query('start') start: string) {
    return this.service.weekly(req.user.userId, start);
  }

  @Get('monthly')
  monthly(@Req() req, @Query('month') month: string) {
    return this.service.monthly(req.user.userId, month);
  }
}
