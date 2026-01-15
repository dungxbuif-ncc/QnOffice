import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StaffStatus } from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import CreateStaffDto from '@src/modules/staff/dtos/create-staff.dto';
import StaffEntity from '@src/modules/staff/staff.entity';
import { UserService } from '@src/modules/user/user.service';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffEntity)
    private readonly staffRepository: Repository<StaffEntity>,
    private readonly userService: UserService,
  ) {}

  async findByUserId(userId: string): Promise<StaffEntity | null> {
    return this.staffRepository.findOne({
      where: { userId },
      relations: ['user', 'branch'],
    });
  }

  async findByEmail(email: string): Promise<StaffEntity | null> {
    return this.staffRepository.findOneBy({ email });
  }

  async getStaffs(
    queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<StaffEntity>> {
    const { skip, take, q } = queries;

    const [data, total] = await this.staffRepository.findAndCount({
      where: q
        ? {
            email: ILike(`%${q}%`),
          }
        : {},
      skip,
      take,
    });
    return {
      page: queries.page,
      pageSize: queries.take,
      total,
      result: data,
    };
  }

  async createStaff(staffPayload: CreateStaffDto): Promise<StaffEntity> {
    const [existingUser, existingStaff] = await Promise.all([
      this.userService.findByEmail(staffPayload.email),
      this.staffRepository.findOneBy({ email: staffPayload.email }),
    ]);

    if (existingStaff) {
      throw new BadRequestException('Staff with this email already exists');
    }
    return this.staffRepository.save(
      this.staffRepository.create({
        ...staffPayload,
        userId: (existingUser?.mezonId || null) as string | null,
      }),
    );
  }

  async updateStaffUserId(
    staffId: number,
    userId: string | null,
  ): Promise<StaffEntity> {
    const staff = await this.staffRepository.findOneBy({ id: staffId });
    if (!staff) {
      throw new BadRequestException('Staff not found');
    }
    staff.userId = userId;
    return this.staffRepository.save(staff);
  }

  async getAllActiveStaff(): Promise<StaffEntity[]> {
    return this.staffRepository.find({
      where: { status: StaffStatus.ACTIVE },
      order: { email: 'ASC' },
    });
  }

  async findById(id: number): Promise<StaffEntity | null> {
    return this.staffRepository.findOneBy({ id });
  }
}
