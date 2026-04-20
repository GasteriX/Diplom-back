import { UserRole } from '../entities/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
