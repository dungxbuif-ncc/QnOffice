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
import { Holiday, IPaginationDto, UserRole } from '@qnoffice/shared';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import CreateHolidayDto from '@src/modules/holiday/dtos/create-holiday.dto';
import CreateHolidaysRangeDto from '@src/modules/holiday/dtos/create-holidays-range.dto';
import { HolidayQuery } from '@src/modules/holiday/dtos/holiday.query';
import UpdateHolidayDto from '@src/modules/holiday/dtos/update-holiday.dto';
import { HolidayService } from '@src/modules/holiday/holiday.service';

@Controller('holidays')
@ApiTags('Holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllHolidays(
    @Query() query: HolidayQuery,
  ): Promise<IPaginationDto<Holiday>> {
    return this.holidayService.getAllHolidays(query) as any;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getHolidayById(@Param('id') id: number): Promise<Holiday> {
    return this.holidayService.getHolidayById(id) as any;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async createHoliday(@Body() body: CreateHolidayDto): Promise<Holiday> {
    return this.holidayService.createHoliday(body) as any;
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async createHolidaysByRange(
    @Body() body: CreateHolidaysRangeDto,
  ): Promise<Holiday[]> {
    return this.holidayService.createHolidaysByRange(body) as any;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async updateHoliday(
    @Param('id') id: number,
    @Body() body: UpdateHolidayDto,
  ): Promise<Holiday> {
    return this.holidayService.updateHoliday(id, body) as any;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async deleteHoliday(@Param('id') id: number): Promise<void> {
    return this.holidayService.deleteHoliday(id);
  }
}
