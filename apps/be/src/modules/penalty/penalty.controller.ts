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
import {
  IPaginationDto,
  Penalty as IPenalty,
  UserRole,
} from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
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
  async create(@Body() createPenaltyDto: CreatePenaltyDto): Promise<IPenalty> {
    return this.penaltyService.create(createPenaltyDto) as any;
  }

  @Get()
  async findAll(
    @Query() queries: AppPaginateOptionsDto,
  ): Promise<IPaginationDto<IPenalty>> {
    return this.penaltyService.findAll(queries) as any;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<IPenalty> {
    return this.penaltyService.findOne(id) as any;
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePenaltyDto: UpdatePenaltyDto,
  ): Promise<IPenalty> {
    return this.penaltyService.update(id, updatePenaltyDto) as any;
  }

  @Put(':id/evidence')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async updateEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEvidenceDto: UpdatePenaltyEvidenceDto,
  ): Promise<IPenalty> {
    return this.penaltyService.updateEvidence(id, updateEvidenceDto) as any;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR])
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.penaltyService.remove(id);
  }
}
