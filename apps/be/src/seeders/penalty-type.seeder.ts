import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PenaltyType } from '@src/modules/penalty-type/penalty-type.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PenaltyTypeSeeder {
  constructor(
    @InjectRepository(PenaltyType)
    private readonly penaltyTypeRepository: Repository<PenaltyType>,
  ) {}

  async seed(): Promise<void> {
    console.log('Seeding penalty types...');

    const existingCount = await this.penaltyTypeRepository.count();
    if (existingCount > 0) {
      console.log('Penalty types already exist, skipping seed');
      return;
    }

    const penaltyTypes = [
      {
        name: 'Missing Opentalk Offline Session',
        description:
          'Tham gia ít nhất 01 buổi offline/tháng tại VP. Không tham gia: phạt 20k/lần (cộng dồn nếu tái phạm liên tiếp)',
        amount: 20000,
      },
      {
        name: 'Cleaning - Personal Area',
        description: 'Không giữ sạch khu vực cá nhân (bàn ghế)',
        amount: 10000,
      },
      {
        name: 'Cleaning - Common Area',
        description: 'Không giữ sạch khu vực chung (pantry, tủ lạnh...)',
        amount: 10000,
      },
      {
        name: 'Cleaning - Sandals Not Organized',
        description: 'Dép không xếp gọn lên kệ',
        amount: 10000,
      },
      {
        name: 'Office Habits - Forgot to Lock Computer',
        description: 'Quên lock máy khi rời chỗ',
        amount: 10000,
      },
      {
        name: 'Office Habits - Forgot to Pull Chair',
        description: 'Quên kéo ghế khi rời chỗ',
        amount: 10000,
      },
      {
        name: 'Office Habits - Not Following Exercise Schedule',
        description: 'Không tập thể dục theo quy định',
        amount: 10000,
      },
      {
        name: 'Pantry - Last Person Not Turning Off Devices',
        description: 'Người ra cuối cùng không tắt toàn bộ thiết bị điện',
        amount: 10000,
      },
      {
        name: 'Pantry - Not Cleaning Up',
        description: 'Không dọn dẹp gọn gàng trước khi rời đi',
        amount: 10000,
      },
      {
        name: 'Pantry - Not Returning Items',
        description: 'Đồ dùng không đặt lại đúng chỗ',
        amount: 10000,
      },
      {
        name: 'Pantry - Not Refilling Ice Tray',
        description: 'Tủ lạnh: Lấy đá không bẻ hết khay và châm nước đầy lại',
        amount: 10000,
      },
      {
        name: 'Not Joining Opentalk',
        description: 'Không tham gia buổi Opentalk',
        amount: 20000,
      },
      {
        name: 'Critical - AC or Door Not Locked',
        description: 'Không tắt máy lạnh hoặc không khóa cửa khi rời văn phòng',
        amount: 500000,
      },
    ];

    await this.penaltyTypeRepository.save(penaltyTypes);
    console.log(`Seeded ${penaltyTypes.length} penalty types successfully`);
  }
}
