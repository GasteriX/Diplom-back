import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../entities/enums';

export class SetRoleDto {
  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
