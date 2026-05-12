import { UserRole } from '../entities/enums';

/** `access` — обычный вход; `email_verification` — только для ссылки подтверждения почты */
export type JwtTokenType = 'access' | 'email_verification';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  /** Новые access-токены всегда с `access`; старые без поля считаем access для совместимости */
  typ?: JwtTokenType;
}
