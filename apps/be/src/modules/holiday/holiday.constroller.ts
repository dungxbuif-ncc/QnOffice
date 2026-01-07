import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@qnoffice/shared';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import CreateHolidayDto from '@src/modules/holiday/dtos/create-holiday.dto';
import CreateHolidaysRangeDto from '@src/modules/holiday/dtos/create-holidays-range.dto';
import { HolidayQuery } from '@src/modules/holiday/dtos/holiday.query';
import UpdateHolidayDto from '@src/modules/holiday/dtos/update-holiday.dto';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { HolidayService } from '@src/modules/holiday/holiday.service';

@Controller('holidays')
@ApiTags('Holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllHolidays(
    @Query() query: HolidayQuery,
  ): Promise<AppPaginationDto<HolidayEntity>> {
    return this.holidayService.getAllHolidays(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getHolidayById(@Param('id') id: number): Promise<HolidayEntity> {
    return this.holidayService.getHolidayById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async createHoliday(@Body() body: CreateHolidayDto): Promise<HolidayEntity> {
    return this.holidayService.createHoliday(body);
  }
  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async createHolidaysByRange(
    @Body() body: CreateHolidaysRangeDto,
  ): Promise<HolidayEntity[]> {
    return this.holidayService.createHolidaysByRange(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async updateHoliday(
    @Param('id') id: number,
    @Body() body: UpdateHolidayDto,
  ): Promise<HolidayEntity> {
    return this.holidayService.updateHoliday(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async deleteHoliday(@Param('id') id: number): Promise<void> {
    return this.holidayService.deleteHoliday(id);
  }
}
