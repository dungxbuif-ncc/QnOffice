import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@qnoffice/shared';
import { BranchEntity } from '@src/modules/branch/branch.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import UserEntity from '@src/modules/user/user.entity';
import { In, Repository } from 'typeorm';

interface StaffData {
  email: string;
  mezonId: string;
  username: string;
  avatar?: string;
}

const staffData: StaffData[] = [
  {
    email: 'dung.buihuu@ncc.asia',
    mezonId: '1783704549828071424',
    username: 'dung.buihuu',
    avatar:
      'https://cdn.mezon.vn/1779484504377790464/1835536744175374336/1783704549828071400/93213FC618D_1B51_4523_8696_71BF856223AA.jpg',
  },
  {
    email: 'dung.phammanh@ncc.asia',
    mezonId: '1840686084447539200',
    username: 'dung.phammanh',
    avatar:
      'https://cdn.mezon.ai/0/0/1840686084447539200/1759803515387dfac6f32_981e_46f9_b519_d9149912f97b.jpg',
  },
  {
    email: 'duy.huynhle@ncc.asia',
    mezonId: '1808804849073000448',
    username: 'duy.huynhle',
    avatar:
      'https://cdn.mezon.vn/1779484504377790464/1841290471456903168/1808804849073000400/1737101626560_undefinedFILTER_Duy_Hu_nh_L__2025_01_14T08_41_37.311876_0.736352.jpg',
  },
  {
    email: 'duy.nguyenxuan@ncc.asia',
    mezonId: '1783444920736944128',
    username: 'duy.nguyenxuan',
    avatar:
      'https://profile.mezon.ai/1783444920736944128/1993324876521279488.jpg',
  },
  {
    email: 'du.levanky@ncc.asia',
    mezonId: '1831919339888971776',
    username: 'du.levanky',
    avatar:
      'https://profile.mezon.ai/0/0/1831919339888971800/17632003319187d88ddb2_8d07_40de_9843_4bb8bb9ee567.jpg',
  },
  {
    email: 'dat.haquoc@ncc.asia',
    mezonId: '1840655335266717696',
    username: 'dat.haquoc',
    avatar:
      'https://cdn.mezon.ai/0/1840655335266717696/1840655335266717700/1758687168318_1758686688102_image.png',
  },
  {
    email: 'hien.nguyenthanh@ncc.asia',
    mezonId: '1831544806493392896',
    username: 'hien.nguyenthanh',
    avatar:
      'https://profile.mezon.ai/1831544806493392896/2003029951896358912.jpg',
  },
  {
    email: 'hoang.tranlehuy@ncc.asia',
    mezonId: '1820658435042054144',
    username: 'hoang.tranlehuy',
    avatar:
      'https://cdn.mezon.ai/0/0/1820658435042054100/17587692287914c5d7f8d_2757_4609_a89e_40aa56e21f9c.jpg',
  },
  {
    email: 'huy.trannam@ncc.asia',
    mezonId: '1829060217363501056',
    username: 'huy.trannam',
    avatar:
      'https://cdn.mezon.vn/0/0/1829060217363501000/1737102264008_undefinedFILTER_Huy_Tr_n_Nam_2025_01_07T18_14_49.467747_0.838946.jpg',
  },
  {
    email: 'kien.trinhduy@ncc.asia',
    mezonId: '1833328046103334912',
    username: 'kien.trinhduy',
    avatar:
      'https://cdn.mezon.ai/1779484504377790464/1841290471456903168/1833328046103335000/17596388050956770E1BF_6F2D_446D_AD12_C13C80D78BA0.jpg',
  },
  {
    email: 'lich.duongthanh@ncc.asia',
    mezonId: '1927188401887383552',
    username: 'lich.duongthanh',
    avatar:
      'https://profile.mezon.ai/1927188401887383552/2002307808044781568.jpg',
  },
  {
    email: 'loi.huynhphuc@ncc.asia',
    mezonId: '1783448659447255040',
    username: 'loi.huynhphuc',
    avatar:
      'https://cdn.mezon.vn/1779484504377790464/1833152700116635648/1783448659447255000/565_undefined78cf683d40a541096b129434d9cb447c.webp',
  },
  {
    email: 'minh.dovan@ncc.asia',
    mezonId: '1783445135443365888',
    username: 'minh.dovan',
    avatar:
      'https://cdn.mezon.vn/0/0/1783445135443366000/559_undefinedMinh_o_Van_2024_08_06T08_25_24.747_0.601099.jpg',
  },
  {
    email: 'ngan.tonthuy@ncc.asia',
    mezonId: '1820647107783036928',
    username: 'ngan.tonthuy',
    avatar:
      'https://profile.mezon.ai/1820647107783036928/1998300398942687232.jpg',
  },
  {
    email: 'nguyen.nguyenphuoc@ncc.asia',
    mezonId: '1782991817428439040',
    username: 'nguyen.nguyenphuoc',
    avatar:
      'https://profile.mezon.ai/0/0/1782991817428439000/1763036413605d2626b40_86d8_4239_9e80_0f8bee514145.jpg',
  },
  {
    email: 'phuong.nguyenhonghang@ncc.asia',
    mezonId: '1831919325993242624',
    username: 'phuong.nguyenhonghang',
    avatar:
      'https://cdn.mezon.ai/1779484504377790464/1831919325993242624/1831919325993242600/1756282412864_drink_coffee_with_fire.jpg',
  },
  {
    email: 'tam.daonhon@ncc.asia',
    mezonId: '1831911016607256576',
    username: 'tam.daonhon',
    avatar:
      'https://profile.mezon.ai/1831911016607256576/2001658687306862592.jpg',
  },
  {
    email: 'thang.thieuquang@ncc.asia',
    mezonId: '1840668623337689088',
    username: 'thang.thieuquang',
    avatar:
      'https://cdn.mezon.ai/0/0/1840668623337689000/175913878502154823d0f_911a_405d_96cc_4ebd26b32d28.jpg',
  },
  {
    email: 'thuan.nguyenleanh@ncc.asia',
    mezonId: '1793507391073947648',
    username: 'thuan.nguyenleanh',
    avatar:
      'https://profile.mezon.ai/1779484504377790464/1841290471456903168/1793507391073947600/17631765639154e199e1c_1a11_4d12_81fe_f52c1515b80e.jpg',
  },
  {
    email: 'tien.caothicam@ncc.asia',
    mezonId: '1826837790373974016',
    username: 'tien.caothicam',
    avatar:
      'https://profile.mezon.ai/1826837790373974016/1998408847823212544.jpg',
  },
  {
    email: 'tien.nguyenvan@ncc.asia',
    mezonId: '1797817660197572608',
    username: 'tien.nguyenvan',
    avatar:
      'https://profile.mezon.ai/0/1797817660197572608/1797817660197572600/1762937907079_image1.webp',
  },
  {
    email: 'trinh.truongthiphuong@ncc.asia',
    mezonId: '1835971722642198528',
    username: 'trinh.truongthiphuong',
    avatar:
      'https://cdn.mezon.vn/0/0/1835971722642198500/17390265071281000004979.jpg',
  },
  {
    email: 'tuan.nguyentrong@ncc.asia',
    mezonId: '1820647905879396352',
    username: 'tuan.nguyentrong',
    avatar:
      'https://profile.mezon.ai/0/1820647905879396352/1820647905879396400/1762243079866_1762243019447_1IMG_6750.JPG',
  },
];

