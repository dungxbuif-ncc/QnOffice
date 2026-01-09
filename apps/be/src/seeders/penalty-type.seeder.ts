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
        name: 'Vắng mặt Opentalk Offline',
        description:
          'Tham gia ít nhất 01 buổi offline/tháng tại văn phòng. Không tham gia: phạt 20k/lần (cộng dồn nếu tái phạm liên tiếp)',
        amount: 20000,
      },
      {
        name: 'Dọn dẹp - Khu vực cá nhân',
        description: 'Không giữ sạch khu vực cá nhân (bàn ghế)',
        amount: 10000,
      },
      {
        name: 'Dọn dẹp - Khu vực chung',
        description: 'Không giữ sạch khu vực chung (pantry, tủ lạnh...)',
        amount: 10000,
      },
      {
        name: 'Dọn dẹp - Dép không xếp gọn',
        description: 'Dép không xếp gọn lên kệ',
        amount: 10000,
      },
      {
        name: 'Thói quen văn phòng - Quên khoá máy',
        description: 'Quên khoá máy khi rời chỗ',
        amount: 10000,
      },
      {
        name: 'Thói quen văn phòng - Quên kéo ghế',
        description: 'Quên kéo ghế khi rời chỗ',
        amount: 10000,
      },
      {
        name: 'Thói quen văn phòng - Không tập thể dục',
        description: 'Không tập thể dục theo quy định',
        amount: 10000,
      },
      {
        name: 'Pantry - Người cuối không tắt thiết bị',
        description: 'Người ra cuối cùng không tắt toàn bộ thiết bị điện',
        amount: 10000,
      },
      {
        name: 'Pantry - Không dọn dẹp',
        description: 'Không dọn dẹp gọn gàng trước khi rời đi',
        amount: 10000,
      },
      {
        name: 'Pantry - Không trả đồ đúng chỗ',
        description: 'Đồ dùng không đặt lại đúng chỗ',
        amount: 10000,
      },
      {
        name: 'Pantry - Không châm nước khay đá',
        description: 'Tủ lạnh: Lấy đá không bẻ hết khay và châm nước đầy lại',
        amount: 10000,
      },
      {
        name: 'Không tham gia Opentalk',
        description: 'Không tham gia buổi Opentalk',
        amount: 20000,
      },
      {
        name: 'Nghiêm trọng - Không tắt máy lạnh/khóa cửa',
        description: 'Không tắt máy lạnh hoặc không khóa cửa khi rời văn phòng',
        amount: 500000,
      },
    ];

    await this.penaltyTypeRepository.save(penaltyTypes);
    console.log(`Seeded ${penaltyTypes.length} penalty types successfully`);
  }
}
