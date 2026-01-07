import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { Penalty } from '@src/modules/penalty/penalty.entity';
import { CreatePenaltyDto } from './dto/create-penalty.dto';
import { UpdatePenaltyEvidenceDto } from './dto/update-penalty-evidence.dto';
import { UpdatePenaltyDto } from './dto/update-penalty.dto';
import { PenaltyService } from './penalty.service';

@Controller('penalties')
@UseGuards(JwtAuthGuard)
export class PenaltyController {
  constructor(private readonly penaltyService: PenaltyService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR])
  async create(@Body() createPenaltyDto: CreatePenaltyDto) {
    return this.penaltyService.create(createPenaltyDto);
  }

  @Get()
  async findAll(
    @Query() queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<Penalty>> {
    return this.penaltyService.findAll(queries);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.penaltyService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePenaltyDto: UpdatePenaltyDto,
  ) {
    return this.penaltyService.update(id, updatePenaltyDto);
  }

  @Put(':id/evidence')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  updateEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEvidenceDto: UpdatePenaltyEvidenceDto,
  ) {
    return this.penaltyService.updateEvidence(id, updateEvidenceDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR])
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.penaltyService.remove(id);
  }
}
