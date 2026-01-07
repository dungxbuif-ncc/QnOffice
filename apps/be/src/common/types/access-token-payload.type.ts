import { UserRole } from '@src/common/enums/user-role.enum';

export type AccessTokenPayload = {
  mezonId: string;
  role: UserRole | null;
};
