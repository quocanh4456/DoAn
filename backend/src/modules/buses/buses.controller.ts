import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Buses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/buses')
export class BusesController {
  constructor(private busesService: BusesService) {}

  @Roles('Admin')
  @Get()
  findAll(@Query('search') search?: string) {
    return this.busesService.findAll(search);
  }

  @Roles('Admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.busesService.findOne(id);
  }

  @Roles('Admin')
  @Post()
  create(@Body() dto: CreateBusDto) {
    return this.busesService.create(dto);
  }

  @Roles('Admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBusDto,
  ) {
    return this.busesService.update(id, dto);
  }

  @Roles('Admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.busesService.remove(id);
  }
}
