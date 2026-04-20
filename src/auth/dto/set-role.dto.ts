import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/enums';

export class SetRoleDto {
  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.ADMIN,
  })
  role!: UserRole;
}
