import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
