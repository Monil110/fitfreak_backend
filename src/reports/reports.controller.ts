import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ReportsService } from "./reports.service";

@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get("daily")
  daily(@Req() req, @Query("date") date: string) {
    return this.service.daily(req.user.sub, date);
  }

  @Get("weekly")
  weekly(@Req() req, @Query("start") start: string) {
    return this.service.weekly(req.user.sub, start);
  }

  @Get("monthly")
  monthly(@Req() req, @Query("month") month: string) {
    return this.service.monthly(req.user.sub, month);
  }
  @Get("exercises")
  getExercises(@Req() req) {
    return this.service.getExercises(req.user.sub);
  }


  @Get("exercise-progress")
  exerciseProgress(
    @Req() req,
    @Query("exercise") exercise: string,
    @Query("metric") metric: "weight" | "reps"
  ) {
    return this.service.exerciseProgress(
      req.user.sub,
      exercise,
      metric
    );
  }
}
