import { UserRole } from '@qnoffice/shared';

export type AccessTokenPayload = {
  mezonId: string;
  role: UserRole | null;
};
