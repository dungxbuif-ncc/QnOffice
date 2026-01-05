import { UserRole } from '@src/common/constants/user.constants';

export type AccessTokenPayload = {
  mezonId: string;
  role: UserRole;
};
