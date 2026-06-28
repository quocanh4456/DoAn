import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@Controller('api/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Roles('Admin', 'Staff')
  @Get('shift-report')
  getShiftReport(@Req() req: any) {
    return this.reportsService.getStaffShiftReport(req.user.id);
  }

  @Get('summary')
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('revenue')
  getRevenue(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getRevenue(from, to);
  }

  @Get('trips')
  getTripStats(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getTripStats(from, to);
  }

  @Get('route-revenue')
  getRouteRevenue(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getRouteRevenue(from, to);
  }

  
  @Get('forecast')
  getForecast(
    @Query('days', new DefaultValuePipe(14), ParseIntPipe) days: number,
  ) {
    return this.reportsService.getForecast(days);
  }

  
  @Get('route-insights')
  getRouteInsights() {
    return this.reportsService.getRouteInsights();
  }

  
  @Get('rfm-segments')
  getRfmSegments() {
    return this.reportsService.getRfmSegments();
  }

  
  @Get('low-demand-alerts')
  getLowDemandAlerts() {
    return this.reportsService.getLowDemandAlerts();
  }
}