const roleMapping: Record<string, UserRole> = {
  'ngan.tonthuy@ncc.asia': UserRole.HR,
  'duy.nguyenxuan@ncc.asia': UserRole.GDVP,
};

@Injectable()
export class StaffSeeder {
  constructor(
    @InjectRepository(StaffEntity)
    private readonly staffRepository: Repository<StaffEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async seed(): Promise<void> {
    const branch = await this.branchRepository.findOneBy({ code: 'QN' });
    if (!branch) {
      Logger.error('Branch with code QN not found. Staff seeding aborted.');
      return;
    }

    const existingStaff = await this.staffRepository.find({
      where: { email: In(staffData.map((s) => s.email)) },
    });
    const existingUsers = await this.userRepository.find({
      where: { mezonId: In(staffData.map((s) => s.mezonId)) },
    });

    const existingEmails = new Set(existingStaff.map((staff) => staff.email));
    const existingMezonIds = new Set(existingUsers.map((user) => user.mezonId));

    const usersToCreate: UserEntity[] = [];
    const staffToCreate: StaffEntity[] = [];

    staffData.forEach((data) => {
      if (!existingMezonIds.has(data.mezonId)) {
        usersToCreate.push(
          this.userRepository.create({
            mezonId: data.mezonId,
            email: data.email,
            name: data.username,
            avatar: data.avatar,
          }),
        );
      }

      if (!existingEmails.has(data.email)) {
        staffToCreate.push(
          this.staffRepository.create({
            email: data.email,
            role: roleMapping[data.email] ?? UserRole.STAFF,
            branchId: branch.id,
            userId: data.mezonId,
          }),
        );
      }
    });

    if (usersToCreate.length > 0) {
      await this.userRepository.save(usersToCreate);
      Logger.log(`✓ Created ${usersToCreate.length} users in batch`);
    }

    if (staffToCreate.length > 0) {
      await this.staffRepository.save(staffToCreate);
      Logger.log(`✓ Created ${staffToCreate.length} staff members in batch`);
    }

    Logger.log('Staff seeding completed!');
  }
}
